import type { CryptoCurrencyId } from "@/shared/types/crypto"
import type { PaymentProvider, PlanPrice } from "@/shared/types/payment"
import { getCryptoCurrencyConfig } from "@/integrations/payment/crypto/currencies"

export interface PaymentMethodDisplayLabels {
  fiatLabel: string
  cardLabel: string
  paypalLabel: string
  wechatLabel: string
  alipayLabel: string
}

export type PriceDisplayMode = "fiat" | "exact_crypto" | "fiat_with_live_quote_note"

export interface PriceDisplayResult {
  amountText: string
  unitText: string
  isCrypto: boolean
  mode: PriceDisplayMode
}

export function formatCryptoCurrencyUnit(currencyId: CryptoCurrencyId) {
  switch (currencyId) {
    case "usdc_sol":
      return "USDC"
    case "usdt_erc20":
    case "usdt_trc20":
      return "USDT"
    default:
      return currencyId.split("_")[0].toUpperCase()
  }
}

export function getPriceDisplay(
  price: Pick<PlanPrice, "amount" | "supportedCryptoCurrencies" | "currency">,
  provider: string,
  cryptoCurrency?: CryptoCurrencyId
) : PriceDisplayResult {
  if (provider === "crypto" && cryptoCurrency) {
    const currencyConfig = getCryptoCurrencyConfig(cryptoCurrency)
    if (currencyConfig.pricingMode === "fiat_peg") {
      return {
        amountText: `${price.amount / 100}`,
        unitText: formatCryptoCurrencyUnit(cryptoCurrency),
        isCrypto: true,
        mode: "exact_crypto",
      }
    }

    if (currencyConfig.pricingMode === "live_quote") {
      return {
        amountText: `${price.amount / 100}`,
        unitText: "$",
        isCrypto: false,
        mode: "fiat_with_live_quote_note",
      }
    }
  }

  return {
    amountText: `${price.amount / 100}`,
    unitText: "$",
    isCrypto: false,
    mode: "fiat",
  }
}

export function shouldShowLiveQuoteNote(
  provider: string,
  cryptoCurrency?: CryptoCurrencyId
) {
  if (provider !== "crypto" || !cryptoCurrency) {
    return false
  }

  return getCryptoCurrencyConfig(cryptoCurrency).pricingMode === "live_quote"
}

export function getLiveQuoteNote(
  template: string,
  cryptoCurrency?: CryptoCurrencyId
) {
  if (!cryptoCurrency) {
    return template
  }

  return template.replace("{asset}", formatCryptoCurrencyUnit(cryptoCurrency))
}

export function getPaymentMethodDisplayLabel(
  provider: PaymentProvider | string,
  labels: PaymentMethodDisplayLabels
) {
  switch (provider) {
    case "stripe":
    case "creem":
      return labels.cardLabel
    case "paypal":
      return labels.paypalLabel
    case "wechat":
      return labels.wechatLabel
    case "alipay":
      return labels.alipayLabel
    default:
      return labels.fiatLabel
  }
}

export function shouldShowPaymentMethod(hasCryptoOption: boolean) {
  return hasCryptoOption
}
