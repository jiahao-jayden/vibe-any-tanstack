import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { and, eq, or } from "drizzle-orm"
import { z } from "zod"
import { getPlanByPriceId, getPlans } from "@/config/payment-config"
import { db } from "@/db"
import { payment } from "@/db/payment.schema"
import { subscription } from "@/db/subscription.schema"
import { auth } from "@/shared/lib/auth/auth-server"
import { logger } from "@/shared/lib/tools/logger"
import type { PlanType } from "@/shared/types/payment"

const userIdSchema = z.object({
  userId: z.string().min(1, { message: "User ID must be provided" }),
})

export const checkUserLifetimePurchaseAction = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => userIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { userId } = data

    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user) {
      logger.error(`Unauthorized user id: ${userId}`)
      return {
        success: false,
        error: "Unauthorized",
      }
    }

    try {
      const plans = getPlans()
      const lifetimePlanIds = plans
        .filter((plan) => plan.planType === ("lifetime" satisfies PlanType))
        .map((plan) => plan.id)

      if (lifetimePlanIds.length === 0) {
        return {
          success: true,
          data: {
            existsLifetimePayment: false,
            lifetimePriceId: undefined,
          },
        }
      }

      const result = await db
        .select({
          id: payment.id,
          priceId: payment.priceId,
          paymentType: payment.paymentType,
        })
        .from(payment)
        .where(
          and(
            eq(payment.userId, userId),
            eq(payment.paymentType, "one_time"),
            eq(payment.status, "succeeded")
          )
        )

      const lifetimePayment = result.find((paymentRecord) => {
        if (!paymentRecord.priceId) return false
        const plan = getPlanByPriceId(paymentRecord.priceId)
        return plan && lifetimePlanIds.includes(plan.id)
      })

      const existsLifetimePayment = !!lifetimePayment
      const lifetimePriceId = lifetimePayment?.priceId

      return {
        success: true,
        data: {
          existsLifetimePayment,
          lifetimePriceId,
        },
      }
    } catch (error) {
      logger.error(`Get lifetime status failed: ${error}`)
      return {
        success: false,
        error: "Get lifetime status failed",
      }
    }
  })

export const getUserActiveSubscriptionAction = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => userIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { userId } = data

    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })

    if (!session?.user) {
      logger.error(`Unauthorized user id: ${userId}`)
      return {
        success: false,
        error: "Unauthorized",
      }
    }

    try {
      const subscriptions = await db
        .select()
        .from(subscription)
        .where(
          and(
            eq(subscription.userId, session.user.id),
            or(eq(subscription.status, "active"), eq(subscription.status, "trialing"))
          )
        )

      if (subscriptions.length === 0) {
        logger.info(`No active subscription found for userId: ${session.user.id}`)
        return { success: true, data: null }
      }

      const activeSubscription = subscriptions[0]
      logger.info(`Find active subscription for userId: ${session.user.id}`)

      return {
        success: true,
        data: {
          id: activeSubscription.id,
          provider: activeSubscription.provider,
          userId: activeSubscription.userId,
          planId: activeSubscription.planId,
          priceId: activeSubscription.priceId,
          status: activeSubscription.status,
          interval: activeSubscription.interval,
          currentPeriodStart: activeSubscription.currentPeriodStart,
          currentPeriodEnd: activeSubscription.currentPeriodEnd,
          cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
          trialStart: activeSubscription.trialStart,
          trialEnd: activeSubscription.trialEnd,
          createdAt: activeSubscription.createdAt,
        },
      }
    } catch (error) {
      logger.error(`Get active subscription failed: ${error}`)
      return {
        success: false,
        message: "Get active subscription failed",
        error: error instanceof Error ? error.message : "Something went wrong",
      }
    }
  })
