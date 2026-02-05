import { getAllConfigs } from "@/shared/model/config.model"
import type { PaymentProvider } from "@/shared/types/payment"
import { CreemAdapter } from "./adapters/creem"
import { StripeAdapter } from "./adapters/stripe"
import type { PaymentAdapter } from "./types"

export type { PaymentAdapter } from "./types"
export * from "./types"

/**
 * Get payment adapter by provider name
 */
export async function getPaymentAdapter(provider: PaymentProvider): Promise<PaymentAdapter> {
  const configs = await getAllConfigs()

  switch (provider) {
    case "stripe":
      return new StripeAdapter({
        secretKey: configs.payment_stripe_secret_key,
        webhookSecret: configs.payment_stripe_webhook_secret,
      })

    case "creem":
      return new CreemAdapter({
        apiKey: configs.payment_creem_x_api_key,
        webhookSecret: configs.payment_creem_webhook_secret,
        testMode: configs.payment_creem_test_mode,
      })

    case "paypal":
      // TODO: Implement PayPalAdapter
      throw new Error("PayPal adapter not implemented yet")

    case "wechat":
      // TODO: Implement WechatAdapter
      throw new Error("WeChat adapter not implemented yet")

    case "alipay":
      // TODO: Implement AlipayAdapter
      throw new Error("Alipay adapter not implemented yet")

    default:
      throw new Error(`Unsupported payment provider: ${provider}`)
  }
}

/**
 * Get the default payment adapter based on config
 */
export async function getDefaultPaymentAdapter(): Promise<PaymentAdapter> {
  const configs = await getAllConfigs()
  const provider = (configs.public_payment_provider || "stripe") as PaymentProvider
  return getPaymentAdapter(provider)
}
