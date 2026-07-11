import { eq } from "drizzle-orm"
import type { DbTransaction } from "@/db"
import { order } from "@/db/order.schema"
import type { PayRamCryptoOrderMetadata, ResolvedCryptoPrice } from "@/shared/types/crypto"
import type { CryptoCurrencyConfig } from "../currencies"
import { getPayRamConfig, isPayRamConfigured } from "../config"
import { CryptoPaymentError } from "../errors"
import { serializeCryptoOrderMetadata } from "../order-metadata"
import { payRamClient } from "../payram-client"

interface CreatePayRamCheckoutParams {
  tx: DbTransaction
  orderId: string
  userId: string
  userEmail: string
  planId: string
  priceId: string
  cryptoCurrency: CryptoCurrencyConfig["id"]
  currencyConfig: CryptoCurrencyConfig
  resolvedPrice: ResolvedCryptoPrice
  successUrl?: string
  cancelUrl?: string
}

function buildCallbackUrl(orderId: string) {
  const config = getPayRamConfig()
  return `${config.callbackBaseUrl}/api/payment/webhook/crypto/payram?orderId=${orderId}`
}

export class PayRamProvider {
  createDraftMetadata(params: Omit<CreatePayRamCheckoutParams, "tx" | "orderId" | "userId" | "userEmail">) {
    return {
      paymentMethod: "crypto" as const,
      cryptoProvider: "payram" as const,
      cryptoCurrency: params.cryptoCurrency,
      detailedStatus: "waiting_payment" as const,
      checkoutExpiresAt: new Date(
        Date.now() + params.currencyConfig.checkoutTimeout * 1000
      ).toISOString(),
      cryptoAmount: params.resolvedPrice.cryptoAmount,
      fiatAmount: params.resolvedPrice.fiatAmount,
      fiatCurrency: params.resolvedPrice.fiatCurrency,
      walletAddress: "",
      network: params.currencyConfig.payramNetwork ?? params.currencyConfig.chain,
      planId: params.planId,
      priceId: params.priceId,
      providerPaymentId: "",
      ...(params.resolvedPrice.quoteSource ? { quoteSource: params.resolvedPrice.quoteSource } : {}),
      ...(params.resolvedPrice.quoteRate ? { quoteRate: params.resolvedPrice.quoteRate } : {}),
      ...(params.resolvedPrice.quotedAt ? { quotedAt: params.resolvedPrice.quotedAt } : {}),
      ...(params.resolvedPrice.quoteExpiresAt
        ? { quoteExpiresAt: params.resolvedPrice.quoteExpiresAt }
        : {}),
      payramNetwork: params.currencyConfig.payramNetwork,
      payramCurrencyCode: params.currencyConfig.payramCurrencyCode,
      payramStandard: params.currencyConfig.payramStandard,
      ...(params.resolvedPrice.interval ? { priceInterval: params.resolvedPrice.interval } : {}),
    } satisfies PayRamCryptoOrderMetadata
  }

  async finalizeCheckout(params: CreatePayRamCheckoutParams) {
    if (!isPayRamConfigured()) {
      throw new CryptoPaymentError({
        code: "provider_unavailable",
        statusCode: 503,
        userMessage: "This crypto currency is temporarily unavailable.",
        orderId: params.orderId,
        message: "PayRam is not configured",
      })
    }

    const assignedPayment = await payRamClient.createAssignedPayment({
      amount: params.resolvedPrice.fiatAmount,
      currency: params.currencyConfig.payramCurrencyCode ?? params.cryptoCurrency.toUpperCase(),
      standard: params.currencyConfig.payramStandard,
      network: params.currencyConfig.payramNetwork ?? params.currencyConfig.chain,
      customerEmail: params.userEmail,
      customerId: params.userId,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      callbackUrl: buildCallbackUrl(params.orderId),
      metadata: {
        orderId: params.orderId,
        userId: params.userId,
        planId: params.planId,
        priceId: params.priceId,
        cryptoCurrency: params.cryptoCurrency,
      },
    })

    const finalMetadata: PayRamCryptoOrderMetadata = {
      paymentMethod: "crypto",
      cryptoProvider: "payram",
      cryptoCurrency: params.cryptoCurrency,
      detailedStatus: "waiting_payment",
      checkoutExpiresAt: new Date(
        Date.now() + params.currencyConfig.checkoutTimeout * 1000
      ).toISOString(),
      cryptoAmount: params.resolvedPrice.cryptoAmount,
      fiatAmount: params.resolvedPrice.fiatAmount,
      fiatCurrency: params.resolvedPrice.fiatCurrency,
      walletAddress: assignedPayment.walletAddress,
      network: assignedPayment.network,
      planId: params.planId,
      priceId: params.priceId,
      providerPaymentId: assignedPayment.providerPaymentId,
      payramPaymentUrl: assignedPayment.paymentUrl,
      payramQrPayload: assignedPayment.qrPayload,
      ...(params.resolvedPrice.quoteSource ? { quoteSource: params.resolvedPrice.quoteSource } : {}),
      ...(params.resolvedPrice.quoteRate ? { quoteRate: params.resolvedPrice.quoteRate } : {}),
      ...(params.resolvedPrice.quotedAt ? { quotedAt: params.resolvedPrice.quotedAt } : {}),
      ...(params.resolvedPrice.quoteExpiresAt
        ? { quoteExpiresAt: params.resolvedPrice.quoteExpiresAt }
        : {}),
      payramNetwork: assignedPayment.network,
      payramCurrencyCode: assignedPayment.currencyCode,
      payramStandard: assignedPayment.standard,
      payramStatus: assignedPayment.payramStatus,
      ...(assignedPayment.providerExpiresAt
        ? { providerExpiresAt: assignedPayment.providerExpiresAt }
        : {}),
      ...(params.resolvedPrice.interval ? { priceInterval: params.resolvedPrice.interval } : {}),
    }

    const [updatedOrder] = await params.tx
      .update(order)
      .set({
        metadata: serializeCryptoOrderMetadata(finalMetadata),
        updatedAt: new Date(),
      })
      .where(eq(order.id, params.orderId))
      .returning()

    if (!updatedOrder) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 500,
        userMessage: "Failed to create crypto checkout. Please try again.",
        orderId: params.orderId,
        message: `Failed to persist PayRam checkout metadata: ${params.orderId}`,
      })
    }

    return updatedOrder
  }

  async verifyWebhookRequest(request: Request, rawBody: string) {
    const config = getPayRamConfig()
    const signature = request.headers.get("x-payram-signature")
    if (signature && config.webhookSecret) {
      const expected = await this.signPayload(rawBody, config.webhookSecret)
      return expected === signature
    }

    const providedApiKey =
      request.headers.get("API-Key") ??
      request.headers.get("api-key") ??
      new URL(request.url).searchParams.get("apiKey") ??
      new URL(request.url).searchParams.get("token")

    if (!providedApiKey) {
      return false
    }

    return providedApiKey === config.apiKey || providedApiKey === config.webhookSecret
  }

  parseWebhookPayload(request: Request, rawBody: string) {
    if (request.method === "GET") {
      return Object.fromEntries(new URL(request.url).searchParams.entries())
    }

    if (!rawBody) {
      return {}
    }

    return JSON.parse(rawBody) as Record<string, unknown>
  }

  mapWebhookTransition(
    payload: Record<string, unknown>,
    currentMetadata: PayRamCryptoOrderMetadata
  ) {
    const providerStatus = this.pickString(payload, [
      "status",
      "payment_status",
      "paymentStatus",
    ])?.toLowerCase()
    const providerPaymentId =
      this.pickString(payload, [
        "reference_id",
        "referenceId",
        "payment_id",
        "paymentId",
        "id",
      ]) ?? currentMetadata.providerPaymentId

    const eventId = this.pickString(payload, ["event_id", "eventId", "webhook_id", "webhookId"])
    const reviewReason =
      this.pickString(payload, ["reason", "message", "description"]) ?? currentMetadata.reviewReason

    switch (providerStatus) {
      case "paid":
      case "confirmed":
      case "completed":
      case "success":
        return {
          orderStatus: "paid" as const,
          detailedStatus: "paid" as const,
          providerPaymentId,
          providerStatus,
          eventId,
        }
      case "confirming":
      case "processing":
        return {
          orderStatus: "pending" as const,
          detailedStatus: "confirming" as const,
          providerPaymentId,
          providerStatus,
          eventId,
        }
      case "expired":
        return {
          orderStatus: "expired" as const,
          detailedStatus: "expired" as const,
          providerPaymentId,
          providerStatus,
          eventId,
        }
      case "canceled":
      case "cancelled":
        return {
          orderStatus: "canceled" as const,
          detailedStatus: "canceled" as const,
          providerPaymentId,
          providerStatus,
          eventId,
        }
      case "failed":
      case "underpaid":
      case "overpaid":
      case "late":
      case "mismatch":
        return {
          orderStatus: "pending" as const,
          detailedStatus: "review_required" as const,
          providerPaymentId,
          providerStatus,
          reviewReason: reviewReason ?? "This payment needs manual review.",
          eventId,
        }
      default:
        return {
          orderStatus: "pending" as const,
          detailedStatus: "waiting_payment" as const,
          providerPaymentId,
          providerStatus: providerStatus ?? currentMetadata.payramStatus ?? "pending",
          eventId,
        }
    }
  }

  private async signPayload(payload: string, secret: string) {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload))
    return Array.from(new Uint8Array(signature))
      .map((item) => item.toString(16).padStart(2, "0"))
      .join("")
  }

  private pickString(payload: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = payload[key]
      if (typeof value === "string" && value.length > 0) {
        return value
      }
    }

    return undefined
  }
}

export const payRamProvider = new PayRamProvider()
