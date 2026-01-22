import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { getPlanByPriceId, getPlans } from "@/config/payment-config"
import { db } from "@/db"
import { payment } from "@/db/payment.schema"
import { PaymentService } from "@/integrations/payment"
import { auth } from "@/shared/lib/auth/auth-server"
import { logger } from "@/shared/lib/tools/logger"
import { PaymentTypes, PlanTypes } from "@/shared/types/payment"

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
        .filter((plan) => plan.planType === PlanTypes.LIFETIME)
        .map((plan) => plan.id)

      if (lifetimePlanIds.length === 0) {
        return {
          success: false,
          error: "No lifetime plans defined in the system",
        }
      }

      const result = await db
        .select({
          id: payment.id,
          priceId: payment.priceId,
          type: payment.type,
        })
        .from(payment)
        .where(
          and(
            eq(payment.userId, userId),
            eq(payment.type, PaymentTypes.ONE_TIME),
            eq(payment.status, "completed")
          )
        )

      const lifetimePayment = result.find((paymentRecord) => {
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
      const paymentService = await PaymentService.create()

      const subscriptions = await paymentService.getSubscriptionsByUserId({
        userId: session.user.id,
      })

      let result = null

      if (subscriptions && subscriptions.length > 0) {
        const activeSubscription = subscriptions.find(
          (subscription) => subscription.status === "active" || subscription.status === "trialing"
        )

        if (activeSubscription) {
          logger.info(`Find active subscription for userId: ${session.user.id}`)
          result = activeSubscription
        } else {
          logger.info(`No active subscription found for userId: ${session.user.id}`)
        }
      }

      return { success: true, data: result }
    } catch (error) {
      return {
        success: false,
        message: "Get active subscription failed",
        error: error instanceof Error ? error.message : "Something went wrong",
      }
    }
  })
