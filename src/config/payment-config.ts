import { logger } from "better-auth"
import { websiteConfig } from "@/config/website-config"
import type { PlanPrice, PlanWithPrice } from "@/shared/types/payment"

/**
 * Get all plans from local configuration
 *
 * This returns raw plan data without translations.
 * For translated content, use the `useIntlayer("pricing")` hook in client components.
 *
 * @returns Array of plans with price information
 */
export function getPlans(): PlanWithPrice[] {
  return websiteConfig.plans ?? []
}

/**
 * Find a plan by its ID
 *
 * @param planId Plan ID to search for
 * @returns The matching plan or undefined if not found
 */
export function getPlanById(planId: string): PlanWithPrice | undefined {
  return websiteConfig.plans?.find((plan) => plan.id === planId)
}

/**
 * Find a plan by price ID
 *
 * @param priceId Stripe price ID
 * @returns The matching plan or undefined if not found
 */
export function getPlanByPriceId(priceId: string): PlanWithPrice | undefined {
  return websiteConfig.plans?.find((plan) => plan.prices.some((price) => price.priceId === priceId))
}

/**
 * Find a price by plan ID and price ID
 *
 * @param planId Plan ID to search in
 * @param priceId Price ID to search for
 * @returns The matching price or undefined if not found
 */
export function getPriceById(planId: string, priceId: string): PlanPrice | undefined {
  const plan = getPlanById(planId)
  if (!plan) {
    logger.error(`getPriceById: Plan with ID ${planId} not found`)
    return undefined
  }
  return plan.prices.find((price) => price.priceId === priceId)
}

/**
 * Get the type of a plan
 *
 * @param planId Plan ID to check
 * @returns Plan type or null if plan not found
 */
export function getPlanType(planId: string) {
  const plan = getPlanById(planId)
  return plan?.planType ?? null
}
