import type StripeNamespace from "stripe"
import { CURRENCY } from "@/config/payment-config"
import type { PaymentProvider, PaymentStatus, SubscriptionStatus } from "@/shared/types/payment"
import type {
  AdapterCapabilities,
  CheckoutResult,
  CreateCheckoutParams,
  PaymentAdapter,
  UpdateSubscriptionParams,
  UpdateSubscriptionResult,
  WebhookEvent,
  WebhookEventType,
  WebhookPaymentInfo,
  WebhookSubscriptionInfo,
} from "../types"

export interface StripeAdapterConfig {
  secretKey: string
  webhookSecret: string
}

export class StripeAdapter implements PaymentAdapter {
  readonly name: PaymentProvider = "stripe"
  readonly capabilities: AdapterCapabilities = {
    subscription: true,
    oneTime: true,
    customerPortal: true,
    refund: false,
  }

  private stripeInstance: StripeNamespace | null = null
  private secretKey: string
  private webhookSecret: string

  constructor(config: StripeAdapterConfig) {
    if (!config.secretKey) {
      throw new Error("Stripe secret key is required")
    }
    if (!config.webhookSecret) {
      throw new Error("Stripe webhook secret is required")
    }

    this.secretKey = config.secretKey
    this.webhookSecret = config.webhookSecret
  }

  private async getStripe(): Promise<StripeNamespace> {
    if (!this.stripeInstance) {
      const { default: Stripe } = await import("stripe")
      this.stripeInstance = new Stripe(this.secretKey)
    }
    return this.stripeInstance
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const { type, orderId, priceId, planId, email, userId, successUrl, cancelUrl, metadata } =
      params

    const customerId = await this.getOrCreateCustomer(email, userId)

    const commonMetadata = {
      ...metadata,
      orderId,
      userId,
      planId,
      priceId,
    }

    const sessionParams: StripeNamespace.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: type === "subscription" ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: commonMetadata,
    }

    if (type === "subscription") {
      sessionParams.subscription_data = {
        metadata: commonMetadata,
      }
    } else {
      sessionParams.payment_intent_data = {
        metadata: commonMetadata,
      }
      sessionParams.invoice_creation = { enabled: true }
    }

    const session = await (await this.getStripe()).checkout.sessions.create(sessionParams)

    if (!session.url) {
      throw new Error("Failed to create checkout session")
    }

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
    }
  }

  async handleWebhook(request: Request): Promise<WebhookEvent> {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      throw new Error("Missing stripe-signature header")
    }

    const event = (await this.getStripe()).webhooks.constructEvent(
      body,
      signature,
      this.webhookSecret
    )

    return this.mapStripeEvent(event)
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    await (await this.getStripe()).subscriptions.update(providerSubscriptionId, {
      cancel_at_period_end: true,
    })
  }

  async updateSubscription(params: UpdateSubscriptionParams): Promise<UpdateSubscriptionResult> {
    const {
      providerSubscriptionId,
      newPriceId,
      planId,
      prorationBehavior = "create_prorations",
    } = params

    const subscription = await (await this.getStripe()).subscriptions.retrieve(
      providerSubscriptionId
    )
    const itemId = subscription.items.data[0]?.id

    if (!itemId) {
      throw new Error("Subscription has no items")
    }

    const updatedSubscription = await (await this.getStripe()).subscriptions.update(
      providerSubscriptionId,
      {
        items: [
          {
            id: itemId,
            price: newPriceId,
          },
        ],
        proration_behavior: prorationBehavior,
        metadata: {
          ...subscription.metadata,
          planId,
          priceId: newPriceId,
        },
      }
    )

    return {
      providerSubscriptionId: updatedSubscription.id,
      status: this.mapSubscriptionStatus(updatedSubscription.status),
    }
  }

  async getCustomerPortalUrl(providerCustomerId: string, returnUrl: string): Promise<string> {
    const session = await (await this.getStripe()).billingPortal.sessions.create({
      customer: providerCustomerId,
      return_url: returnUrl,
    })
    return session.url
  }

  private async getOrCreateCustomer(email: string, userId: string): Promise<string> {
    const existing = await (await this.getStripe()).customers.list({ email, limit: 1 })

    if (existing.data.length > 0) {
      return existing.data[0].id
    }

    const customer = await (await this.getStripe()).customers.create({
      email,
      metadata: { userId },
    })

    return customer.id
  }

  private async mapStripeEvent(event: StripeNamespace.Event): Promise<WebhookEvent> {
    const eventType = this.mapEventType(event.type)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as StripeNamespace.Checkout.Session
        return {
          type: eventType,
          provider: this.name,
          payment: this.buildPaymentInfoFromSession(session),
          rawEvent: event,
        }
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as StripeNamespace.Invoice
        const subscriptionId = this.getSubscriptionIdFromInvoice(invoice)
        return {
          type: eventType,
          provider: this.name,
          payment: await this.buildPaymentInfoFromInvoice(invoice),
          subscription: subscriptionId
            ? await this.buildSubscriptionInfo(subscriptionId)
            : undefined,
          rawEvent: event,
        }
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as StripeNamespace.Invoice
        return {
          type: eventType,
          provider: this.name,
          payment: await this.buildPaymentInfoFromInvoice(invoice, "failed"),
          rawEvent: event,
        }
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as StripeNamespace.Subscription
        return {
          type: eventType,
          provider: this.name,
          subscription: this.buildSubscriptionInfoFromObject(subscription),
          rawEvent: event,
        }
      }

      case "charge.refunded": {
        const charge = event.data.object as StripeNamespace.Charge
        return {
          type: "refund.created",
          provider: this.name,
          payment: {
            providerPaymentId: charge.payment_intent as string,
            providerCustomerId: charge.customer as string,
            amount: charge.amount_refunded,
            currency: charge.currency,
            status: "refunded",
          },
          rawEvent: event,
        }
      }

      default:
        return {
          type: "ignored",
          provider: this.name,
          rawEvent: event,
        }
    }
  }

  private mapEventType(stripeType: string): WebhookEventType {
    const mapping: Record<string, WebhookEventType> = {
      "checkout.session.completed": "checkout.completed",
      "invoice.payment_succeeded": "payment.succeeded",
      "invoice.payment_failed": "payment.failed",
      "customer.subscription.created": "subscription.created",
      "customer.subscription.updated": "subscription.updated",
      "customer.subscription.deleted": "subscription.canceled",
      "charge.refunded": "refund.created",
    }

    return mapping[stripeType] || "ignored"
  }

  private buildPaymentInfoFromSession(
    session: StripeNamespace.Checkout.Session
  ): WebhookPaymentInfo {
    return {
      providerPaymentId: (session.payment_intent as string) || session.id,
      providerCustomerId: session.customer as string,
      amount: session.amount_total || 0,
      currency: session.currency || CURRENCY.toLowerCase(),
      status: this.mapPaymentStatus(session.payment_status),
      cycleType: session.mode === "subscription" ? "create" : undefined,
      orderId: session.metadata?.orderId,
      planId: session.metadata?.planId,
      priceId: session.metadata?.priceId,
      userId: session.metadata?.userId,
      metadata: session.metadata as Record<string, string>,
    }
  }

  private getSubscriptionIdFromInvoice(invoice: StripeNamespace.Invoice): string | null {
    const lines = invoice.lines?.data || []
    for (const line of lines) {
      if (line.subscription) {
        return line.subscription as string
      }
      if (line.parent?.subscription_item_details?.subscription) {
        return line.parent.subscription_item_details.subscription as string
      }
    }
    return null
  }

  private async buildPaymentInfoFromInvoice(
    invoice: StripeNamespace.Invoice,
    forceStatus?: PaymentStatus
  ): Promise<WebhookPaymentInfo> {
    const cycleType =
      invoice.billing_reason === "subscription_create"
        ? "create"
        : invoice.billing_reason === "subscription_cycle"
          ? "renewal"
          : undefined

    let metadata: Record<string, string> = {}
    const subscriptionId = this.getSubscriptionIdFromInvoice(invoice)
    const paymentIntentId = (invoice as unknown as { payment_intent?: string }).payment_intent

    if (subscriptionId) {
      const sub = await (await this.getStripe()).subscriptions.retrieve(subscriptionId)
      metadata = (sub.metadata as Record<string, string>) || {}
    } else if (paymentIntentId) {
      const paymentIntent = await (await this.getStripe()).paymentIntents.retrieve(paymentIntentId)
      metadata = (paymentIntent.metadata as Record<string, string>) || {}
    }

    return {
      providerPaymentId: paymentIntentId || invoice.id,
      providerInvoiceId: invoice.id,
      providerCustomerId: invoice.customer as string,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: forceStatus || (invoice.status === "paid" ? "succeeded" : "pending"),
      cycleType,
      orderId: metadata.orderId,
      planId: metadata.planId,
      priceId: metadata.priceId,
      userId: metadata.userId,
      metadata,
    }
  }

  private async buildSubscriptionInfo(subscriptionId: string): Promise<WebhookSubscriptionInfo> {
    const subscription = await (await this.getStripe()).subscriptions.retrieve(subscriptionId)
    return this.buildSubscriptionInfoFromObject(subscription)
  }

  private buildSubscriptionInfoFromObject(
    subscription: StripeNamespace.Subscription
  ): WebhookSubscriptionInfo {
    const item = subscription.items.data[0]
    const metadata = subscription.metadata as Record<string, string>

    const periodStart = item?.current_period_start || 0
    const periodEnd = item?.current_period_end || 0

    return {
      providerSubscriptionId: subscription.id,
      providerCustomerId: subscription.customer as string,
      status: this.mapSubscriptionStatus(subscription.status),
      priceId: item?.price?.id,
      planId: metadata?.planId,
      userId: metadata?.userId,
      interval: item?.plan?.interval as "month" | "year" | undefined,
      amount: item?.price?.unit_amount || undefined,
      currency: item?.price?.currency,
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
      cancelReason: subscription.cancellation_details?.reason || undefined,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      metadata,
    }
  }

  private mapPaymentStatus(
    status: StripeNamespace.Checkout.Session.PaymentStatus | null
  ): PaymentStatus {
    switch (status) {
      case "paid":
        return "succeeded"
      case "unpaid":
        return "pending"
      case "no_payment_required":
        return "succeeded"
      default:
        return "pending"
    }
  }

  private mapSubscriptionStatus(status: StripeNamespace.Subscription.Status): SubscriptionStatus {
    const mapping: Record<string, SubscriptionStatus> = {
      active: "active",
      canceled: "canceled",
      incomplete: "incomplete",
      incomplete_expired: "incomplete",
      past_due: "past_due",
      trialing: "trialing",
      unpaid: "unpaid",
      paused: "paused",
    }
    return mapping[status] || "incomplete"
  }
}
