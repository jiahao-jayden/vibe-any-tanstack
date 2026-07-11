import { createFileRoute } from "@tanstack/react-router"
import { getPlanById, getPriceById } from "@/config/payment-config"
import { getDefaultPaymentAdapter, getPaymentAdapter } from "@/integrations/payment/"
import { cryptoCheckoutService } from "@/integrations/payment/crypto/crypto-checkout-service"
import { isEnabledCryptoCurrency } from "@/integrations/payment/crypto/currencies"
import { createCryptoErrorResponse, logCryptoError } from "@/integrations/payment/crypto/errors"
import {
  generateProductName,
  getCheckoutPaymentType,
  getOrderTypeFromPlan,
} from "@/integrations/payment/utils"
import { OrderService } from "@/services/order.service"
import { logger } from "@/shared/lib/tools/logger"
import { Resp } from "@/shared/lib/tools/response"
import { apiAuthMiddleware } from "@/shared/middleware/auth.middleware"
import type { CheckoutProvider, PaymentProvider } from "@/shared/types/payment"

export async function handleCheckoutCreate({
  user,
  body,
}: {
  user: {
    id: string
    email: string
  }
  body: {
    planId?: string
    priceId?: string
    provider?: PaymentProvider
    currentOrderId?: string
    successUrl?: string
    cancelUrl?: string
    metadata?: Record<string, string | undefined>
  }
}) {
  let planId: string | undefined
  let priceId: string | undefined
  let provider: PaymentProvider | undefined
  let currentOrderId: string | undefined

  try {
    const userId = user.id
    ;({ planId, priceId, provider, currentOrderId } = body)
    const { successUrl, cancelUrl, metadata } = body

    if (!planId || !priceId) {
      return Resp.error("Missing required parameters: planId and priceId", 400)
    }

    const plan = getPlanById(planId)
    if (!plan) {
      return Resp.error(`Plan not found: ${planId}`, 400)
    }

    const price = getPriceById(planId, priceId)
    if (!price) {
      return Resp.error(`Price not found: ${priceId}`, 400)
    }

    if (provider === "crypto") {
      const cryptoCurrency = metadata?.cryptoCurrency
      if (!isEnabledCryptoCurrency(cryptoCurrency)) {
        return Resp.error("The selected crypto currency is invalid.", 400, "invalid_crypto_currency")
      }

      const result = await cryptoCheckoutService.createOrReuseCheckout({
        userId,
        userEmail: user.email,
        planId,
        priceId,
        cryptoCurrency,
        currentOrderId,
        successUrl,
        cancelUrl,
      })

      return Resp.success({
        provider: "crypto",
        orderId: result.orderId,
        sessionId: result.sessionId,
        checkoutUrl: result.checkoutUrl,
      })
    }

    const adapter = provider
      ? await getPaymentAdapter(provider as CheckoutProvider)
      : await getDefaultPaymentAdapter()

    const paymentType = getCheckoutPaymentType(plan.planType)

    if (paymentType === "subscription" && !adapter.capabilities.subscription) {
      return Resp.error(`Provider ${adapter.name} does not support subscriptions`, 400)
    }

    if (paymentType === "one_time" && !adapter.capabilities.oneTime) {
      return Resp.error(`Provider ${adapter.name} does not support one-time payments`, 400)
    }

    const orderService = new OrderService()
    const order = await orderService.createOrder({
      userId,
      orderType: getOrderTypeFromPlan(plan),
      productId: priceId,
      productName: generateProductName(plan.name || plan.id, price.interval),
      amount: price.amount,
      currency: price.currency,
      metadata: {
        ...metadata,
        planId,
        priceId,
      },
    })

    const result = await adapter.createCheckout({
      type: paymentType,
      orderId: order.id,
      planId,
      priceId,
      email: user.email,
      userId,
      successUrl: successUrl || `${process.env.VITE_APP_URL}/dashboard?success=true`,
      cancelUrl: cancelUrl || `${process.env.VITE_APP_URL}/pricing`,
      metadata: {
        ...metadata,
        planId,
        priceId,
      },
    })

    logger.info(`Checkout created: ${adapter.name} - ${result.sessionId} for order ${order.id}`)

    return Resp.success({
      provider: adapter.name,
      orderId: order.id,
      ...result,
    })
  } catch (error) {
    if (provider === "crypto") {
      logCryptoError("crypto_checkout_request_failed", error, {
        userId: user.id,
        planId,
        priceId,
        provider,
        currentOrderId,
      })

      return createCryptoErrorResponse(error, {
        code: "payment_validation_failed",
        statusCode: 500,
        userMessage: "Failed to create crypto checkout. Please try again.",
      })
    }

    logger.error("Error creating checkout:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return Resp.error(`Failed to create checkout: ${message}`, 500)
  }
}

export const Route = createFileRoute("/api/payment/checkout")({
  server: {
    middleware: [apiAuthMiddleware],
    handlers: {
      POST: async ({ context, request }) => {
        const body = await request.json()
        return handleCheckoutCreate({
          user: context.session.user,
          body,
        })
      },
    },
  },
})
