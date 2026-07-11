import { createFileRoute } from "@tanstack/react-router"
import { createCryptoErrorResponse, logCryptoError } from "@/integrations/payment/crypto/errors"
import { getCryptoOrderMetadata } from "@/integrations/payment/crypto/order-metadata"
import { evmDirectProvider } from "@/integrations/payment/crypto/providers/evm-direct-provider"
import { assertEvmTxSubmissionAllowed } from "@/integrations/payment/crypto/submit-tx-anti-abuse"
import { Resp } from "@/shared/lib/tools/response"
import { apiAuthMiddleware } from "@/shared/middleware/auth.middleware"
import { findOrderById } from "@/shared/model/order.model"

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",")
    if (firstIp?.trim()) {
      return firstIp.trim()
    }
  }

  return request.headers.get("cf-connecting-ip") ?? undefined
}

export async function handleEvmDirectTxSubmission(
  request: Request,
  params: { orderId: string; userId: string }
) {
  const { orderId, userId } = params

  try {
    const currentOrder = await findOrderById(orderId)
    if (!currentOrder || currentOrder.userId !== userId) {
      return Resp.error("Crypto checkout not found", 404, "payment_not_found", { orderId })
    }

    const metadata = getCryptoOrderMetadata(currentOrder)
    if (!metadata || metadata.cryptoProvider !== "evm_direct") {
      return Resp.error(
        "We could not validate this crypto payment.",
        400,
        "payment_validation_failed",
        { orderId }
      )
    }

    const body = (await request.json()) as { txHash?: string }
    const txHash = body.txHash ?? ""

    await assertEvmTxSubmissionAllowed({
      orderId,
      userId,
      cryptoCurrency: metadata.cryptoCurrency,
      txHash,
      clientIp: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    })

    const result = await evmDirectProvider.submitTransaction(orderId, txHash)

    return Resp.success(result)
  } catch (error) {
    logCryptoError("evm_tx_submission_failed", error, {
      orderId,
      userId,
    })

    return createCryptoErrorResponse(error, {
      code: "payment_validation_failed",
      statusCode: 500,
      orderId,
      userMessage: "Failed to submit the blockchain transaction hash. Please try again.",
    })
  }
}

export const Route = createFileRoute("/api/payment/crypto/$orderId/submit-tx" as never)({
  server: {
    middleware: [apiAuthMiddleware],
    handlers: {
      POST: async ({ context, params, request }) => {
        const authContext = context as { session: { user: { id: string } } }

        return handleEvmDirectTxSubmission(request, {
          orderId: (params as { orderId: string }).orderId,
          userId: authContext.session.user.id,
        })
      },
    },
  },
})
