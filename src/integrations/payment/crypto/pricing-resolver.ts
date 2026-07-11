import Decimal from "decimal.js"
import { getPlanById, getPriceById } from "@/config/payment-config"
import type { CryptoCurrencyId, ResolvedCryptoPrice } from "@/shared/types/crypto"
import { amountCalculator } from "./amount-calculator"
import { cryptoQuoteService } from "./crypto-quote-service"
import { getCryptoCurrencyConfig } from "./currencies"
import { CryptoPaymentError } from "./errors"

export class CryptoPricingResolver {
  async resolve(params: {
    planId: string
    priceId: string
    cryptoCurrency: CryptoCurrencyId
  }): Promise<ResolvedCryptoPrice> {
    const { planId, priceId, cryptoCurrency } = params

    const plan = getPlanById(planId)
    if (!plan) {
      throw new CryptoPaymentError({
        code: "crypto_price_not_configured",
        statusCode: 400,
        userMessage: "This crypto price is not available for the selected plan.",
        message: `Crypto pricing plan not found: ${planId}`,
        context: { planId, priceId, cryptoCurrency },
      })
    }

    const price = getPriceById(planId, priceId)
    if (!price) {
      throw new CryptoPaymentError({
        code: "crypto_price_not_configured",
        statusCode: 400,
        userMessage: "This crypto price is not available for the selected plan.",
        message: `Crypto pricing price not found: ${planId}/${priceId}`,
        context: { planId, priceId, cryptoCurrency },
      })
    }

    const currencyConfig = getCryptoCurrencyConfig(cryptoCurrency)
    if (!currencyConfig || !currencyConfig.enabled) {
      throw new CryptoPaymentError({
        code: "invalid_crypto_currency",
        statusCode: 400,
        userMessage: "The selected crypto currency is invalid.",
        message: `Crypto currency is not available: ${cryptoCurrency}`,
        context: { planId, priceId, cryptoCurrency },
      })
    }

    const supportedCryptoCurrencies = price.supportedCryptoCurrencies ?? []
    if (!supportedCryptoCurrencies.includes(cryptoCurrency)) {
      throw new CryptoPaymentError({
        code: "crypto_price_not_configured",
        statusCode: 400,
        userMessage: "This crypto price is not available for the selected plan.",
        message: `Crypto price is not available for plan price: ${planId}/${priceId}/${cryptoCurrency}`,
        context: { planId, priceId, cryptoCurrency },
      })
    }

    const fiatAmount = new Decimal(price.amount).div(100).toFixed(2)

    if (currencyConfig.pricingMode === "fiat_peg") {
      return {
        cryptoCurrency,
        cryptoAmount: amountCalculator.normalizeAmount(fiatAmount, currencyConfig.decimals),
        fiatAmount,
        fiatCurrency: price.currency,
        planId,
        priceId,
        interval: price.interval,
      }
    }

    const quote = await cryptoQuoteService.quote({
      cryptoCurrency,
      fiatAmount,
      fiatCurrency: price.currency,
    })

    return {
      cryptoCurrency,
      cryptoAmount: quote.cryptoAmount,
      fiatAmount,
      fiatCurrency: price.currency,
      quoteSource: quote.quoteSource,
      quoteRate: quote.quoteRate,
      quotedAt: quote.quotedAt,
      quoteExpiresAt: quote.quoteExpiresAt,
      planId,
      priceId,
      interval: price.interval,
    }
  }
}

export const cryptoPricingResolver = new CryptoPricingResolver()
