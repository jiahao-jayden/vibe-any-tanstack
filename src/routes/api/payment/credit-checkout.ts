import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"
import { z } from "zod/v4"
import { creditPackage, db } from "@/db"
import { getDefaultPaymentAdapter, getPaymentAdapter } from "@/integrations/payment/"
import { OrderService } from "@/services/order.service"
import { logger } from "@/shared/lib/tools/logger"
import { Resp } from "@/shared/lib/tools/response"
import { apiAuthMiddleware } from "@/shared/middleware/auth.middleware"
import { getConfig } from "@/shared/model/config.model"
import { findActiveSubscriptionByUserId } from "@/shared/model/subscription.model"
import type { PaymentProvider } from "@/shared/types/payment"

const checkoutSchema = z.object({
  packageId: z.string().uuid(),
  provider: z.string().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

export const Route = createFileRoute("/api/payment/credit-checkout")({
  server: {
    middleware: [apiAuthMiddleware],
    handlers: {
      POST: async ({ context, request }) => {
        try {
          const { user } = context.session
          const userId = user.id

          const body = await request.json()
          const data = checkoutSchema.parse(body)

          const allowFreePurchase = await getConfig("public_credit_allow_free_user_purchase")
          if (!allowFreePurchase) {
            const activeSub = await findActiveSubscriptionByUserId(userId)
            if (!activeSub) {
              return Resp.error("Free users are not allowed to purchase credit packages", 403)
            }
          }

          const [pkg] = await db
            .select()
            .from(creditPackage)
            .where(eq(creditPackage.id, data.packageId))

          if (!pkg) {
            return Resp.error("Credit package not found", 404)
          }

          if (!pkg.isActive) {
            return Resp.error("Credit package is not available", 400)
          }

          const adapter = data.provider
            ? await getPaymentAdapter(data.provider as PaymentProvider)
            : await getDefaultPaymentAdapter()

          if (!adapter.capabilities.oneTime) {
            return Resp.error(`Provider ${adapter.name} does not support one-time payments`, 400)
          }

          const orderService = new OrderService()
          const order = await orderService.createOrder({
            userId,
            orderType: "credit_package",
            productId: pkg.id,
            productName: pkg.name,
            amount: pkg.priceAmount,
            currency: pkg.currency,
            metadata: {
              packageId: pkg.id,
              creditAmount: pkg.creditAmount.toString(),
              expireDays: pkg.expireDays?.toString() ?? "null",
            },
          })

          const result = await adapter.createCheckout({
            type: "one_time",
            orderId: order.id,
            planId: pkg.id,
            priceId: pkg.stripePriceId,
            email: user.email,
            userId,
            successUrl: data.successUrl || `${process.env.VITE_APP_URL}/billing?success=true`,
            cancelUrl: data.cancelUrl || `${process.env.VITE_APP_URL}/billing`,
            metadata: {
              packageId: pkg.id,
              creditAmount: pkg.creditAmount.toString(),
              expireDays: pkg.expireDays?.toString() ?? "null",
            },
          })

          logger.info(
            `Credit checkout created: ${adapter.name} - ${result.sessionId} for order ${order.id}`
          )

          return Resp.success({
            provider: adapter.name,
            orderId: order.id,
            ...result,
          })
        } catch (error) {
          if (error instanceof z.ZodError) {
            return Resp.error(`Invalid data: ${error.issues.map((i) => i.message).join(", ")}`, 400)
          }
          logger.error("Error creating credit checkout:", error)
          const message = error instanceof Error ? error.message : "Unknown error"
          return Resp.error(`Failed to create checkout: ${message}`, 500)
        }
      },
    },
  },
})
