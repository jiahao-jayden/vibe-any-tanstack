import { getPlanById } from "@/config/payment-config"
import type { DbTransaction } from "@/db"
import { CreditService } from "@/services/credits.service"
import { logger } from "@/shared/lib/tools/logger"
import { CreditsType } from "@/shared/types/credit"

export interface ProcessCreditsParams {
  userId: string
  planId: string
  paymentId: string
  paymentType: "subscription_create" | "subscription_renewal" | "one_time"
  periodEnd?: Date
  tx?: DbTransaction
}

/**
 * Process credits after successful payment
 */
export async function processCredits(params: ProcessCreditsParams): Promise<void> {
  const { userId, planId, paymentId, paymentType, periodEnd, tx } = params

  const plan = getPlanById(planId)
  if (!plan?.credit) {
    logger.info(`Plan ${planId} has no credit configuration, skipping`)
    return
  }

  const creditService = new CreditService()

  // Calculate expiry date
  let expiresAt: Date | undefined
  if (paymentType === "subscription_create" || paymentType === "subscription_renewal") {
    // Subscription credits expire at the end of the billing period
    expiresAt = periodEnd
  } else if (plan.credit.expireDays) {
    // One-time payment credits expire after configured days
    expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + plan.credit.expireDays)
  }

  // Determine credit type
  const creditsType =
    paymentType === "one_time"
      ? CreditsType.ADD_ONE_TIME_PAYMENT
      : CreditsType.ADD_SUBSCRIPTION_PAYMENT

  await creditService.increaseCredits({
    userId,
    credits: plan.credit.amount,
    creditsType,
    paymentId,
    expiresAt,
    description: `Credits from ${paymentType} plan: ${planId}`,
    tx,
  })

  logger.info(
    `Processed ${plan.credit.amount} credits for user ${userId} from plan ${planId} (${paymentType})`
  )
}
