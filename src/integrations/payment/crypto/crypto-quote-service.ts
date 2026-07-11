import Decimal from "decimal.js"
import { logger } from "@/shared/lib/tools/logger"
import type { CryptoCurrencyId } from "@/shared/types/crypto"
import { amountCalculator } from "./amount-calculator"
import { getCryptoQuoteConfig } from "./config"
import { getCryptoCurrencyConfig } from "./currencies"
import { CryptoPaymentError } from "./errors"

interface QuoteRequestParams {
  cryptoCurrency: CryptoCurrencyId
  fiatAmount: string
  fiatCurrency: string
}

export interface LiveCryptoQuote {
  cryptoCurrency: CryptoCurrencyId
  cryptoAmount: string
  fiatAmount: string
  fiatCurrency: string
  quoteSource: string
  quoteRate: string
  quotedAt: string
  quoteExpiresAt: string
}

interface CryptoQuoteProvider {
  readonly name: string
  quote(params: QuoteRequestParams): Promise<LiveCryptoQuote>
}

function buildQuoteContext(params: QuoteRequestParams) {
  return {
    cryptoCurrency: params.cryptoCurrency,
    fiatAmount: params.fiatAmount,
    fiatCurrency: params.fiatCurrency,
  }
}

function createQuoteExpiry(quotedAt: Date) {
  const config = getCryptoQuoteConfig()
  return new Date(quotedAt.getTime() + config.expiresInSeconds * 1000).toISOString()
}

function normalizeQuotedAmount(cryptoCurrency: CryptoCurrencyId, amount: Decimal.Value) {
  const currencyConfig = getCryptoCurrencyConfig(cryptoCurrency)
  return amountCalculator.normalizeAmount(amount, currencyConfig.decimals)
}

class MockCryptoQuoteProvider implements CryptoQuoteProvider {
  readonly name = "mock"

  async quote(params: QuoteRequestParams): Promise<LiveCryptoQuote> {
    const behavior = process.env.CRYPTO_QUOTE_MOCK_BEHAVIOR ?? import.meta.env.CRYPTO_QUOTE_MOCK_BEHAVIOR

    if (behavior === "timeout") {
      throw new CryptoPaymentError({
        code: "crypto_quote_timeout",
        statusCode: 503,
        userMessage: "We could not get a live crypto quote right now.",
        message: "Mock quote provider timed out",
        context: buildQuoteContext(params),
      })
    }

    if (behavior === "invalid") {
      throw new CryptoPaymentError({
        code: "crypto_quote_invalid",
        statusCode: 502,
        userMessage: "We could not get a live crypto quote right now.",
        message: "Mock quote provider returned invalid data",
        context: buildQuoteContext(params),
      })
    }

    if (behavior === "unavailable") {
      throw new CryptoPaymentError({
        code: "crypto_quote_unavailable",
        statusCode: 503,
        userMessage: "We could not get a live crypto quote right now.",
        message: "Mock quote provider unavailable",
        context: buildQuoteContext(params),
      })
    }

    const quotedAt = new Date()
    const quoteRate = resolveMockQuoteRate(params.cryptoCurrency)
    const cryptoAmount = normalizeQuotedAmount(
      params.cryptoCurrency,
      new Decimal(params.fiatAmount).div(quoteRate)
    )

    return {
      cryptoCurrency: params.cryptoCurrency,
      cryptoAmount,
      fiatAmount: params.fiatAmount,
      fiatCurrency: params.fiatCurrency,
      quoteSource: "mock",
      quoteRate: quoteRate.toString(),
      quotedAt: quotedAt.toISOString(),
      quoteExpiresAt: createQuoteExpiry(quotedAt),
    }
  }
}

function resolveMockQuoteRate(cryptoCurrency: CryptoCurrencyId) {
  switch (cryptoCurrency) {
    case "btc":
      return new Decimal("80000")
    case "eth":
      return new Decimal("2000")
    case "sol":
      return new Decimal("150")
    case "trx":
      return new Decimal("0.12")
    case "bnb_bsc":
      return new Decimal("600")
    default:
      return new Decimal("1")
  }
}

class BinanceCryptoQuoteProvider implements CryptoQuoteProvider {
  readonly name = "binance"

  async quote(params: QuoteRequestParams): Promise<LiveCryptoQuote> {
    if (params.fiatCurrency.toUpperCase() !== "USD") {
      throw new CryptoPaymentError({
        code: "crypto_quote_invalid",
        statusCode: 400,
        userMessage: "We could not get a live crypto quote right now.",
        message: `Unsupported fiat currency for Binance live quote: ${params.fiatCurrency}`,
        context: buildQuoteContext(params),
      })
    }

    const currencyConfig = getCryptoCurrencyConfig(params.cryptoCurrency)
    const symbol = currencyConfig.binanceSymbol
    if (!symbol) {
      throw new CryptoPaymentError({
        code: "crypto_quote_invalid",
        statusCode: 400,
        userMessage: "We could not get a live crypto quote right now.",
        message: `Binance symbol mapping is missing for ${params.cryptoCurrency}`,
        context: buildQuoteContext(params),
      })
    }

    const config = getCryptoQuoteConfig()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs)
    const startedAt = Date.now()

    try {
      const response = await fetch(
        `${config.apiUrl}/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`,
        {
          method: "GET",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        }
      )

      if (!response.ok) {
        logger.warn("crypto_quote_provider_http_error", {
          provider: this.name,
          symbol,
          status: response.status,
          ...buildQuoteContext(params),
        })

        throw new CryptoPaymentError({
          code: response.status === 429 ? "crypto_quote_unavailable" : "crypto_quote_invalid",
          statusCode: response.status === 429 ? 503 : 502,
          userMessage: "We could not get a live crypto quote right now.",
          message: `Binance quote request failed for ${symbol} with status ${response.status}`,
          context: {
            ...buildQuoteContext(params),
            quoteSource: this.name,
            symbol,
            httpStatus: response.status,
          },
        })
      }

      const payload = (await response.json()) as { symbol?: string; price?: string }
      if (
        payload.symbol !== symbol ||
        typeof payload.price !== "string" ||
        payload.price.trim().length === 0
      ) {
        throw new CryptoPaymentError({
          code: "crypto_quote_invalid",
          statusCode: 502,
          userMessage: "We could not get a live crypto quote right now.",
          message: `Binance quote payload was invalid for ${symbol}`,
          context: {
            ...buildQuoteContext(params),
            quoteSource: this.name,
            symbol,
          },
        })
      }

      const quoteRate = new Decimal(payload.price)
      if (!quoteRate.isFinite() || quoteRate.lte(0)) {
        throw new CryptoPaymentError({
          code: "crypto_quote_invalid",
          statusCode: 502,
          userMessage: "We could not get a live crypto quote right now.",
          message: `Binance quote rate was non-positive for ${symbol}`,
          context: {
            ...buildQuoteContext(params),
            quoteSource: this.name,
            symbol,
            rawPrice: payload.price,
          },
        })
      }

      const quotedAt = new Date()
      const cryptoAmount = normalizeQuotedAmount(
        params.cryptoCurrency,
        new Decimal(params.fiatAmount).div(quoteRate)
      )

      logger.info("crypto_quote_resolved", {
        provider: this.name,
        symbol,
        latencyMs: Date.now() - startedAt,
        quoteRate: quoteRate.toString(),
        cryptoAmount,
        ...buildQuoteContext(params),
      })

      return {
        cryptoCurrency: params.cryptoCurrency,
        cryptoAmount,
        fiatAmount: params.fiatAmount,
        fiatCurrency: params.fiatCurrency,
        quoteSource: `${this.name}:${symbol}`,
        quoteRate: quoteRate.toString(),
        quotedAt: quotedAt.toISOString(),
        quoteExpiresAt: createQuoteExpiry(quotedAt),
      }
    } catch (error) {
      if (error instanceof CryptoPaymentError) {
        throw error
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new CryptoPaymentError({
          code: "crypto_quote_timeout",
          statusCode: 503,
          userMessage: "We could not get a live crypto quote right now.",
          message: `Binance quote request timed out for ${symbol}`,
          context: {
            ...buildQuoteContext(params),
            quoteSource: this.name,
            symbol,
            timeoutMs: config.timeoutMs,
          },
        })
      }

      throw new CryptoPaymentError({
        code: "crypto_quote_unavailable",
        statusCode: 503,
        userMessage: "We could not get a live crypto quote right now.",
        message: error instanceof Error ? error.message : "Unknown Binance quote error",
        context: {
          ...buildQuoteContext(params),
          quoteSource: this.name,
          symbol,
        },
      })
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

export class CryptoQuoteService {
  private getProvider(): CryptoQuoteProvider {
    const config = getCryptoQuoteConfig()
    return config.provider === "mock"
      ? new MockCryptoQuoteProvider()
      : new BinanceCryptoQuoteProvider()
  }

  async quote(params: QuoteRequestParams) {
    const provider = this.getProvider()

    try {
      return await provider.quote(params)
    } catch (error) {
      logger.warn("crypto_quote_failed", {
        provider: provider.name,
        ...buildQuoteContext(params),
        message: error instanceof Error ? error.message : "Unknown quote error",
      })
      throw error
    }
  }
}

export const cryptoQuoteService = new CryptoQuoteService()
