import { addMonths, addYears } from "date-fns"
import { eq } from "drizzle-orm"
import { type DbTransaction, db, subscription } from "@/db"
import { logger } from "@/shared/lib/tools/logger"
import { findOrderById, updateOrderById } from "@/shared/model/order.model"
import { findPaymentByProviderId, insertPayment } from "@/shared/model/payment.model"
import {
  findActiveSubscriptionByUserId,
  insertSubscription,
} from "@/shared/model/subscription.model"
import type { CryptoOrderMetadata } from "@/shared/types/crypto"
import { processCredits } from "../services/credits"
import { CryptoPaymentError } from "./errors"
import { getCryptoOrderMetadata, serializeCryptoOrderMetadata } from "./order-metadata"
import { solanaPayUrlBuilder } from "./solanapay-url-builder"

function getSubscriptionPeriodEnd(startAt: Date, interval?: string) {
  if (interval === "year") {
    return addYears(startAt, 1)
  }

  return addMonths(startAt, 1)
}

async function createOrRotateCryptoSubscription(
  params: {
    userId: string
    planId: string
    priceId: string
    amount: number
    currency: string
    interval?: string
    providerSubscriptionId: string
  },
  tx: DbTransaction
) {
  const { userId, planId, priceId, amount, currency, interval, providerSubscriptionId } = params

  const currentActiveSubscription = await findActiveSubscriptionByUserId(userId, tx)
  if (currentActiveSubscription?.providerSubscriptionId === providerSubscriptionId) {
    return {
      id: currentActiveSubscription.id,
      currentPeriodEnd: currentActiveSubscription.currentPeriodEnd ?? new Date(),
    }
  }

  if (currentActiveSubscription) {
    await tx
      .update(subscription)
      .set({
        status: "canceled",
        canceledAt: new Date(),
        cancelAtPeriodEnd: true,
        cancelReason: "crypto_replaced",
        updatedAt: new Date(),
      })
      .where(eq(subscription.id, currentActiveSubscription.id))
  }

  const currentPeriodStart = new Date()
  const currentPeriodEnd = getSubscriptionPeriodEnd(currentPeriodStart, interval)

  const newSubscription = await insertSubscription(
    {
      provider: "crypto",
      providerSubscriptionId,
      providerCustomerId: null,
      userId,
      planId,
      priceId,
      status: "active",
      interval: interval === "year" ? "year" : "month",
      amount: amount.toString(),
      currency: currency.toLowerCase(),
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: true,
      cancelReason: "manual_renewal",
    },
    tx
  )

  return {
    id: newSubscription.id,
    currentPeriodEnd,
  }
}

export async function fulfillVerifiedCryptoPayment(params: {
  orderId: string
  signature: string
  explorerUrl?: string
}): Promise<Awaited<ReturnType<typeof findOrderById>>> {
  const { orderId, signature, explorerUrl } = params

  return db.transaction(async (tx) => {
    const currentOrder = await findOrderById(orderId, tx)
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
    if (!metadata) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 400,
        userMessage: "We could not validate this crypto payment.",
        orderId,
        message: `Order is not a crypto checkout: ${orderId}`,
      })
    }

    const existingPayment = await findPaymentByProviderId(signature, tx)
    if (existingPayment) {
      if (existingPayment.orderId !== orderId) {
        throw new CryptoPaymentError({
          code: "payment_duplicate",
          statusCode: 409,
          userMessage: "This blockchain transaction is already linked elsewhere.",
          orderId,
          message: `Crypto payment signature is already linked to another order: ${signature}`,
          context: { signature, existingOrderId: existingPayment.orderId },
        })
      }

      logger.info("crypto_payment_already_fulfilled", {
        orderId,
        paymentId: existingPayment.id,
        txSignature: signature,
      })

      if (currentOrder.status === "paid" && metadata.txSignature === signature) {
        return currentOrder
      }

      const updatedExistingOrder = await updateOrderById(
        orderId,
        {
          status: "paid",
          paidAt: currentOrder.paidAt ?? new Date(),
          metadata: {
            ...metadata,
            detailedStatus: "paid",
            txSignature: signature,
            explorerUrl:
              explorerUrl ?? metadata.explorerUrl ?? solanaPayUrlBuilder.getExplorerUrl(signature),
          },
        },
        tx
      )

      return updatedExistingOrder
    }

    const paidMetadata: CryptoOrderMetadata = {
      ...metadata,
      detailedStatus: "paid",
      txSignature: signature,
      explorerUrl:
        explorerUrl ?? metadata.explorerUrl ?? solanaPayUrlBuilder.getExplorerUrl(signature),
    }

    const paidOrder = await updateOrderById(
      orderId,
      {
        status: "paid",
        paidAt: currentOrder.paidAt ?? new Date(),
        metadata: serializeCryptoOrderMetadata(paidMetadata),
      },
      tx
    )

    if (!paidOrder) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 500,
        userMessage: "We could not validate this crypto payment.",
        orderId,
        message: `Failed to update order as paid: ${orderId}`,
      })
    }

    let subscriptionId: string | undefined
    let periodEnd: Date | undefined
    let paymentType: "subscription_create" | "one_time" = "one_time"

    if (currentOrder.orderType === "subscription") {
      paymentType = "subscription_create"
      const subscriptionResult = await createOrRotateCryptoSubscription(
        {
          userId: currentOrder.userId,
          planId: metadata.planId,
          priceId: metadata.priceId,
          amount: currentOrder.amount,
          currency: currentOrder.currency,
          interval: metadata.priceInterval,
          providerSubscriptionId: `crypto:${orderId}`,
        },
        tx
      )
      subscriptionId = subscriptionResult.id
      periodEnd = subscriptionResult.currentPeriodEnd
    }

    const newPayment = await insertPayment(
      {
        provider: "crypto",
        providerPaymentId: signature,
        providerInvoiceId: null,
        userId: currentOrder.userId,
        orderId: currentOrder.id,
        subscriptionId,
        paymentType,
        amount: currentOrder.amount,
        currency: currentOrder.currency,
        status: "succeeded",
        planId: metadata.planId,
        priceId: metadata.priceId,
        metadata: serializeCryptoOrderMetadata(paidMetadata),
      },
      tx
    )

    if (metadata.planId) {
      await processCredits({
        userId: currentOrder.userId,
        planId: metadata.planId,
        paymentId: newPayment.id,
        paymentType,
        periodEnd,
        tx,
      })
    }

    logger.info("crypto_payment_fulfilled", {
      orderId,
      paymentId: newPayment.id,
      subscriptionId,
      txSignature: signature,
      cryptoCurrency: metadata.cryptoCurrency,
    })

    return paidOrder
  })
}

export async function fulfillPayRamPayment(params: {
  orderId: string
  providerPaymentId: string
}): Promise<Awaited<ReturnType<typeof findOrderById>>> {
  const { orderId, providerPaymentId } = params

  return db.transaction(async (tx) => {
    const currentOrder = await findOrderById(orderId, tx)
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
    if (!metadata || metadata.cryptoProvider !== "payram") {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 400,
        userMessage: "We could not validate this crypto payment.",
        orderId,
        message: `Order is not a PayRam crypto checkout: ${orderId}`,
      })
    }

    const existingPayment = await findPaymentByProviderId(providerPaymentId, tx)
    if (existingPayment) {
      if (existingPayment.orderId !== orderId) {
        throw new CryptoPaymentError({
          code: "payment_duplicate",
          statusCode: 409,
          userMessage: "This payment is already linked elsewhere.",
          orderId,
          message: `PayRam payment is already linked to another order: ${providerPaymentId}`,
          context: { providerPaymentId, existingOrderId: existingPayment.orderId },
        })
      }

      if (currentOrder.status === "paid") {
        return currentOrder
      }
    }

    const paidMetadata: CryptoOrderMetadata = {
      ...metadata,
      detailedStatus: "paid",
      providerPaymentId,
    }

    const paidOrder = await updateOrderById(
      orderId,
      {
        status: "paid",
        paidAt: currentOrder.paidAt ?? new Date(),
        metadata: serializeCryptoOrderMetadata(paidMetadata),
      },
      tx
    )

    if (!paidOrder) {
      throw new CryptoPaymentError({
        code: "payment_validation_failed",
        statusCode: 500,
        userMessage: "We could not validate this crypto payment.",
        orderId,
        message: `Failed to update PayRam order as paid: ${orderId}`,
      })
    }

    let subscriptionId: string | undefined
    let periodEnd: Date | undefined
    let paymentType: "subscription_create" | "one_time" = "one_time"

    if (currentOrder.orderType === "subscription") {
      paymentType = "subscription_create"
      const subscriptionResult = await createOrRotateCryptoSubscription(
        {
          userId: currentOrder.userId,
          planId: metadata.planId,
          priceId: metadata.priceId,
          amount: currentOrder.amount,
          currency: currentOrder.currency,
          interval: metadata.priceInterval,
          providerSubscriptionId: `crypto:${orderId}`,
        },
        tx
      )
      subscriptionId = subscriptionResult.id
      periodEnd = subscriptionResult.currentPeriodEnd
    }

    const newPayment = await insertPayment(
      {
        provider: "crypto",
        providerPaymentId,
        providerInvoiceId: null,
        userId: currentOrder.userId,
        orderId: currentOrder.id,
        subscriptionId,
        paymentType,
        amount: currentOrder.amount,
        currency: currentOrder.currency,
        status: "succeeded",
        planId: metadata.planId,
        priceId: metadata.priceId,
        metadata: serializeCryptoOrderMetadata(paidMetadata),
      },
      tx
    )

    if (metadata.planId) {
      await processCredits({
        userId: currentOrder.userId,
        planId: metadata.planId,
        paymentId: newPayment.id,
        paymentType,
        periodEnd,
        tx,
      })
    }

    logger.info("payram_payment_fulfilled", {
      orderId,
      paymentId: newPayment.id,
      providerPaymentId,
      cryptoCurrency: metadata.cryptoCurrency,
    })

    return paidOrder
  })
}
