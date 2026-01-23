import type { paymentStatusEnum, paymentTypeEnum } from "@/db/payment.schema"
import type {
  paymentProviderEnum,
  subscriptionIntervalEnum,
  subscriptionStatusEnum,
} from "@/db/subscription.schema"

/**
 * Payment Provider - inferred from database enum
 */
export type PaymentProvider = (typeof paymentProviderEnum.enumValues)[number]

/**
 * Subscription Interval - inferred from database enum
 */
export type SubscriptionInterval = (typeof subscriptionIntervalEnum.enumValues)[number]

/**
 * Subscription Status - inferred from database enum
 */
export type SubscriptionStatus = (typeof subscriptionStatusEnum.enumValues)[number]

/**
 * Payment Type - inferred from database enum
 */
export type PaymentType = (typeof paymentTypeEnum.enumValues)[number]

/**
 * Payment Status - inferred from database enum
 */
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number]

/**
 * Webhook Event Types
 */
export type PaymentEventType =
  | "checkout.completed"
  | "payment.succeeded"
  | "payment.failed"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.canceled"
  | "subscription.renewed"
  | "refund.created"

/**
 * Subscription Cycle Type - distinguishes first payment vs renewal
 */
export type SubscriptionCycleType = "create" | "renewal"

/**
 * Plan Types (for local config)
 */
export type PlanType = "free" | "subscription" | "lifetime"

export type PlanInterval = SubscriptionInterval

/**
 * Provider Customers - stored in user table
 */
export interface ProviderCustomers {
  stripe?: string
  creem?: string
  paypal?: string
  wechat?: string
  alipay?: string
}

/**
 * Subscription Data (from database)
 */
export interface Subscription {
  id: string
  provider: PaymentProvider
  providerSubscriptionId?: string
  providerCustomerId?: string
  userId: string
  planId: string
  priceId: string
  status: SubscriptionStatus
  interval?: SubscriptionInterval
  amount?: string
  currency?: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  cancelAtPeriodEnd?: boolean
  canceledAt?: Date
  cancelReason?: string
  trialStart?: Date
  trialEnd?: Date
  createdAt: Date
  updatedAt?: Date
}

/**
 * Payment Record (from database)
 */
export interface Payment {
  id: string
  provider: PaymentProvider
  providerPaymentId?: string
  providerInvoiceId?: string
  userId: string
  subscriptionId?: string
  paymentType: PaymentType
  amount: number
  currency: string
  status: PaymentStatus
  planId?: string
  priceId?: string
  refundedAt?: Date
  refundAmount?: number
  metadata?: Record<string, string>
  createdAt: Date
  updatedAt?: Date
}

/**
 * Credit configuration in plan
 */
export interface Credit {
  amount: number
  expireDays?: number
}

/**
 * Plan Price Configuration
 */
export interface PlanPrice {
  priceId: string
  amount: number
  currency: string
  interval?: PlanInterval
  trialPeriodDays?: number
}

/**
 * Plan Display Configuration
 */
export interface PlanDisplay {
  originalPrice?: number
  isFeatured?: boolean
  isRecommended?: boolean
  group?: string
}

/**
 * Plan with Price Configuration (local config)
 */
export interface PlanWithPrice {
  id: string
  planType: PlanType
  credit?: Credit
  prices: PlanPrice[]
  display?: PlanDisplay
}

/**
 * Credit Package (from database)
 */
export interface CreditPackage {
  id: string
  name: string
  description: string | null
  creditAmount: number
  expireDays: number | null
  priceAmount: number
  currency: string
  stripePriceId: string
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date | null
}

/**
 * Customer
 */
export interface Customer {
  id: string
  email: string
  name?: string
  metadata?: Record<string, unknown>
}

/**
 * Price Definition
 */
export interface Price {
  type: PaymentType
  amount: number
  currency: string
  interval?: PlanInterval
  trialPeriodDays?: number
  priceId: string
  disabled?: boolean
}

/**
 * Plan Definition
 */
export interface Plan {
  id: string
  name?: string
  description?: string
  features?: string[]
  prices: Price[]
  recommended?: boolean
  popular?: boolean
  disabled?: boolean
}
