import type {
  PaymentProvider,
  PaymentStatus,
  SubscriptionCycleType,
  SubscriptionInterval,
  SubscriptionStatus,
} from "@/shared/types/payment"

/**
 * Adapter capabilities
 */
export interface AdapterCapabilities {
  subscription: boolean
  oneTime: boolean
  customerPortal: boolean
  refund: boolean
}

/**
 * Create checkout params
 */
export interface CreateCheckoutParams {
  type: "subscription" | "one_time"
  planId: string
  priceId: string
  email: string
  userId: string
  successUrl: string
  cancelUrl?: string
  metadata?: Record<string, string>
}

/**
 * Checkout result
 */
export interface CheckoutResult {
  sessionId: string
  checkoutUrl: string
}

/**
 * Payment info from webhook
 */
export interface WebhookPaymentInfo {
  providerPaymentId: string
  providerInvoiceId?: string
  providerCustomerId: string
  amount: number
  currency: string
  status: PaymentStatus
  cycleType?: SubscriptionCycleType
  planId?: string
  priceId?: string
  userId?: string
  metadata?: Record<string, string>
}

/**
 * Subscription info from webhook
 */
export interface WebhookSubscriptionInfo {
  providerSubscriptionId: string
  providerCustomerId: string
  status: SubscriptionStatus
  priceId?: string
  planId?: string
  userId?: string
  interval?: SubscriptionInterval
  amount?: number
  currency?: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd?: boolean
  canceledAt?: Date
  cancelReason?: string
  trialStart?: Date
  trialEnd?: Date
  metadata?: Record<string, string>
}

/**
 * Webhook event types
 */
export type WebhookEventType =
  | "checkout.completed"
  | "payment.succeeded"
  | "payment.failed"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.canceled"
  | "refund.created"
  | "ignored"

/**
 * Webhook event
 */
export interface WebhookEvent {
  type: WebhookEventType
  provider: PaymentProvider
  payment?: WebhookPaymentInfo
  subscription?: WebhookSubscriptionInfo
  rawEvent: unknown
}

/**
 * Customer portal result
 */
export interface CustomerPortalResult {
  url: string
}

/**
 * Payment adapter interface
 */
export interface PaymentAdapter {
  readonly name: PaymentProvider
  readonly capabilities: AdapterCapabilities

  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>

  handleWebhook(request: Request): Promise<WebhookEvent>

  cancelSubscription?(providerSubscriptionId: string): Promise<void>

  getCustomerPortalUrl?(providerCustomerId: string, returnUrl: string): Promise<string>
}
