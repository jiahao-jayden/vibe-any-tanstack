import { createFileRoute } from "@tanstack/react-router"
import { createCryptoErrorResponse, logCryptoError } from "@/integrations/payment/crypto/errors"
import { solanaPaymentVerifier } from "@/integrations/payment/crypto/solana-payment-verifier"
import { logger } from "@/shared/lib/tools/logger"
import { Resp } from "@/shared/lib/tools/response"
import { apiAdminMiddleware } from "@/shared/middleware/auth.middleware"

export const Route = createFileRoute("/api/payment/crypto/$orderId/verify")({
  server: {
    middleware: [apiAdminMiddleware],
    handlers: {
      POST: async ({ context, params }) => {
        const { orderId } = params as { orderId: string }

        try {
          const result = await solanaPaymentVerifier.verifyPayment(orderId, { force: true })

          logger.info("crypto_verify_forced_by_admin", {
            orderId,
            adminUserId: context.session.user.id,
          })

          return Resp.success(result)
        } catch (error) {
          logCryptoError("crypto_verify_forced_failed", error, {
            orderId,
            adminUserId: context.session.user.id,
          })

          return createCryptoErrorResponse(error, {
            code: "payment_validation_failed",
            statusCode: 500,
            orderId,
            userMessage: "Failed to verify crypto payment. Please try again.",
          })
        }
      },
    },
  },
})
