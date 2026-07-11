import { and, desc, eq } from "drizzle-orm"
import { getPlanById, getPriceById } from "@/config/payment-config"
import { db } from "@/db"
import { order } from "@/db/order.schema"
import { generateProductName, getOrderTypeFromPlan } from "@/integrations/payment/utils"
import { logger } from "@/shared/lib/tools/logger"
import type {
  CryptoCheckoutData,
  CryptoCurrencyId,
  CryptoOrderMetadata,
  EvmDirectCryptoOrderMetadata,
  SolanaCryptoOrderMetadata,
} from "@/shared/types/crypto"
import { getCryptoPaymentConfig, isCryptoPaymentEnabled } from "./config"
import { getCryptoCurrencyConfig } from "./currencies"
import { CryptoPaymentError } from "./errors"
import {
  buildCryptoCheckoutData,
  getEffectiveCryptoCheckoutExpiry,
  getCryptoCheckoutSessionId,
  getCryptoCheckoutUrl,
  getCryptoOrderMetadata,
  serializeCryptoOrderMetadata,
} from "./order-metadata"
import { cryptoPricingResolver } from "./pricing-resolver"
import { resolveCryptoProviderIdForCurrency } from "./provider-router"
import { evmDirectProvider } from "./providers/evm-direct-provider"
import { payRamProvider } from "./providers/payram-provider"
import { solanaPayProvider } from "./providers/solanapay-provider"

interface CreateOrReuseCheckoutParams {
  userId: string
  userEmail: string
  planId: string
  priceId: string
  cryptoCurrency: CryptoCurrencyId
  currentOrderId?: string
  successUrl?: string
  cancelUrl?: string
}

type CryptoCheckoutResult = CryptoCheckoutData & {
  sessionId: string
  checkoutUrl: string
}

function isPendingAndReusable(
  metadata: CryptoOrderMetadata | null,
  target: { planId: string; priceId: string; cryptoCurrency: CryptoCurrencyId }
) {
  if (!metadata) {
    return false
  }

  if (metadata.planId !== target.planId || metadata.priceId !== target.priceId) {
    return false
  }

  if (metadata.cryptoCurrency !== target.cryptoCurrency) {
    return false
  }

  if (metadata.txSignature) {
    return false
  }

  return getEffectiveCryptoCheckoutExpiry(metadata).getTime() > Date.now()
}

function buildCheckoutResult(checkout: CryptoCheckoutData): CryptoCheckoutResult {
  return {
    ...checkout,
    sessionId: getCryptoCheckoutSessionId(checkout),
    checkoutUrl: getCryptoCheckoutUrl(checkout),
  }
}

export class CryptoCheckoutService {
  async createOrReuseCheckout(params: CreateOrReuseCheckoutParams): Promise<CryptoCheckoutResult> {
    const {
      userId,
      userEmail,
      planId,
      priceId,
      cryptoCurrency,
      currentOrderId,
      successUrl,
      cancelUrl,
    } = params

    if (!isCryptoPaymentEnabled()) {
      throw new CryptoPaymentError({
        code: "crypto_disabled",
        statusCode: 403,
        userMessage: "Crypto payments are currently unavailable.",
        message: "Crypto payment is disabled by feature flag",
        context: { userId, planId, priceId, cryptoCurrency },
      })
    }

    const plan = getPlanById(planId)
    if (!plan) {
      throw new CryptoPaymentError({
        code: "crypto_price_not_configured",
        statusCode: 400,
        userMessage: "This crypto price is not available for the selected plan.",
        message: `Crypto checkout plan not found: ${planId}`,
        context: { userId, planId, priceId, cryptoCurrency },
      })
    }

    const price = getPriceById(planId, priceId)
    if (!price) {
      throw new CryptoPaymentError({
        code: "crypto_price_not_configured",
        statusCode: 400,
        userMessage: "This crypto price is not available for the selected plan.",
        message: `Crypto checkout price not found: ${planId}/${priceId}`,
        context: { userId, planId, priceId, cryptoCurrency },
      })
    }

    const cryptoConfig = getCryptoPaymentConfig()
    const currencyConfig = getCryptoCurrencyConfig(cryptoCurrency)
    const resolvedPrice = await cryptoPricingResolver.resolve({ planId, priceId, cryptoCurrency })
    const cryptoProvider = resolveCryptoProviderIdForCurrency(cryptoCurrency)

    if (cryptoProvider === "solanapay" && !cryptoConfig.walletAddress) {
      throw new CryptoPaymentError({
        code: "wallet_not_configured",
        statusCode: 503,
        userMessage: "Crypto checkout is temporarily unavailable.",
        message: "SOLANAPAY_WALLET_ADDRESS is not configured",
        context: { userId, planId, priceId, cryptoCurrency },
      })
    }

    const reusableOrders = await db
      .select()
      .from(order)
      .where(and(eq(order.userId, userId), eq(order.status, "pending")))
      .orderBy(desc(order.createdAt))

    const existingOrder = reusableOrders.find((candidate) => {
      const metadata = getCryptoOrderMetadata(candidate)
      return isPendingAndReusable(metadata, { planId, priceId, cryptoCurrency })
    })

    if (existingOrder) {
      logger.info("crypto_checkout_reused", {
        orderId: existingOrder.id,
        cryptoCurrency,
      })

      return buildCheckoutResult(buildCryptoCheckoutData(existingOrder))
    }

    const createdCheckout = await db.transaction(async (tx) => {
      if (currentOrderId) {
        const [currentOrder] = await tx
          .select()
          .from(order)
          .where(and(eq(order.id, currentOrderId), eq(order.userId, userId)))
          .limit(1)

        const currentMetadata = currentOrder ? getCryptoOrderMetadata(currentOrder) : null
        if (currentOrder && currentOrder.status === "pending" && currentMetadata) {
          await tx
            .update(order)
            .set({
              status: "canceled",
              metadata: {
                ...currentMetadata,
                detailedStatus: "canceled",
                cancellationReason: "currency_switch",
              },
              updatedAt: new Date(),
            })
            .where(eq(order.id, currentOrder.id))

          logger.info("crypto_checkout_canceled_by_currency_switch", {
            orderId: currentOrder.id,
            cryptoCurrency: currentMetadata.cryptoCurrency,
          })
        }
      }

      const quoteExpiresAt = resolvedPrice.quoteExpiresAt
        ? new Date(resolvedPrice.quoteExpiresAt)
        : new Date(Date.now() + currencyConfig.checkoutTimeout * 1000)
      const configuredExpireAt = new Date(Date.now() + currencyConfig.checkoutTimeout * 1000)
      const expireAt =
        quoteExpiresAt.getTime() < configuredExpireAt.getTime() ? quoteExpiresAt : configuredExpireAt
      const draftMetadata =
        cryptoProvider === "solanapay"
          ? solanaPayProvider.createDraftMetadata({
              planId,
              priceId,
              cryptoCurrency,
              walletAddress: cryptoConfig.walletAddress,
              network: cryptoConfig.network,
              currencyConfig,
              resolvedPrice,
            })
          : cryptoProvider === "payram"
            ? payRamProvider.createDraftMetadata({
                planId,
                priceId,
                cryptoCurrency,
                currencyConfig,
                resolvedPrice,
                successUrl,
                cancelUrl,
              })
            : evmDirectProvider.createDraftMetadata({
                planId,
                priceId,
                cryptoCurrency,
                currencyConfig,
                resolvedPrice,
              })

      const orderToInsert: typeof order.$inferInsert = {
        userId,
        orderType: getOrderTypeFromPlan(plan),
        status: "pending",
        productId: priceId,
        productName: generateProductName(plan.name || plan.id, price.interval),
        amount: price.amount,
        currency: price.currency,
        expireAt,
        metadata: serializeCryptoOrderMetadata(draftMetadata),
      }

      const [createdOrder] = await tx.insert(order).values(orderToInsert).returning()

      if (cryptoProvider === "solanapay") {
        return solanaPayProvider.finalizeCheckout({
          tx,
          orderId: createdOrder.id,
          planId,
          priceId,
          planName: plan.name || plan.id,
          walletAddress: cryptoConfig.walletAddress,
          network: cryptoConfig.network,
          cryptoCurrency,
          currencyConfig,
          resolvedPrice,
          metadata: createdOrder.metadata as unknown as SolanaCryptoOrderMetadata,
        })
      }

      if (cryptoProvider === "payram") {
        return payRamProvider.finalizeCheckout({
          tx,
          orderId: createdOrder.id,
          userId,
          userEmail,
          planId,
          priceId,
          cryptoCurrency,
          currencyConfig,
          resolvedPrice,
          successUrl,
          cancelUrl,
        })
      }

      return evmDirectProvider.finalizeCheckout({
        tx,
        orderId: createdOrder.id,
        planId,
        priceId,
        cryptoCurrency,
        currencyConfig,
        resolvedPrice,
        metadata: createdOrder.metadata as unknown as EvmDirectCryptoOrderMetadata,
      })
    })

    logger.info("crypto_checkout_created", {
      orderId: createdCheckout.id,
      cryptoCurrency,
      cryptoProvider,
    })

    return buildCheckoutResult(buildCryptoCheckoutData(createdCheckout))
  }
}

export const cryptoCheckoutService = new CryptoCheckoutService()
