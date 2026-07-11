import { createFileRoute } from "@tanstack/react-router"
import { createCryptoErrorResponse, logCryptoError } from "@/integrations/payment/crypto/errors"
import { getCryptoOrderMetadata } from "@/integrations/payment/crypto/order-metadata"
import { cryptoStatusResolver } from "@/integrations/payment/crypto/status-resolver"
import { Resp } from "@/shared/lib/tools/response"
import { apiAuthMiddleware } from "@/shared/middleware/auth.middleware"
import { findOrderById } from "@/shared/model/order.model"

export async function handleCryptoCheckoutLoad({
  orderId,
  userId,
}: {
  orderId: string
  userId: string
}) {
  const currentOrder = await findOrderById(orderId)
  if (!currentOrder || currentOrder.userId !== userId) {
    return Resp.error("Crypto checkout not found", 404, "payment_not_found", { orderId })
  }

  const metadata = getCryptoOrderMetadata(currentOrder)
  if (!metadata) {
    return Resp.error(
      "We could not validate this crypto payment.",
      400,
      "payment_validation_failed",
      { orderId }
    )
  }

  try {
    const data = await cryptoStatusResolver.resolve(orderId)

    return Resp.success(data)
  } catch (error) {
    logCryptoError("crypto_checkout_load_failed", error, {
      orderId,
      userId,
    })

    return createCryptoErrorResponse(error, {
      code: "payment_validation_failed",
      statusCode: 500,
      orderId,
      userMessage: "Failed to load the crypto checkout. Please try again.",
    })
  }
}

export const Route = createFileRoute("/api/payment/crypto/$orderId")({
  server: {
    middleware: [apiAuthMiddleware],
    handlers: {
      GET: async ({ context, params }) => {
        const { orderId } = params as { orderId: string }
        return handleCryptoCheckoutLoad({
          orderId,
          userId: context.session.user.id,
        })
      },
    },
  },
})
