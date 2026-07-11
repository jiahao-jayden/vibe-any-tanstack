import BigNumber from "bignumber.js"
import { createPublicClient, formatUnits, http, parseEventLogs } from "viem"
import { bsc, bscTestnet } from "viem/chains"
import { findOrderById, updateOrderById } from "@/shared/model/order.model"
import { findPaymentByProviderId } from "@/shared/model/payment.model"
import type { CryptoPaymentErrorCode, EvmDirectCryptoOrderMetadata } from "@/shared/types/crypto"
import { getCryptoCurrencyConfig } from "./currencies"
import {
  buildEvmObservabilityContext,
  emitEvmMetricEvent,
  logEvmEvent,
  type EvmObservabilityContext,
} from "./evm-observability"
import { CryptoPaymentError, isCryptoPaymentError } from "./errors"
import { getEvmDirectConfig } from "./evm-config"
import { fulfillVerifiedCryptoPayment } from "./fulfillment"
import {
  buildCryptoCheckoutData,
  getCryptoOrderMetadata,
  serializeCryptoOrderMetadata,
} from "./order-metadata"

const erc20TransferAbi = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      {
        indexed: true,
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        name: "value",
        type: "uint256",
      },
    ],
  },
] as const

function normalizeAddress(value?: string | null) {
  return value?.toLowerCase() ?? ""
}

function isOptionalActionNotFound(error: unknown) {
  if (!(error instanceof Error) && typeof error !== "object") {
    return false
  }

  const name =
    "name" in (error as Record<string, unknown>)
      ? String((error as Record<string, unknown>).name)
      : ""
  const message = error instanceof Error ? error.message : ""

  return (
    name === "TransactionNotFoundError" ||
    name === "TransactionReceiptNotFoundError" ||
    /transaction.*not found/i.test(message) ||
    /receipt.*not found/i.test(message)
  )
}

function getExplorerUrl(txHash: string) {
  const config = getEvmDirectConfig()
  return `${config.explorerBaseUrl}/tx/${txHash}`
}

type PublicClientLike = ReturnType<typeof createPublicClient>

export class EvmPaymentVerifier {
  private getClients() {
    const config = getEvmDirectConfig()
    const chain = config.network === "testnet" ? bscTestnet : bsc
    const clients = [
      createPublicClient({
        chain,
        transport: http(config.rpcUrl),
      }),
    ]

    if (config.fallbackRpcUrl) {
      clients.push(
        createPublicClient({
          chain,
          transport: http(config.fallbackRpcUrl),
        })
      )
    }

    return clients
  }

  private async getOptionalFromClients<T>(
    action: string,
    fn: (client: PublicClientLike) => Promise<T>,
    context?: EvmObservabilityContext
  ): Promise<T | null> {
    const clients = this.getClients()
    let lastError: unknown = null

    for (let index = 0; index < clients.length; index += 1) {
      try {
        const result = await fn(clients[index]!)
        if (index > 0 && context) {
          logEvmEvent("info", "evm_rpc_fallback_used", context, {
            action,
            rpcClientIndex: index + 1,
          })
          emitEvmMetricEvent({
            name: "evm_rpc_fallback_used",
            context,
            meta: {
              action,
              rpcClientIndex: index + 1,
            },
          })
        }

        return result
      } catch (error) {
        if (isOptionalActionNotFound(error)) {
          lastError = error
          continue
        }

        lastError = error
        if (index < clients.length - 1) {
          logEvmEvent("warn", "evm_rpc_primary_failed", context ?? { orderId: "unknown" }, {
            action,
            message: error instanceof Error ? error.message : "Unknown RPC error",
          })
          if (context) {
            emitEvmMetricEvent({
              name: "evm_rpc_primary_failed",
              context,
              meta: { action },
            })
          }
        }
      }
    }

    if (lastError && !isOptionalActionNotFound(lastError)) {
      throw new CryptoPaymentError({
        code: "rpc_unavailable",
        statusCode: 503,
        userMessage: "We could not verify this blockchain transaction right now.",
        message: `EVM RPC call failed for ${action}`,
      })
    }

    return null
  }

  private async getRequiredFromClients<T>(
    action: string,
    fn: (client: PublicClientLike) => Promise<T>,
    context?: EvmObservabilityContext
  ): Promise<T> {
    const clients = this.getClients()
    let lastError: unknown = null

    for (let index = 0; index < clients.length; index += 1) {
      try {
        const result = await fn(clients[index]!)
        if (index > 0 && context) {
          logEvmEvent("info", "evm_rpc_fallback_used", context, {
            action,
            rpcClientIndex: index + 1,
          })
          emitEvmMetricEvent({
            name: "evm_rpc_fallback_used",
            context,
            meta: {
              action,
              rpcClientIndex: index + 1,
            },
          })
        }

        return result
      } catch (error) {
        lastError = error
        if (index < clients.length - 1) {
          logEvmEvent("warn", "evm_rpc_primary_failed", context ?? { orderId: "unknown" }, {
            action,
            message: error instanceof Error ? error.message : "Unknown RPC error",
          })
          if (context) {
            emitEvmMetricEvent({
              name: "evm_rpc_primary_failed",
              context,
              meta: { action },
            })
          }
        }
      }
    }

    throw new CryptoPaymentError({
      code: "rpc_unavailable",
      statusCode: 503,
      userMessage: "We could not verify this blockchain transaction right now.",
      message: `EVM RPC call failed for ${action}: ${
        lastError instanceof Error ? lastError.message : "unknown"
      }`,
    })
  }

  private async markConfirming(params: {
    orderId: string
    metadata: EvmDirectCryptoOrderMetadata
    confirmations?: number
    blockNumber?: bigint
  }) {
    const updatedOrder = await updateOrderById(params.orderId, {
      metadata: serializeCryptoOrderMetadata({
        ...params.metadata,
        detailedStatus: "confirming",
        ...(typeof params.confirmations === "number"
          ? { detectedConfirmations: String(params.confirmations) }
          : {}),
        ...(typeof params.blockNumber === "bigint"
          ? { detectedBlockNumber: params.blockNumber.toString() }
          : {}),
      }),
    })

    if (!updatedOrder) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 500,
        userMessage: "We could not validate this crypto payment.",
        orderId: params.orderId,
        message: `Failed to mark confirming EVM checkout: ${params.orderId}`,
      })
    }

    if (typeof params.confirmations === "number") {
      const observabilityContext = buildEvmObservabilityContext({
        orderId: params.orderId,
        metadata: params.metadata,
        currentConfirmations: params.confirmations,
      })
      logEvmEvent("info", "evm_confirmation_progressed", observabilityContext, {
        detectedBlockNumber: params.blockNumber?.toString() ?? null,
      })
      emitEvmMetricEvent({
        name: "evm_confirmation_progressed",
        context: observabilityContext,
        meta: {
          detectedBlockNumber: params.blockNumber?.toString() ?? null,
        },
      })
    }

    return buildCryptoCheckoutData(updatedOrder)
  }

  private async markReviewRequired(params: {
    orderId: string
    metadata: EvmDirectCryptoOrderMetadata
    message: string
    errorCode: CryptoPaymentErrorCode
    actualAmount?: string
    detailedStatus?:
      | "review_required"
      | "late_payment"
      | "underpaid"
      | "overpaid"
      | "duplicate_payment"
    blockNumber?: bigint
    confirmations?: number
  }) {
    const expectedAmount = new BigNumber(params.metadata.cryptoAmount)
    const actualAmountDecimal = params.actualAmount ? new BigNumber(params.actualAmount) : null
    const amountVariance = actualAmountDecimal
      ? actualAmountDecimal.minus(expectedAmount).toFixed()
      : params.metadata.amountVariance
    const detailedStatus = params.detailedStatus ?? "review_required"

    const updatedOrder = await updateOrderById(params.orderId, {
      metadata: serializeCryptoOrderMetadata({
        ...params.metadata,
        detailedStatus,
        reviewReason: params.message,
        reviewCode: params.errorCode,
        latePayment: detailedStatus === "late_payment" ? "true" : "false",
        underpaid: detailedStatus === "underpaid" ? "true" : "false",
        overpaid: detailedStatus === "overpaid" ? "true" : "false",
        duplicatePayment: detailedStatus === "duplicate_payment" ? "true" : "false",
        ...(params.actualAmount ? { actualAmount: params.actualAmount } : {}),
        ...(amountVariance ? { amountVariance } : {}),
        ...(typeof params.confirmations === "number"
          ? { detectedConfirmations: String(params.confirmations) }
          : {}),
        ...(typeof params.blockNumber === "bigint"
          ? { detectedBlockNumber: params.blockNumber.toString() }
          : {}),
        explorerUrl: getExplorerUrl(
          params.metadata.submittedTxHash ?? params.metadata.txSignature ?? ""
        ),
      }),
    })

    if (!updatedOrder) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 500,
        userMessage: "This crypto payment requires manual review.",
        orderId: params.orderId,
        message: `Failed to mark review_required EVM checkout: ${params.orderId}`,
      })
    }

    const observabilityContext = buildEvmObservabilityContext({
      orderId: params.orderId,
      metadata: params.metadata,
      actualAmount: params.actualAmount,
      currentConfirmations: params.confirmations,
    })
    logEvmEvent("info", "evm_review_required", observabilityContext, {
      reviewCode: params.errorCode,
      detailedStatus,
      detectedBlockNumber: params.blockNumber?.toString() ?? null,
    })
    emitEvmMetricEvent({
      name: "evm_review_required",
      context: observabilityContext,
      meta: {
        reviewCode: params.errorCode,
        detailedStatus,
      },
    })

    return buildCryptoCheckoutData(updatedOrder)
  }

  private getAmountTolerance(metadata: EvmDirectCryptoOrderMetadata) {
    return new BigNumber(getCryptoCurrencyConfig(metadata.cryptoCurrency).amountTolerance)
  }

  private async resolveVerificationState(orderId: string, metadata: EvmDirectCryptoOrderMetadata) {
    const txHash = metadata.submittedTxHash
    if (!txHash) {
      return null
    }

    const observabilityContext = buildEvmObservabilityContext({
      orderId,
      metadata,
    })

    const transaction = await this.getOptionalFromClients("getTransaction", (client) =>
      client.getTransaction({ hash: txHash as `0x${string}` })
    , observabilityContext)

    if (!transaction) {
      return {
        kind: "confirming" as const,
      }
    }

    if (Number(transaction.chainId ?? metadata.evmChainId) !== Number(metadata.evmChainId)) {
      throw new CryptoPaymentError({
        code: "wrong_network",
        statusCode: 400,
        userMessage: "This transaction belongs to a different network.",
        orderId,
        message: `Wrong chain detected for EVM transaction: ${txHash}`,
      })
    }

    const receipt = await this.getOptionalFromClients("getTransactionReceipt", (client) =>
      client.getTransactionReceipt({ hash: txHash as `0x${string}` })
    , observabilityContext)

    if (!receipt) {
      return {
        kind: "confirming" as const,
      }
    }

    if (receipt.status !== "success") {
      throw new CryptoPaymentError({
        code: "transaction_failed",
        statusCode: 400,
        userMessage: "This transaction failed on-chain.",
        orderId,
        message: `EVM transaction receipt status is not success: ${txHash}`,
      })
    }

    const block = await this.getRequiredFromClients("getBlock", (client) =>
      client.getBlock({ blockNumber: receipt.blockNumber })
    , observabilityContext)
    const blockTime = new Date(Number(block.timestamp) * 1000)

    if (blockTime.getTime() < new Date((await findOrderById(orderId))?.createdAt ?? 0).getTime()) {
      throw new CryptoPaymentError({
        code: "transaction_too_old",
        statusCode: 400,
        userMessage: "This transaction predates the checkout and cannot be used.",
        orderId,
        message: `EVM transaction predates checkout creation: ${txHash}`,
      })
    }

    const latestBlockNumber = await this.getRequiredFromClients("getBlockNumber", (client) =>
      client.getBlockNumber()
    , observabilityContext)
    const confirmations = Number(latestBlockNumber - receipt.blockNumber + 1n)

    if (metadata.evmAssetType === "native") {
      const recipient = normalizeAddress(transaction.to)
      if (recipient !== normalizeAddress(metadata.walletAddress)) {
        throw new CryptoPaymentError({
          code: "wrong_recipient",
          statusCode: 400,
          userMessage: "This transaction does not pay the configured recipient wallet.",
          orderId,
          message: `Wrong recipient for native EVM transfer: ${txHash}`,
        })
      }

      return {
        kind: "validated" as const,
        actualAmount: formatUnits(
          transaction.value ?? 0n,
          getCryptoCurrencyConfig(metadata.cryptoCurrency).decimals
        ),
        blockNumber: receipt.blockNumber,
        confirmations,
        confirmedAt: blockTime,
      }
    }

    const tokenAddress = normalizeAddress(metadata.tokenAddress)
    if (!tokenAddress) {
      throw new CryptoPaymentError({
        code: "wrong_asset",
        statusCode: 400,
        userMessage: "This transaction does not match the expected asset.",
        orderId,
        message: `Missing token address in EVM metadata: ${orderId}`,
      })
    }

    if (normalizeAddress(transaction.to) !== tokenAddress) {
      throw new CryptoPaymentError({
        code: "wrong_asset",
        statusCode: 400,
        userMessage: "This transaction does not match the expected asset.",
        orderId,
        message: `Wrong token contract for EVM token transfer: ${txHash}`,
      })
    }

    const parsedTransferLogs = parseEventLogs({
      abi: erc20TransferAbi,
      eventName: "Transfer",
      logs: receipt.logs.filter(
        (log) => normalizeAddress((log as { address?: string }).address) === tokenAddress
      ),
    })

    const matchedValue = parsedTransferLogs.reduce((total, log) => {
      const logTo = normalizeAddress((log.args as { to?: string }).to)
      if (logTo !== normalizeAddress(metadata.walletAddress)) {
        return total
      }

      return total + BigInt((log.args as { value?: bigint }).value ?? 0n)
    }, 0n)

    if (matchedValue === 0n) {
      throw new CryptoPaymentError({
        code: "wrong_recipient",
        statusCode: 400,
        userMessage: "This transaction does not pay the configured recipient wallet.",
        orderId,
        message: `No matching recipient transfer log found for EVM token transfer: ${txHash}`,
      })
    }

    return {
      kind: "validated" as const,
      actualAmount: formatUnits(
        matchedValue,
        getCryptoCurrencyConfig(metadata.cryptoCurrency).decimals
      ),
      blockNumber: receipt.blockNumber,
      confirmations,
      confirmedAt: blockTime,
    }
  }

  async verifyPayment(orderId: string, options?: { force?: boolean }) {
    const force = options?.force ?? false
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

    const cryptoMetadata = getCryptoOrderMetadata(currentOrder)
    if (!cryptoMetadata || cryptoMetadata.cryptoProvider !== "evm_direct") {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 400,
        userMessage: "We could not validate this crypto payment.",
        orderId,
        message: `Order is not an EVM direct crypto checkout: ${orderId}`,
      })
    }
    const metadata = cryptoMetadata

    if (!metadata.submittedTxHash) {
      return buildCryptoCheckoutData(currentOrder)
    }

    const observabilityContext = buildEvmObservabilityContext({
      orderId,
      metadata,
    })
    logEvmEvent("info", "evm_verification_started", observabilityContext, {
      force,
    })
    emitEvmMetricEvent({
      name: "evm_verification_started",
      context: observabilityContext,
      meta: { force },
    })

    if (!force && (currentOrder.status === "paid" || currentOrder.status === "canceled")) {
      return buildCryptoCheckoutData(currentOrder)
    }

    try {
      const verification = await this.resolveVerificationState(orderId, metadata)

      if (!verification || verification.kind === "confirming") {
        return this.markConfirming({
          orderId,
          metadata,
        })
      }

      const existingPayment = await findPaymentByProviderId(metadata.submittedTxHash)
      if (existingPayment && existingPayment.orderId !== orderId) {
        return this.markReviewRequired({
          orderId,
          metadata,
          message: "This blockchain transaction is already linked to another order.",
          errorCode: "payment_duplicate",
          detailedStatus: "duplicate_payment",
          actualAmount: verification.actualAmount,
          blockNumber: verification.blockNumber,
          confirmations: verification.confirmations,
        })
      }

      if (verification.confirmedAt.getTime() > new Date(metadata.checkoutExpiresAt).getTime()) {
        return this.markReviewRequired({
          orderId,
          metadata,
          message: "Payment arrived after checkout expiration and needs manual review.",
          errorCode: "payment_late",
          detailedStatus: "late_payment",
          actualAmount: verification.actualAmount,
          blockNumber: verification.blockNumber,
          confirmations: verification.confirmations,
        })
      }

      const expectedAmount = new BigNumber(metadata.cryptoAmount)
      const actualAmount = new BigNumber(verification.actualAmount)
      const amountVariance = actualAmount.minus(expectedAmount)
      const tolerance = this.getAmountTolerance(metadata)

      if (amountVariance.abs().gt(tolerance)) {
        return this.markReviewRequired({
          orderId,
          metadata,
          message: amountVariance.isNegative()
            ? "The transferred amount is below the required checkout amount."
            : "The transferred amount is above the required checkout amount.",
          errorCode: amountVariance.isNegative() ? "payment_underpaid" : "payment_overpaid",
          detailedStatus: amountVariance.isNegative() ? "underpaid" : "overpaid",
          actualAmount: verification.actualAmount,
          blockNumber: verification.blockNumber,
          confirmations: verification.confirmations,
        })
      }

      const requiredConfirmations = Number.parseInt(metadata.requiredConfirmations ?? "15", 10)
      if (verification.confirmations < requiredConfirmations) {
        return this.markConfirming({
          orderId,
          metadata,
          confirmations: verification.confirmations,
          blockNumber: verification.blockNumber,
        })
      }

      const confirmationLatencySeconds = metadata.txSubmittedAt
        ? Math.max(
            0,
            Math.round(
              (verification.confirmedAt.getTime() - new Date(metadata.txSubmittedAt).getTime()) / 1000
            )
          )
        : undefined
      const successContext = buildEvmObservabilityContext({
        orderId,
        metadata,
        actualAmount: verification.actualAmount,
        currentConfirmations: verification.confirmations,
        requiredConfirmations,
        confirmationLatencySeconds,
      })
      logEvmEvent("info", "evm_verification_success", successContext, {
        confirmedAt: verification.confirmedAt.toISOString(),
        detectedBlockNumber: verification.blockNumber.toString(),
      })
      emitEvmMetricEvent({
        name: "evm_verification_success",
        context: successContext,
        meta: {
          confirmedAt: verification.confirmedAt.toISOString(),
        },
      })

      return buildCryptoCheckoutData(
        (await fulfillVerifiedCryptoPayment({
          orderId,
          signature: metadata.submittedTxHash,
          explorerUrl: getExplorerUrl(metadata.submittedTxHash),
        }))!
      )
    } catch (error) {
      if (isCryptoPaymentError(error)) {
        throw error
      }

      logEvmEvent("error", "evm_verification_failed", observabilityContext, {
        message: error instanceof Error ? error.message : "Unknown EVM verification error",
      })

      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 500,
        userMessage: "We could not validate this crypto payment.",
        orderId,
        message: error instanceof Error ? error.message : "Unknown EVM verification error",
      })
    }
  }
}

export const evmPaymentVerifier = new EvmPaymentVerifier()
