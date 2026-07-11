import type { CheckoutProvider } from "@/shared/types/payment"
import type { CheckoutResult, CreateCheckoutParams, PaymentAdapter, WebhookEvent } from "../types"
import { cryptoCheckoutService } from "./crypto-checkout-service"
import { isEnabledCryptoCurrency } from "./currencies"
import { CryptoPaymentError } from "./errors"

export class CryptoPaymentAdapter implements PaymentAdapter {
  readonly name: CheckoutProvider = "crypto"

  readonly capabilities = {
    subscription: true,
    oneTime: true,
    customerPortal: false,
    refund: false,
  } as const

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const cryptoCurrency = params.metadata?.cryptoCurrency
    if (!isEnabledCryptoCurrency(cryptoCurrency)) {
      throw new CryptoPaymentError({
        code: "invalid_crypto_currency",
        statusCode: 400,
        userMessage: "The selected crypto currency is invalid.",
        message: "Missing or invalid cryptoCurrency in checkout metadata",
        orderId: params.orderId,
      })
    }

    const checkout = await cryptoCheckoutService.createOrReuseCheckout({
      userId: params.userId,
      userEmail: params.email,
      planId: params.planId,
      priceId: params.priceId,
      cryptoCurrency,
      currentOrderId: params.metadata?.currentOrderId,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
    })

    return {
      sessionId: checkout.sessionId,
      checkoutUrl: checkout.checkoutUrl,
    }
  }

  async handleWebhook(): Promise<WebhookEvent> {
    throw new CryptoPaymentError({
      code: "payment_validation_failed",
      statusCode: 400,
      userMessage: "Crypto payment does not support webhooks.",
      message: "Crypto payment does not support webhooks",
    })
  }
}
