import { db } from "@/db"
import { logger } from "@/shared/lib/tools/logger"
import {
  findPaymentByProviderId,
  insertPayment,
  updatePayment,
} from "@/shared/model/payment.model"
import {
  findSubscriptionByProviderId,
  insertSubscription,
  updateSubscription,
  updateSubscriptionById,
} from "@/shared/model/subscription.model"
import type { WebhookEvent } from "../types"

/**
 * Process webhook event from payment provider
 */
export async function processWebhookEvent(event: WebhookEvent): Promise<void> {
  logger.info(`Processing webhook event: ${event.provider} - ${event.type}`)

  switch (event.type) {
    case "checkout.completed":
      await handleCheckoutCompleted(event)
      break

    case "payment.succeeded":
      await handlePaymentSucceeded(event)
      break

    case "payment.failed":
      await handlePaymentFailed(event)
      break

    case "subscription.created":
      await handleSubscriptionCreated(event)
      break

    case "subscription.updated":
      await handleSubscriptionUpdated(event)
      break

    case "subscription.canceled":
      await handleSubscriptionCanceled(event)
      break

    case "refund.created":
      await handleRefundCreated(event)
      break

    default:
      logger.warn(`Unhandled webhook event type: ${event.type}`)
  }
}

async function handleCheckoutCompleted(event: WebhookEvent): Promise<void> {
  const { payment: paymentInfo } = event
  if (!paymentInfo) {
    logger.warn("checkout.completed event missing payment info")
    return
  }

  logger.info(`Checkout completed: ${paymentInfo.providerPaymentId}`)
}

async function handlePaymentSucceeded(event: WebhookEvent): Promise<void> {
  const { payment: paymentInfo, subscription: subscriptionInfo } = event
  if (!paymentInfo) {
    logger.warn("payment.succeeded event missing payment info")
    return
  }

  await db.transaction(async (tx) => {
    // Check idempotency
    const existing = await findPaymentByProviderId(paymentInfo.providerPaymentId, tx)
    if (existing) {
      logger.info(`Payment already exists: ${paymentInfo.providerPaymentId}, skipping`)
      return
    }

    // Determine payment type
    let paymentType: "subscription_create" | "subscription_renewal" | "one_time" = "one_time"
    let subscriptionId: string | undefined

    if (paymentInfo.cycleType === "create") {
      paymentType = "subscription_create"
    } else if (paymentInfo.cycleType === "renewal") {
      paymentType = "subscription_renewal"
    }

    // Handle subscription if present
    if (subscriptionInfo) {
      const existingSub = await findSubscriptionByProviderId(
        subscriptionInfo.providerSubscriptionId,
        tx
      )

      if (existingSub) {
        subscriptionId = existingSub.id

        // Update subscription period for renewals
        if (paymentType === "subscription_renewal") {
          await updateSubscriptionById(
            subscriptionId,
            {
              currentPeriodStart: subscriptionInfo.currentPeriodStart,
              currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
              status: subscriptionInfo.status,
            },
            tx
          )
        }
      }
    }

    // Create payment record
    const newPayment = await insertPayment(
      {
        provider: event.provider,
        providerPaymentId: paymentInfo.providerPaymentId,
        providerInvoiceId: paymentInfo.providerInvoiceId,
        userId: paymentInfo.userId || "",
        subscriptionId,
        paymentType,
        amount: paymentInfo.amount,
        currency: paymentInfo.currency,
        status: "succeeded",
        planId: paymentInfo.planId,
        priceId: paymentInfo.priceId,
        metadata: paymentInfo.metadata,
      },
      tx
    )

    logger.info(`Payment created: ${newPayment.id} (${paymentType})`)

    // Process credits
    if (paymentInfo.planId && paymentInfo.userId) {
      const { processCredits } = await import("@/integrations/payment/services/credits")
      await processCredits({
        userId: paymentInfo.userId,
        planId: paymentInfo.planId,
        paymentId: newPayment.id,
        paymentType,
        periodEnd: subscriptionInfo?.currentPeriodEnd,
        tx,
      })
    }
  })
}

async function handlePaymentFailed(event: WebhookEvent): Promise<void> {
  const { payment: paymentInfo } = event
  if (!paymentInfo) {
    logger.warn("payment.failed event missing payment info")
    return
  }

  logger.warn(`Payment failed: ${paymentInfo.providerPaymentId}`)
  // TODO: Send notification to user
}

async function handleSubscriptionCreated(event: WebhookEvent): Promise<void> {
  const { subscription: subscriptionInfo } = event
  if (!subscriptionInfo) {
    logger.warn("subscription.created event missing subscription info")
    return
  }

  // Check idempotency
  const existing = await findSubscriptionByProviderId(subscriptionInfo.providerSubscriptionId)
  if (existing) {
    logger.info(`Subscription already exists: ${subscriptionInfo.providerSubscriptionId}, skipping`)
    return
  }

  const newSubscription = await insertSubscription({
    provider: event.provider,
    providerSubscriptionId: subscriptionInfo.providerSubscriptionId,
    providerCustomerId: subscriptionInfo.providerCustomerId,
    userId: subscriptionInfo.userId || "",
    planId: subscriptionInfo.planId || "",
    priceId: subscriptionInfo.priceId || "",
    status: subscriptionInfo.status,
    interval: subscriptionInfo.interval,
    amount: subscriptionInfo.amount?.toString(),
    currency: subscriptionInfo.currency,
    currentPeriodStart: subscriptionInfo.currentPeriodStart,
    currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
    cancelAtPeriodEnd: subscriptionInfo.cancelAtPeriodEnd,
    trialStart: subscriptionInfo.trialStart,
    trialEnd: subscriptionInfo.trialEnd,
  })

  logger.info(`Subscription created: ${newSubscription.id}`)
}

async function handleSubscriptionUpdated(event: WebhookEvent): Promise<void> {
  const { subscription: subscriptionInfo } = event
  if (!subscriptionInfo) {
    logger.warn("subscription.updated event missing subscription info")
    return
  }

  const result = await updateSubscription(subscriptionInfo.providerSubscriptionId, {
    status: subscriptionInfo.status,
    priceId: subscriptionInfo.priceId,
    interval: subscriptionInfo.interval,
    currentPeriodStart: subscriptionInfo.currentPeriodStart,
    currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
    cancelAtPeriodEnd: subscriptionInfo.cancelAtPeriodEnd,
    canceledAt: subscriptionInfo.canceledAt,
    cancelReason: subscriptionInfo.cancelReason,
    trialStart: subscriptionInfo.trialStart,
    trialEnd: subscriptionInfo.trialEnd,
  })

  if (result) {
    logger.info(`Subscription updated: ${result.id}`)
  } else {
    logger.warn(`Subscription not found: ${subscriptionInfo.providerSubscriptionId}`)
  }
}

async function handleSubscriptionCanceled(event: WebhookEvent): Promise<void> {
  const { subscription: subscriptionInfo } = event
  if (!subscriptionInfo) {
    logger.warn("subscription.canceled event missing subscription info")
    return
  }

  const result = await updateSubscription(subscriptionInfo.providerSubscriptionId, {
    status: "canceled",
    cancelAtPeriodEnd: true,
    canceledAt: subscriptionInfo.canceledAt || new Date(),
    cancelReason: subscriptionInfo.cancelReason,
  })

  if (result) {
    logger.info(`Subscription canceled: ${result.id}`)
  } else {
    logger.warn(`Subscription not found: ${subscriptionInfo.providerSubscriptionId}`)
  }
}

async function handleRefundCreated(event: WebhookEvent): Promise<void> {
  const { payment: paymentInfo } = event
  if (!paymentInfo) {
    logger.warn("refund.created event missing payment info")
    return
  }

  const result = await updatePayment(paymentInfo.providerPaymentId, {
    status: paymentInfo.status,
    refundedAt: new Date(),
    refundAmount: paymentInfo.amount,
  })

  if (result) {
    logger.info(`Payment refunded: ${result.id}`)
    // TODO: Handle credit deduction for refunds
  } else {
    logger.warn(`Payment not found for refund: ${paymentInfo.providerPaymentId}`)
  }
}
