import { createFileRoute } from "@tanstack/react-router"
import { createCryptoErrorResponse, logCryptoError } from "@/integrations/payment/crypto/errors"
import { fulfillPayRamPayment } from "@/integrations/payment/crypto/fulfillment"
import {
  getCryptoOrderMetadata,
  serializeCryptoOrderMetadata,
} from "@/integrations/payment/crypto/order-metadata"
import { payRamProvider } from "@/integrations/payment/crypto/providers/payram-provider"
import { Resp } from "@/shared/lib/tools/response"
import { findOrderById, updateOrderById } from "@/shared/model/order.model"
import type { PayRamCryptoOrderMetadata } from "@/shared/types/crypto"

function isLatePayment(metadata: PayRamCryptoOrderMetadata) {
  return new Date(metadata.providerExpiresAt ?? metadata.checkoutExpiresAt).getTime() < Date.now()
}

export async function handlePayRamWebhook(request: Request) {
  try {
    const rawBody = await request.text()
    const isValid = await payRamProvider.verifyWebhookRequest(request, rawBody)
    if (!isValid) {
      return Resp.error("Invalid webhook signature.", 401, "webhook_signature_invalid")
    }

    const payload = payRamProvider.parseWebhookPayload(request, rawBody)
    const url = new URL(request.url)
    const nestedMetadata =
      typeof payload.metadata === "object" && payload.metadata !== null
        ? (payload.metadata as Record<string, unknown>)
        : undefined
    const orderId =
      url.searchParams.get("orderId") ??
      (typeof payload.orderId === "string" ? payload.orderId : undefined) ??
      (typeof nestedMetadata?.orderId === "string" ? nestedMetadata.orderId : undefined)

    if (!orderId) {
      return Resp.error("Missing orderId", 400, "payment_validation_failed")
    }

    const currentOrder = await findOrderById(orderId)
    if (!currentOrder) {
      return Resp.error("Crypto checkout not found", 404, "payment_not_found", { orderId })
    }

    const currentMetadata = getCryptoOrderMetadata(currentOrder)
    if (!currentMetadata || currentMetadata.cryptoProvider !== "payram") {
      return Resp.error(
        "We could not validate this crypto payment.",
        400,
        "payment_validation_failed",
        { orderId }
      )
    }

    const transition = payRamProvider.mapWebhookTransition(payload, currentMetadata)
    if (
      transition.eventId &&
      currentMetadata.webhookEventId &&
      currentMetadata.webhookEventId === transition.eventId
    ) {
      return Resp.success({ status: "duplicate_ignored", orderId })
    }

    if (currentOrder.status === "paid" && transition.detailedStatus === "paid") {
      return Resp.success({ status: "already_paid", orderId })
    }

    if (transition.detailedStatus === "paid" && isLatePayment(currentMetadata)) {
      const lateMetadata: PayRamCryptoOrderMetadata = {
        ...currentMetadata,
        detailedStatus: "late_payment",
        reviewReason: "Payment arrived after checkout expiration and needs manual review.",
        payramStatus: transition.providerStatus,
        providerPaymentId: transition.providerPaymentId,
        ...(transition.eventId ? { webhookEventId: transition.eventId } : {}),
        webhookLastProcessedAt: new Date().toISOString(),
      }

      await updateOrderById(orderId, {
        metadata: serializeCryptoOrderMetadata(lateMetadata),
      })

      return Resp.success({ status: "late_payment_review", orderId })
    }

    const nextMetadata: PayRamCryptoOrderMetadata = {
      ...currentMetadata,
      detailedStatus: transition.detailedStatus,
      payramStatus: transition.providerStatus,
      providerPaymentId: transition.providerPaymentId,
      ...(transition.reviewReason ? { reviewReason: transition.reviewReason } : {}),
      ...(transition.eventId ? { webhookEventId: transition.eventId } : {}),
      webhookLastProcessedAt: new Date().toISOString(),
    }

    if (transition.detailedStatus === "paid") {
      await updateOrderById(orderId, {
        metadata: serializeCryptoOrderMetadata(nextMetadata),
      })
      await fulfillPayRamPayment({
        orderId,
        providerPaymentId: transition.providerPaymentId,
      })
      return Resp.success({ status: "paid", orderId })
    }

    await updateOrderById(orderId, {
      status: transition.orderStatus,
      metadata: serializeCryptoOrderMetadata(nextMetadata),
    })

    return Resp.success({ status: transition.detailedStatus, orderId })
  } catch (error) {
    logCryptoError("payram_webhook_failed", error)
    return createCryptoErrorResponse(error, {
      code: "payment_validation_failed",
      statusCode: 500,
      userMessage: "Failed to process PayRam webhook.",
    })
  }
}

export const Route = createFileRoute("/api/payment/webhook/crypto/payram" as never)({
  server: {
    handlers: {
      POST: async ({ request }) => handlePayRamWebhook(request),
      GET: async ({ request }) => handlePayRamWebhook(request),
    },
  },
})
