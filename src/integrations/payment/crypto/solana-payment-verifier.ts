import {
  FindReferenceError,
  findReference,
  ValidateTransferError,
  type ValidateTransferFields,
  validateTransfer,
} from "@solana/pay"
import type { ConfirmedTransactionMeta, Message, TransactionResponse } from "@solana/web3.js"
import { Connection, PublicKey } from "@solana/web3.js"
import BigNumber from "bignumber.js"
import { logger } from "@/shared/lib/tools/logger"
import { findOrderById, updateOrderById } from "@/shared/model/order.model"
import { findPaymentByProviderId } from "@/shared/model/payment.model"
import type {
  CryptoCurrencyId,
  CryptoPaymentErrorCode,
  SolanaCryptoOrderMetadata,
} from "@/shared/types/crypto"
import { getCryptoPaymentConfig } from "./config"
import { getCryptoCurrencyConfig } from "./currencies"
import { CryptoPaymentError, isCryptoPaymentError } from "./errors"
import { fulfillVerifiedCryptoPayment } from "./fulfillment"
import {
  buildCryptoCheckoutData,
  getCryptoOrderMetadata,
  serializeCryptoOrderMetadata,
} from "./order-metadata"
import { solanaPayUrlBuilder } from "./solanapay-url-builder"

const ZERO_AMOUNT = new BigNumber(0) as unknown as ValidateTransferFields["amount"]

export class SolanaPaymentVerifier {
  private getConnection() {
    const cryptoConfig = getCryptoPaymentConfig()
    return new Connection(cryptoConfig.rpcUrl, "confirmed")
  }

  private async markExpired(
    orderId: string,
    metadata: SolanaCryptoOrderMetadata
  ) {
    const expiredOrder = await updateOrderById(orderId, {
      status: "expired",
      metadata: serializeCryptoOrderMetadata({
        ...metadata,
        detailedStatus: "expired",
      }),
    })

    if (!expiredOrder) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 500,
        userMessage: "We could not validate this crypto payment.",
        orderId,
        message: `Failed to mark expired crypto checkout: ${orderId}`,
      })
    }

    logger.info("crypto_checkout_expired", { orderId })
    return buildCryptoCheckoutData(expiredOrder)
  }

  private async markReviewRequired(params: {
    orderId: string
    metadata: SolanaCryptoOrderMetadata
    message: string
    signature?: string
    confirmedAt?: string
    errorCode?: CryptoPaymentErrorCode
    actualAmount?: string
    detailedStatus?:
      | "review_required"
      | "late_payment"
      | "underpaid"
      | "overpaid"
      | "duplicate_payment"
  }) {
    const {
      orderId,
      metadata,
      message,
      signature,
      confirmedAt,
      errorCode,
      actualAmount,
      detailedStatus = "review_required",
    } = params
    const expectedAmount = new BigNumber(metadata.cryptoAmount)
    const actualAmountDecimal = actualAmount ? new BigNumber(actualAmount) : null
    const amountVariance = actualAmountDecimal
      ? actualAmountDecimal.minus(expectedAmount).toFixed()
      : metadata.amountVariance
    const isLatePayment = detailedStatus === "late_payment"
    const isUnderpaid = detailedStatus === "underpaid"
    const isOverpaid = detailedStatus === "overpaid"
    const isDuplicate = detailedStatus === "duplicate_payment"

    const reviewMetadata: SolanaCryptoOrderMetadata = {
      ...metadata,
      detailedStatus,
      reviewReason: message,
      latePayment: isLatePayment ? "true" : "false",
      underpaid: isUnderpaid ? "true" : "false",
      overpaid: isOverpaid ? "true" : "false",
      duplicatePayment: isDuplicate ? "true" : "false",
      ...(errorCode || metadata.reviewCode ? { reviewCode: errorCode ?? metadata.reviewCode } : {}),
      ...(signature || metadata.txSignature
        ? { txSignature: signature ?? metadata.txSignature }
        : {}),
      ...(actualAmountDecimal || metadata.actualAmount
        ? { actualAmount: actualAmountDecimal?.toFixed() ?? metadata.actualAmount }
        : {}),
      ...(amountVariance ? { amountVariance } : {}),
      ...(confirmedAt || metadata.confirmedAt
        ? { confirmedAt: confirmedAt ?? metadata.confirmedAt }
        : {}),
      ...(signature || metadata.explorerUrl
        ? {
            explorerUrl: signature
              ? solanaPayUrlBuilder.getExplorerUrl(signature)
              : metadata.explorerUrl,
          }
        : {}),
    }

    const reviewOrder = await updateOrderById(orderId, {
      metadata: serializeCryptoOrderMetadata(reviewMetadata),
    })

    if (!reviewOrder) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 500,
        userMessage: "This crypto payment requires manual review.",
        orderId,
        message: `Failed to mark review_required crypto checkout: ${orderId}`,
      })
    }

    logger.warn("crypto_verification_review_required", {
      orderId,
      referenceKey: metadata.referenceKey,
      cryptoCurrency: metadata.cryptoCurrency,
      message,
      detailedStatus,
      errorCode,
    })

    return buildCryptoCheckoutData(reviewOrder)
  }

  private getAmountTolerance(cryptoCurrency: CryptoCurrencyId) {
    return new BigNumber(getCryptoCurrencyConfig(cryptoCurrency).amountTolerance)
  }

  private getConfirmedAt(response: TransactionResponse) {
    return response.blockTime ? new Date(response.blockTime * 1000) : new Date()
  }

  private getTransferredAmount(response: TransactionResponse, metadata: SolanaCryptoOrderMetadata) {
    if (metadata.tokenMint) {
      return this.getTokenTransferredAmount(response.meta, metadata)
    }

    return this.getSolTransferredAmount(response.transaction.message, response.meta, metadata)
  }

  private getSolTransferredAmount(
    message: Message,
    meta: ConfirmedTransactionMeta | null,
    metadata: SolanaCryptoOrderMetadata
  ) {
    if (!meta) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 500,
        userMessage: "We could not validate this crypto payment.",
        message: "Transaction metadata is missing for SOL transfer validation",
        context: { orderId: metadata.referenceKey },
      })
    }

    const recipientIndex = message.accountKeys.findIndex((account) =>
      account.equals(new PublicKey(metadata.walletAddress))
    )
    if (recipientIndex === -1) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 500,
        userMessage: "We could not validate this crypto payment.",
        message: "Recipient was not found in the validated SOL transaction",
        context: { walletAddress: metadata.walletAddress, referenceKey: metadata.referenceKey },
      })
    }

    const preBalance = new BigNumber(meta.preBalances[recipientIndex] ?? 0)
    const postBalance = new BigNumber(meta.postBalances[recipientIndex] ?? 0)
    return postBalance.minus(preBalance).div(1_000_000_000)
  }

  private getTokenTransferredAmount(
    meta: ConfirmedTransactionMeta | null,
    metadata: SolanaCryptoOrderMetadata
  ) {
    if (!meta) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 500,
        userMessage: "We could not validate this crypto payment.",
        message: "Transaction metadata is missing for token transfer validation",
        context: { referenceKey: metadata.referenceKey },
      })
    }

    const matchingBalance = meta.postTokenBalances?.find(
      (balance) => balance.owner === metadata.walletAddress && balance.mint === metadata.tokenMint
    )

    if (!matchingBalance) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 500,
        userMessage: "We could not validate this crypto payment.",
        message: "Recipient token account was not found in the validated transaction",
        context: {
          walletAddress: metadata.walletAddress,
          tokenMint: metadata.tokenMint,
          referenceKey: metadata.referenceKey,
        },
      })
    }

    const accountIndex = matchingBalance.accountIndex
    const preBalanceEntry = meta.preTokenBalances?.find(
      (balance) => balance.accountIndex === accountIndex
    )
    const postBalanceEntry = meta.postTokenBalances?.find(
      (balance) => balance.accountIndex === accountIndex
    )
    const preBalance = new BigNumber(preBalanceEntry?.uiTokenAmount.uiAmountString ?? "0")
    const postBalance = new BigNumber(postBalanceEntry?.uiTokenAmount.uiAmountString ?? "0")

    return postBalance.minus(preBalance)
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
    if (!cryptoMetadata || cryptoMetadata.cryptoProvider !== "solanapay") {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 400,
        userMessage: "We could not validate this crypto payment.",
        orderId,
        message: `Order is not a crypto checkout: ${orderId}`,
      })
    }
    const metadata = cryptoMetadata

    logger.info("crypto_verification_started", {
      orderId,
      referenceKey: metadata.referenceKey,
      cryptoCurrency: metadata.cryptoCurrency,
      force,
    })

    if (!force && (currentOrder.status === "paid" || currentOrder.status === "canceled")) {
      return buildCryptoCheckoutData(currentOrder)
    }

    const checkoutExpiresAt = new Date(metadata.checkoutExpiresAt)

    const connection = this.getConnection()
    const reference = new PublicKey(metadata.referenceKey)

    try {
      const signatureInfo = await findReference(connection, reference, { finality: "confirmed" })
      const validatedTransaction = await validateTransfer(
        connection,
        signatureInfo.signature,
        {
          recipient: new PublicKey(metadata.walletAddress),
          amount: ZERO_AMOUNT,
          reference,
          memo: metadata.memo,
          splToken: metadata.tokenMint ? new PublicKey(metadata.tokenMint) : undefined,
        },
        {
          commitment: "confirmed",
        }
      )

      const confirmedAt = this.getConfirmedAt(validatedTransaction)
      const actualAmount = this.getTransferredAmount(validatedTransaction, metadata)
      const expectedAmount = new BigNumber(metadata.cryptoAmount)
      const tolerance = this.getAmountTolerance(metadata.cryptoCurrency)
      const amountVariance = actualAmount.minus(expectedAmount)

      if (confirmedAt.getTime() > checkoutExpiresAt.getTime()) {
        logger.warn("crypto_late_payment", {
          orderId,
          referenceKey: metadata.referenceKey,
          txSignature: signatureInfo.signature,
          confirmedAt: confirmedAt.toISOString(),
          expiresAt: metadata.checkoutExpiresAt,
        })

        return this.markReviewRequired({
          orderId,
          metadata,
          message: "Payment arrived after checkout expiration and needs manual review.",
          signature: signatureInfo.signature,
          confirmedAt: confirmedAt.toISOString(),
          errorCode: "payment_late",
          actualAmount: actualAmount.toFixed(),
          detailedStatus: "late_payment",
        })
      }

      const existingPayment = await findPaymentByProviderId(signatureInfo.signature)
      if (existingPayment && existingPayment.orderId !== orderId) {
        return this.markReviewRequired({
          orderId,
          metadata,
          message: "This blockchain transaction is already linked to another order.",
          signature: signatureInfo.signature,
          confirmedAt: confirmedAt.toISOString(),
          errorCode: "payment_duplicate",
          actualAmount: actualAmount.toFixed(),
          detailedStatus: "duplicate_payment",
        })
      }

      if (metadata.txSignature && metadata.txSignature !== signatureInfo.signature) {
        return this.markReviewRequired({
          orderId,
          metadata,
          message: "Multiple transactions were detected for this checkout and need manual review.",
          signature: signatureInfo.signature,
          confirmedAt: confirmedAt.toISOString(),
          errorCode: "payment_duplicate",
          actualAmount: actualAmount.toFixed(),
          detailedStatus: "duplicate_payment",
        })
      }

      if (amountVariance.abs().gt(tolerance)) {
        logger.error("crypto_amount_mismatch", {
          orderId,
          referenceKey: metadata.referenceKey,
          cryptoCurrency: metadata.cryptoCurrency,
          expected: expectedAmount.toFixed(),
          actual: actualAmount.toFixed(),
          tolerance: tolerance.toFixed(),
        })

        return this.markReviewRequired({
          orderId,
          metadata,
          message: amountVariance.isNegative()
            ? "The transferred amount is below the required checkout amount."
            : "The transferred amount is above the required checkout amount.",
          signature: signatureInfo.signature,
          confirmedAt: confirmedAt.toISOString(),
          errorCode: amountVariance.isNegative() ? "payment_underpaid" : "payment_overpaid",
          actualAmount: actualAmount.toFixed(),
          detailedStatus: amountVariance.isNegative() ? "underpaid" : "overpaid",
        })
      }

      const paidOrder = await fulfillVerifiedCryptoPayment({
        orderId,
        signature: signatureInfo.signature,
      })

      if (!paidOrder) {
        throw new CryptoPaymentError({
          code: "payment_validation_failed",
          statusCode: 500,
          userMessage: "We could not validate this crypto payment.",
          orderId,
          message: `Failed to fulfill verified crypto payment: ${orderId}`,
        })
      }

      logger.info("crypto_verification_success", {
        orderId,
        referenceKey: metadata.referenceKey,
        cryptoCurrency: metadata.cryptoCurrency,
        txSignature: signatureInfo.signature,
        actualAmount: actualAmount.toFixed(),
      })

      return buildCryptoCheckoutData(paidOrder)
    } catch (error) {
      if (error instanceof FindReferenceError) {
        const isExpired = checkoutExpiresAt.getTime() <= Date.now()
        logger.info("crypto_checkout_polled", {
          orderId,
          referenceKey: metadata.referenceKey,
          cryptoCurrency: metadata.cryptoCurrency,
        })

        if (isExpired) {
          return this.markExpired(orderId, metadata)
        }

        return buildCryptoCheckoutData(currentOrder)
      }

      if (isCryptoPaymentError(error)) {
        throw error
      }

      const message = error instanceof Error ? error.message : "Unknown validation error"

      if (error instanceof ValidateTransferError && error.message === "amount not transferred") {
        return this.markReviewRequired({
          orderId,
          metadata,
          message: "The transferred amount is below the required checkout amount.",
          errorCode: "payment_underpaid",
          detailedStatus: "underpaid",
        })
      }

      logger.error("crypto_verification_failed", {
        orderId,
        referenceKey: metadata.referenceKey,
        cryptoCurrency: metadata.cryptoCurrency,
        message,
      })

      return this.markReviewRequired({
        orderId,
        metadata,
        message,
        errorCode: "payment_validation_failed",
      })
    }
  }
}

export const solanaPaymentVerifier = new SolanaPaymentVerifier()
