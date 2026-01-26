import { type DbTransaction, db } from "@/db"
import type { credits as creditsTable } from "@/db/credit.schema"
import { logger } from "@/shared/lib/tools/logger"
import { getConfig } from "@/shared/model/config.model"
import {
  getCreditsByUserId,
  getUserLatestDailyBonus,
  getUserValidCredits,
  insertCredits,
  updateCreditBalance,
} from "@/shared/model/credit.model"
import { CreditsType } from "@/shared/types/credit"

export interface IncreaseCreditsParams {
  userId: string
  credits: number
  creditsType: CreditsType
  paymentId?: string
  expiresAt?: Date
  description?: string
  tx?: DbTransaction
}

export interface DecreaseCreditsParams {
  userId: string
  credits: number
  creditsType: CreditsType
  description?: string
  tx?: DbTransaction
}

export interface DecreaseCreditsResult {
  remainingCredits: number
  transactionId: string
}

export class InsufficientCreditsError extends Error {
  constructor(required: number, available: number) {
    super(`Insufficient credits. Required: ${required}, Available: ${available}`)
    this.name = "InsufficientCreditsError"
  }
}

/** Minimum interval between daily bonus grants (24 hours in milliseconds) */
const DAILY_BONUS_INTERVAL_MS = 24 * 60 * 60 * 1000

export class CreditService {
  /**
   * Get user's available credits
   * - Real-time filtering: expired credits are excluded at query time
   * - No status update needed for expired credits
   * - Automatically grants daily bonus if enabled and eligible
   * - Returns next refresh time for daily bonus
   */
  public async getUserCredits(userId: string): Promise<{
    userCredits: number
    dailyBonusCredits: number
    nextRefreshTime: string | null
  }> {
    const creditData: {
      userCredits: number
      dailyBonusCredits: number
      nextRefreshTime: string | null
    } = {
      userCredits: 0,
      dailyBonusCredits: 0,
      nextRefreshTime: null,
    }

    try {
      await this.tryGrantDailyBonus(userId)

      const [credits, latestBonus, dailyEnabled] = await Promise.all([
        getUserValidCredits(userId),
        getUserLatestDailyBonus(userId, CreditsType.ADD_DAILY_BONUS),
        getConfig("public_credit_daily_enabled"),
      ])

      if (credits) {
        credits.forEach((c) => {
          if (c.creditsType !== CreditsType.ADD_DAILY_BONUS) {
            creditData.userCredits += c.credits || 0
          } else {
            creditData.dailyBonusCredits += c.credits || 0
          }
        })
      }

      // Calculate next refresh time if daily bonus is enabled
      if (dailyEnabled && latestBonus) {
        const nextRefresh = new Date(latestBonus.createdAt.getTime() + DAILY_BONUS_INTERVAL_MS)
        creditData.nextRefreshTime = nextRefresh.toISOString()
      }

      return creditData
    } catch (e) {
      console.log("get user credits failed: ", e)
      return creditData
    }
  }

  /**
   * Try to grant daily bonus credits to user if:
   * - Daily bonus feature is enabled
   * - User hasn't received daily bonus in the last 24 hours
   *
   */
  private async tryGrantDailyBonus(userId: string): Promise<boolean> {
    try {
      // Check if daily bonus feature is enabled
      const dailyEnabled = await getConfig("public_credit_daily_enabled")
      if (!dailyEnabled) {
        return false
      }

      // Validate bonus amount is configured
      const dailyAmount = await getConfig("public_credit_daily_amount")
      if (dailyAmount <= 0) {
        return false
      }

      // Get user's most recent daily bonus record
      const latestBonus = await getUserLatestDailyBonus(userId, CreditsType.ADD_DAILY_BONUS)

      // Skip if user already received bonus within the last 24 hours
      if (latestBonus) {
        const timeSinceLastBonus = Date.now() - latestBonus.createdAt.getTime()
        if (timeSinceLastBonus < DAILY_BONUS_INTERVAL_MS) {
          return false
        }
      }

      // Grant the daily bonus credits with 24-hour expiration
      await this.increaseCredits({
        userId,
        credits: dailyAmount,
        creditsType: CreditsType.ADD_DAILY_BONUS,
        expiresAt: new Date(Date.now() + DAILY_BONUS_INTERVAL_MS),
        description: `Daily bonus (${new Date().toISOString().split("T")[0]})`,
      })

      logger.info(`Granted daily bonus of ${dailyAmount} credits to user ${userId}`)
      return true
    } catch (error) {
      logger.error(`Failed to grant daily bonus to user ${userId}: ${error}`)
      return false
    }
  }

  public async getUserCreditsHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    days: number = 30
  ) {
    try {
      const creditsHistory = await getCreditsByUserId(userId, page, limit, days)
      return creditsHistory
    } catch (error) {
      logger.error(`Failed to get user credits history for user ${userId}: ${error}`)
      throw error
    }
  }

  public async increaseCredits(params: IncreaseCreditsParams) {
    try {
      const { userId, credits, paymentId, creditsType, expiresAt, description, tx } = params

      const data: typeof creditsTable.$inferInsert = {
        userId,
        paymentId,
        credits,
        transactionType: "credit",
        creditsType,
        expiresAt,
        description,
      }

      await insertCredits(data, tx)
    } catch (error) {
      logger.error(`Failed to increase credits: ${error}`)
    }
  }

  /**
   * Decrease user's credits using FIFO consumption
   * - Prioritizes daily bonus credits first
   * - Then consumes expiring credits (nearest expiry first)
   * - Finally consumes permanent credits
   * - Directly updates source credit records (no separate debit records needed for balance)
   * - Creates audit debit record for transaction history
   */
  public async decreaseCredits(params: DecreaseCreditsParams): Promise<DecreaseCreditsResult> {
    const { userId, credits: amount, creditsType, description, tx } = params

    if (amount <= 0) {
      throw new Error("Credits must be greater than 0")
    }

    const executeDecrease = async (dbTx: DbTransaction): Promise<DecreaseCreditsResult> => {
      const allCredits = await getUserValidCredits(userId, dbTx)
      if (!allCredits || allCredits.length === 0) {
        throw new InsufficientCreditsError(amount, 0)
      }

      const totalAvailable = allCredits.reduce((sum, c) => sum + c.credits, 0)
      if (totalAvailable < amount) {
        throw new InsufficientCreditsError(amount, totalAvailable)
      }

      const dailyBonusCredits = allCredits.filter(
        (c) => c.creditsType === CreditsType.ADD_DAILY_BONUS
      )
      const otherCredits = allCredits.filter((c) => c.creditsType !== CreditsType.ADD_DAILY_BONUS)
      const sortedCredits = [...dailyBonusCredits, ...otherCredits]

      let remainingToDeduct = amount
      const consumptionLog: Array<{
        id: string
        amount: number
        creditsType: string
        expiresAt: Date | null
      }> = []

      for (const credit of sortedCredits) {
        if (remainingToDeduct <= 0) break

        const deductAmount = Math.min(credit.credits, remainingToDeduct)
        const newBalance = credit.credits - deductAmount

        await updateCreditBalance(credit.id, newBalance, dbTx)

        consumptionLog.push({
          id: credit.id,
          amount: deductAmount,
          creditsType: credit.creditsType,
          expiresAt: credit.expiresAt,
        })

        remainingToDeduct -= deductAmount
      }

      const sourceInfo = consumptionLog
        .map(
          (log) =>
            `${log.amount} from ${log.creditsType}${log.expiresAt ? ` (exp: ${log.expiresAt.toISOString().split("T")[0]})` : ""}`
        )
        .join("; ")

      const auditData: typeof creditsTable.$inferInsert = {
        userId,
        paymentId: null,
        credits: -amount,
        transactionType: "debit",
        creditsType,
        expiresAt: null,
        description: description || `FIFO consumption: ${sourceInfo}`,
      }

      const result = await insertCredits(auditData, dbTx)

      return {
        remainingCredits: totalAvailable - amount,
        transactionId: result.transactionId,
      }
    }

    try {
      if (tx) {
        return await executeDecrease(tx)
      }

      return await db.transaction(async (dbTx) => {
        return await executeDecrease(dbTx)
      })
    } catch (error) {
      logger.error(`Failed to decrease credits for user ${userId}: ${error}`)
      throw error
    }
  }
}
