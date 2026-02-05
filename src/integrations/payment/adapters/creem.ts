import crypto from "node:crypto"
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

export interface CreemAdapterConfig {
  apiKey: string
  webhookSecret: string
  testMode?: boolean
}

interface CreemCheckoutResponse {
  id: string
  mode: "test" | "prod"
  object: string
  status: string
  checkout_url: string
  product: string
  units?: number
  request_id?: string
  success_url?: string
  metadata?: Record<string, string>
}

interface CreemProduct {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  billing_type: "recurring" | "onetime"
  billing_period?: string
  status: string
  tax_mode?: string
  tax_category?: string
}

interface CreemCustomer {
  id: string
  object: string
  email: string
  name?: string
  country?: string
  created_at: string
  updated_at: string
}

interface CreemSubscription {
  id: string
  object: string
  product: string | CreemProduct
  customer: string | CreemCustomer
  status: string
  collection_method: string
  items?: CreemSubscriptionItem[]
  last_transaction_id?: string
  last_transaction_date?: string
  next_transaction_date?: string
  current_period_start_date?: string
  current_period_end_date?: string
  canceled_at?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, string>
}

interface CreemSubscriptionItem {
  id: string
  object: string
  product_id: string
  price_id?: string
  units: number
  created_at: string
  updated_at: string
}

interface CreemOrder {
  id: string
  customer: string
  product: string
  amount: number
  currency: string
  status: string
  type: string
  created_at: string
  updated_at: string
}

interface CreemWebhookEvent {
  id: string
  eventType: string
  created_at: number
  object: {
    id: string
    object: string
    request_id?: string
    status: string
    mode: string
    order?: CreemOrder
    product?: CreemProduct
    customer?: CreemCustomer
    subscription?: CreemSubscription
    custom_fields?: unknown[]
    metadata?: Record<string, string>
    items?: CreemSubscriptionItem[]
    current_period_start_date?: string
    current_period_end_date?: string
    canceled_at?: string
  }
}

export class CreemAdapter implements PaymentAdapter {
  readonly name: PaymentProvider = "creem"
  readonly capabilities: AdapterCapabilities = {
    subscription: true,
    oneTime: true,
    customerPortal: true,
    refund: false,
  }

  private apiKey: string
  private webhookSecret: string
  private baseUrl: string

  constructor(config: CreemAdapterConfig) {
    if (!config.apiKey) {
      throw new Error("Creem API key is required")
    }
    if (!config.webhookSecret) {
      throw new Error("Creem webhook secret is required")
    }

    this.apiKey = config.apiKey
    this.webhookSecret = config.webhookSecret
    this.baseUrl = config.testMode ? "https://test-api.creem.io" : "https://api.creem.io"
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const { orderId, priceId, planId, email, userId, successUrl, metadata } = params

    const response = await fetch(`${this.baseUrl}/v1/checkouts`, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: priceId,
        request_id: orderId,
        success_url: successUrl,
        customer: { email },
        metadata: {
          ...metadata,
          orderId,
          userId,
          planId,
          priceId,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Failed to create Creem checkout: ${JSON.stringify(error)}`)
    }

    const checkout = (await response.json()) as CreemCheckoutResponse

    return {
      sessionId: checkout.id,
      checkoutUrl: checkout.checkout_url,
    }
  }

  async handleWebhook(request: Request): Promise<WebhookEvent> {
    const body = await request.text()
    const signature = request.headers.get("creem-signature")

    if (!signature) {
      throw new Error("Missing creem-signature header")
    }

    const computedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(body)
      .digest("hex")

    if (computedSignature !== signature) {
      throw new Error("Invalid webhook signature")
    }

    const event = JSON.parse(body) as CreemWebhookEvent
    return this.mapCreemEvent(event)
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/v1/subscriptions/${providerSubscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "immediate",
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Failed to cancel Creem subscription: ${JSON.stringify(error)}`)
    }
  }

  async updateSubscription(params: UpdateSubscriptionParams): Promise<UpdateSubscriptionResult> {
    const { providerSubscriptionId, newPriceId } = params

    const response = await fetch(
      `${this.baseUrl}/v1/subscriptions/${providerSubscriptionId}/upgrade`,
      {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: newPriceId,
          update_behavior: "proration-charge-immediately",
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Failed to update Creem subscription: ${JSON.stringify(error)}`)
    }

    const updatedSubscription = (await response.json()) as CreemSubscription

    return {
      providerSubscriptionId: updatedSubscription.id,
      status: this.mapSubscriptionStatus(updatedSubscription.status),
    }
  }

  async getCustomerPortalUrl(providerCustomerId: string, _returnUrl: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/customers/billing`, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_id: providerCustomerId,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`Failed to create Creem customer portal: ${JSON.stringify(error)}`)
    }

    const result = (await response.json()) as { customer_portal_link: string }
    return result.customer_portal_link
  }

  private mapCreemEvent(event: CreemWebhookEvent): WebhookEvent {
    const eventType = this.mapEventType(event.eventType)

    switch (event.eventType) {
      case "checkout.completed": {
        const { customer, subscription, metadata } = event.object
        return {
          type: eventType,
          provider: this.name,
          payment: this.buildPaymentInfoFromCheckout(event.object),
          subscription: subscription
            ? this.buildSubscriptionInfoFromObject(subscription, customer, metadata)
            : undefined,
          rawEvent: event,
        }
      }

      case "subscription.active":
      case "subscription.paid": {
        const obj = event.object
        const subscriptionObj = this.isSubscriptionObject(obj)
          ? obj
          : (obj.subscription as CreemSubscription)
        const customer = obj.customer as CreemCustomer
        const metadata = obj.metadata

        return {
          type: eventType,
          provider: this.name,
          payment:
            event.eventType === "subscription.paid"
              ? this.buildPaymentInfoFromSubscription(obj, metadata)
              : undefined,
          subscription: this.buildSubscriptionInfoFromObject(
            subscriptionObj || obj,
            customer,
            metadata
          ),
          rawEvent: event,
        }
      }

      case "subscription.canceled":
      case "subscription.paused":
      case "subscription.update": {
        const obj = event.object
        const customer = obj.customer as CreemCustomer
        const metadata = obj.metadata

        return {
          type: eventType,
          provider: this.name,
          subscription: this.buildSubscriptionInfoFromObject(
            obj as unknown as CreemSubscription,
            customer,
            metadata
          ),
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

  private isSubscriptionObject(obj: unknown): obj is CreemSubscription {
    return (
      typeof obj === "object" &&
      obj !== null &&
      "current_period_start_date" in obj &&
      "current_period_end_date" in obj
    )
  }

  private mapEventType(creemType: string): WebhookEventType {
    const mapping: Record<string, WebhookEventType> = {
      "checkout.completed": "checkout.completed",
      "subscription.active": "subscription.created",
      "subscription.paid": "payment.succeeded",
      "subscription.canceled": "subscription.canceled",
      "subscription.paused": "subscription.updated",
      "subscription.update": "subscription.updated",
    }

    return mapping[creemType] || "ignored"
  }

  private buildPaymentInfoFromCheckout(checkout: CreemWebhookEvent["object"]): WebhookPaymentInfo {
    const { customer, order, metadata, product } = checkout

    return {
      providerPaymentId: order?.id || checkout.id,
      providerCustomerId: typeof customer === "string" ? customer : customer?.id || "",
      amount: order?.amount || product?.price || 0,
      currency: order?.currency || product?.currency || CURRENCY.toLowerCase(),
      status: this.mapPaymentStatus(checkout.status),
      cycleType: order?.type === "recurring" ? "create" : undefined,
      orderId: metadata?.orderId || checkout.request_id,
      planId: metadata?.planId,
      priceId: metadata?.priceId,
      userId: metadata?.userId,
      metadata,
    }
  }

  private buildPaymentInfoFromSubscription(
    obj: CreemWebhookEvent["object"],
    metadata?: Record<string, string>
  ): WebhookPaymentInfo {
    const customer = obj.customer as CreemCustomer
    const product = typeof obj.product === "object" ? obj.product : undefined

    return {
      providerPaymentId: obj.id,
      providerCustomerId: typeof customer === "string" ? customer : customer?.id || "",
      amount: product?.price || 0,
      currency: product?.currency || CURRENCY.toLowerCase(),
      status: "succeeded",
      cycleType: "renewal",
      orderId: metadata?.orderId,
      planId: metadata?.planId,
      priceId: metadata?.priceId,
      userId: metadata?.userId,
      metadata,
    }
  }

  private buildSubscriptionInfoFromObject(
    subscription: CreemSubscription | CreemWebhookEvent["object"],
    customer?: CreemCustomer | string,
    metadata?: Record<string, string>
  ): WebhookSubscriptionInfo {
    const sub = subscription as CreemSubscription
    const customerId =
      typeof customer === "string"
        ? customer
        : typeof sub.customer === "string"
          ? sub.customer
          : (sub.customer as CreemCustomer)?.id || ""

    const product = typeof sub.product === "object" ? (sub.product as CreemProduct) : undefined

    const periodStart = sub.current_period_start_date
      ? new Date(sub.current_period_start_date)
      : new Date()
    const periodEnd = sub.current_period_end_date
      ? new Date(sub.current_period_end_date)
      : new Date()

    const interval = this.mapBillingPeriod(product?.billing_period)

    return {
      providerSubscriptionId: sub.id,
      providerCustomerId: customerId,
      status: this.mapSubscriptionStatus(sub.status),
      priceId: metadata?.priceId || product?.id,
      planId: metadata?.planId,
      userId: metadata?.userId,
      interval,
      amount: product?.price,
      currency: product?.currency,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: sub.status === "scheduled_cancel",
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at) : undefined,
      metadata: metadata || sub.metadata,
    }
  }

  private mapPaymentStatus(status: string): PaymentStatus {
    switch (status) {
      case "completed":
      case "paid":
      case "succeeded":
        return "succeeded"
      case "pending":
      case "incomplete":
        return "pending"
      case "failed":
        return "failed"
      case "refunded":
        return "refunded"
      default:
        return "pending"
    }
  }

  private mapSubscriptionStatus(status: string): SubscriptionStatus {
    const mapping: Record<string, SubscriptionStatus> = {
      active: "active",
      canceled: "canceled",
      paused: "paused",
      trialing: "trialing",
      unpaid: "unpaid",
      incomplete: "incomplete",
      past_due: "past_due",
      scheduled_cancel: "active",
      expired: "canceled",
    }
    return mapping[status] || "incomplete"
  }

  private mapBillingPeriod(period?: string): "month" | "year" | undefined {
    if (!period) return undefined

    if (period.includes("month")) return "month"
    if (period.includes("year")) return "year"

    return undefined
  }
}
