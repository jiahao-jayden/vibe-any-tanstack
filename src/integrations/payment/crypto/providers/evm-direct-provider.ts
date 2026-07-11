import { eq } from "drizzle-orm"
import type { DbTransaction } from "@/db"
import { db } from "@/db"
import { order } from "@/db/order.schema"
import { findOrderById, updateOrderById } from "@/shared/model/order.model"
import { findPaymentByProviderId } from "@/shared/model/payment.model"
import type { EvmDirectCryptoOrderMetadata, ResolvedCryptoPrice } from "@/shared/types/crypto"
import type { CryptoCurrencyConfig } from "../currencies"
import {
  buildEvmObservabilityContext,
  emitEvmMetricEvent,
  logEvmEvent,
} from "../evm-observability"
import { CryptoPaymentError } from "../errors"
import { getEvmDirectConfig, isEvmDirectConfigured } from "../evm-config"
import { evmPaymentVerifier } from "../evm-payment-verifier"
import {
  buildCryptoCheckoutData,
  getCryptoOrderMetadata,
  serializeCryptoOrderMetadata,
} from "../order-metadata"

interface CreateEvmDirectCheckoutParams {
  tx: DbTransaction
  orderId: string
  planId: string
  priceId: string
  cryptoCurrency: CryptoCurrencyConfig["id"]
  currencyConfig: CryptoCurrencyConfig
  resolvedPrice: ResolvedCryptoPrice
}

function isValidEvmAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value)
}

function getNetworkLabel(network: "mainnet" | "testnet") {
  return network === "testnet" ? "BNB Smart Chain Testnet" : "BNB Smart Chain"
}

function resolveRequiredConfirmations(currencyConfig: CryptoCurrencyConfig) {
  return String(currencyConfig.minConfirmations ?? 15)
}

function isValidTxHash(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value)
}

export class EvmDirectProvider {
  createDraftMetadata(
    params: Omit<CreateEvmDirectCheckoutParams, "tx" | "orderId">
  ): EvmDirectCryptoOrderMetadata {
    if (!isEvmDirectConfigured()) {
      throw new CryptoPaymentError({
        code: "provider_unavailable",
        statusCode: 503,
        userMessage: "This crypto currency is temporarily unavailable.",
        message: "EVM direct payment is not configured",
        context: { cryptoCurrency: params.cryptoCurrency },
      })
    }

    const config = getEvmDirectConfig()
    if (!isValidEvmAddress(config.merchantWalletAddress)) {
      throw new CryptoPaymentError({
        code: "invalid_wallet_address",
        statusCode: 503,
        userMessage: "Crypto checkout is temporarily unavailable.",
        message: "EVM direct merchant wallet address is invalid",
        context: { merchantWalletAddress: config.merchantWalletAddress },
      })
    }

    return {
      paymentMethod: "crypto",
      cryptoProvider: "evm_direct",
      cryptoCurrency: params.cryptoCurrency,
      detailedStatus: "waiting_payment",
      checkoutExpiresAt: new Date(
        Date.now() + params.currencyConfig.checkoutTimeout * 1000
      ).toISOString(),
      cryptoAmount: params.resolvedPrice.cryptoAmount,
      fiatAmount: params.resolvedPrice.fiatAmount,
      fiatCurrency: params.resolvedPrice.fiatCurrency,
      walletAddress: config.merchantWalletAddress,
      network: getNetworkLabel(config.network),
      planId: params.planId,
      priceId: params.priceId,
      ...(params.resolvedPrice.quoteSource ? { quoteSource: params.resolvedPrice.quoteSource } : {}),
      ...(params.resolvedPrice.quoteRate ? { quoteRate: params.resolvedPrice.quoteRate } : {}),
      ...(params.resolvedPrice.quotedAt ? { quotedAt: params.resolvedPrice.quotedAt } : {}),
      ...(params.resolvedPrice.quoteExpiresAt
        ? { quoteExpiresAt: params.resolvedPrice.quoteExpiresAt }
        : {}),
      evmChainId: String(params.currencyConfig.evmChainId ?? config.chainId),
      evmAssetType: params.currencyConfig.evmAssetType ?? "native",
      requiredConfirmations: resolveRequiredConfirmations(params.currencyConfig),
      ...(params.currencyConfig.evmTokenAddress
        ? { tokenAddress: params.currencyConfig.evmTokenAddress }
        : {}),
      ...(params.resolvedPrice.interval ? { priceInterval: params.resolvedPrice.interval } : {}),
    }
  }

  async finalizeCheckout(
    params: CreateEvmDirectCheckoutParams & { metadata: EvmDirectCryptoOrderMetadata }
  ) {
    const [updatedOrder] = await params.tx
      .update(order)
      .set({
        metadata: serializeCryptoOrderMetadata(params.metadata),
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
        message: `Failed to persist EVM direct checkout metadata: ${params.orderId}`,
      })
    }

    return updatedOrder
  }

  async submitTransaction(orderId: string, txHash: string) {
    const currentOrder = await findOrderById(orderId)
    if (!currentOrder) {
      throw new CryptoPaymentError({
        code: "payment_not_found",
        statusCode: 404,
        userMessage: "Crypto payment record was not found.",
        orderId,
        message: `Order not found: ${orderId}`,
      })
    }

    const metadata = getCryptoOrderMetadata(currentOrder)
    if (!metadata || metadata.cryptoProvider !== "evm_direct") {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 400,
        userMessage: "We could not validate this crypto payment.",
        orderId,
        message: `Order is not an EVM direct crypto checkout: ${orderId}`,
      })
    }

    if (!isValidTxHash(txHash)) {
      const observabilityContext = buildEvmObservabilityContext({
        orderId,
        metadata,
        submittedTxHash: txHash,
      })
      logEvmEvent("warn", "evm_invalid_tx_hash_submitted", observabilityContext)
      emitEvmMetricEvent({
        name: "evm_invalid_tx_hash_submitted",
        context: observabilityContext,
      })

      throw new CryptoPaymentError({
        code: "invalid_tx_hash",
        statusCode: 400,
        userMessage: "The submitted transaction hash is invalid.",
        orderId,
        message: `Invalid EVM transaction hash submitted: ${txHash}`,
      })
    }

    if (currentOrder.status === "paid" || currentOrder.status === "canceled") {
      throw new CryptoPaymentError({
        code: "payment_already_processed",
        statusCode: 409,
        userMessage: "This checkout can no longer accept a transaction hash.",
        orderId,
        message: `Order is already terminal for EVM transaction submission: ${orderId}`,
      })
    }

    if (metadata.submittedTxHash === txHash) {
      return evmPaymentVerifier.verifyPayment(orderId)
    }

    if (metadata.submittedTxHash && metadata.submittedTxHash !== txHash) {
      throw new CryptoPaymentError({
        code: "payment_already_processed",
        statusCode: 409,
        userMessage: "A transaction hash is already attached to this checkout.",
        orderId,
        message: `Order already has a different submitted tx hash: ${orderId}`,
      })
    }

    const existingPayment = await findPaymentByProviderId(txHash)
    if (existingPayment && existingPayment.orderId !== orderId) {
      const observabilityContext = buildEvmObservabilityContext({
        orderId,
        metadata,
        submittedTxHash: txHash,
      })
      logEvmEvent("warn", "evm_tx_duplicate_conflict", observabilityContext, {
        existingOrderId: existingPayment.orderId,
      })
      emitEvmMetricEvent({
        name: "evm_tx_duplicate_conflict",
        context: observabilityContext,
        meta: {
          existingOrderId: existingPayment.orderId,
        },
      })

      throw new CryptoPaymentError({
        code: "payment_duplicate",
        statusCode: 409,
        userMessage: "This blockchain transaction is already linked elsewhere.",
        orderId,
        message: `EVM tx hash is already linked to another payment: ${txHash}`,
      })
    }

    const pendingOrders = await db.select().from(order).where(eq(order.status, "pending"))
    const duplicatePendingOrder = pendingOrders.find((candidate) => {
      if (candidate.id === orderId) {
        return false
      }

      const candidateMetadata = getCryptoOrderMetadata(candidate)
      return (
        candidateMetadata?.cryptoProvider === "evm_direct" &&
        candidateMetadata.submittedTxHash === txHash
      )
    })

    if (duplicatePendingOrder) {
      const observabilityContext = buildEvmObservabilityContext({
        orderId,
        metadata,
        submittedTxHash: txHash,
      })
      logEvmEvent("warn", "evm_tx_duplicate_conflict", observabilityContext, {
        existingOrderId: duplicatePendingOrder.id,
      })
      emitEvmMetricEvent({
        name: "evm_tx_duplicate_conflict",
        context: observabilityContext,
        meta: {
          existingOrderId: duplicatePendingOrder.id,
        },
      })

      throw new CryptoPaymentError({
        code: "payment_duplicate",
        statusCode: 409,
        userMessage: "This blockchain transaction is already linked elsewhere.",
        orderId,
        message: `EVM tx hash is already attached to another pending order: ${txHash}`,
        context: { existingOrderId: duplicatePendingOrder.id },
      })
    }

    const updatedOrder = await updateOrderById(orderId, {
      metadata: serializeCryptoOrderMetadata({
        ...metadata,
        detailedStatus: "confirming",
        submittedTxHash: txHash,
        txSubmittedAt: new Date().toISOString(),
      }),
    })

    if (!updatedOrder) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 500,
        userMessage: "We could not save this transaction hash.",
        orderId,
        message: `Failed to persist submitted EVM tx hash: ${orderId}`,
      })
    }

    const observabilityContext = buildEvmObservabilityContext({
      orderId,
      metadata,
      submittedTxHash: txHash,
    })
    logEvmEvent("info", "evm_tx_submitted", observabilityContext)
    emitEvmMetricEvent({
      name: "evm_tx_submitted",
      context: observabilityContext,
    })

    return evmPaymentVerifier.verifyPayment(orderId)
  }

  async refreshStatusIfNeeded(orderId: string) {
    const currentOrder = await findOrderById(orderId)
    if (!currentOrder) {
      throw new CryptoPaymentError({
        code: "payment_not_found",
        statusCode: 404,
        userMessage: "Crypto payment record was not found.",
        orderId,
        message: `Order not found: ${orderId}`,
      })
    }

    const metadata = getCryptoOrderMetadata(currentOrder)
    if (!metadata || metadata.cryptoProvider !== "evm_direct") {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 400,
        userMessage: "We could not validate this crypto payment.",
        orderId,
        message: `Order is not an EVM direct crypto checkout: ${orderId}`,
      })
    }

    if (!metadata.submittedTxHash) {
      return buildCryptoCheckoutData(currentOrder)
    }

    return evmPaymentVerifier.verifyPayment(orderId)
  }
}

export const evmDirectProvider = new EvmDirectProvider()
