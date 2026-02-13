import { useCallback, useMemo } from "react"
import { useGlobalContext } from "@/shared/context/global.context"
import type {
  PlanPrice,
  PlanWithPrice,
  Subscription,
  SubscriptionInterval,
} from "@/shared/types/payment"

/**
 * Interval to days mapping
 * Based on Stripe's billing cycle calculations
 */
const INTERVAL_DAYS: Record<SubscriptionInterval | "lifetime", number> = {
  month: 30,
  year: 365,
  lifetime: 36500, // 100 years, effectively infinite
}

function getIntervalDays(interval?: SubscriptionInterval | string): number {
  if (!interval) return INTERVAL_DAYS.lifetime
  return INTERVAL_DAYS[interval as keyof typeof INTERVAL_DAYS] ?? INTERVAL_DAYS.month
}

function getPlanValue(plan: PlanWithPrice): number {
  if (!plan.prices || plan.prices.length === 0) return 0

  const maxDailyPrice = Math.max(
    ...plan.prices.map((p) => {
      const days = getIntervalDays(p.interval)
      return p.amount / days
    })
  )

  return maxDailyPrice
}

export function usePlanComparison() {
  const { userInfo } = useGlobalContext()

  const { activePlan, activeSubscription } = useMemo(
    () =>
      userInfo?.payment ?? {
        activePlan: null as PlanWithPrice | null,
        activeSubscription: null as Subscription | null,
      },
    [userInfo?.payment]
  )

  const getDefaultPriceIndex = useCallback(
    (planId: string, prices: PlanPrice[]): number => {
      if (activeSubscription && prices) {
        const index = prices.findIndex((price) => price.priceId === activeSubscription.priceId)
        if (index !== -1) return index
      }

      if (activePlan && activePlan.id === planId && prices) {
        const activePriceId = activePlan.prices[0]?.priceId
        if (activePriceId) {
          const index = prices.findIndex((price) => price.priceId === activePriceId)
          if (index !== -1) return index
        }
      }

      return 0
    },
    [activePlan, activeSubscription]
  )

  const isCurrentPlan = useCallback(
    (targetPlan: PlanWithPrice, targetPriceId: string): boolean => {
      return activePlan?.id === targetPlan.id && activeSubscription?.priceId === targetPriceId
    },
    [activePlan, activeSubscription]
  )

  const isDowngrade = useCallback(
    (targetPlan: PlanWithPrice, targetPriceId: string): boolean => {
      if (!activePlan || !targetPlan.prices) return false

      if (activePlan.id === targetPlan.id) {
        const activePrice = activePlan.prices.find((p) =>
          activeSubscription ? p.priceId === activeSubscription.priceId : true
        )
        const targetPrice = targetPlan.prices.find((p) => p.priceId === targetPriceId)

        if (activePrice && targetPrice) {
          const activeDays = getIntervalDays(activePrice.interval)
          const targetDays = getIntervalDays(targetPrice.interval)
          return targetDays < activeDays
        }
      }

      const currentPlanValue = getPlanValue(activePlan)
      const targetPlanValue = getPlanValue(targetPlan)

      return targetPlanValue < currentPlanValue
    },
    [activePlan, activeSubscription]
  )

  const isUpgrade = useCallback(
    (targetPlan: PlanWithPrice, targetPriceId: string): boolean => {
      if (!activeSubscription || !activePlan || !targetPlan.prices) return false

      if (activePlan.id === targetPlan.id) {
        const activePrice = activePlan.prices.find((p) => p.priceId === activeSubscription.priceId)
        const targetPrice = targetPlan.prices.find((p) => p.priceId === targetPriceId)

        if (activePrice && targetPrice) {
          const activeDays = getIntervalDays(activePrice.interval)
          const targetDays = getIntervalDays(targetPrice.interval)
          return targetDays > activeDays
        }
      }

      const currentPlanValue = getPlanValue(activePlan)
      const targetPlanValue = getPlanValue(targetPlan)

      return targetPlanValue > currentPlanValue
    },
    [activePlan, activeSubscription]
  )

  const getPlanStatus = useCallback(
    (
      targetPlan: PlanWithPrice,
      targetPriceId: string
    ): "current" | "upgrade" | "downgrade" | "available" => {
      if (isCurrentPlan(targetPlan, targetPriceId)) return "current"
      if (isDowngrade(targetPlan, targetPriceId)) return "downgrade"
      if (isUpgrade(targetPlan, targetPriceId)) return "upgrade"
      return "available"
    },
    [isCurrentPlan, isDowngrade, isUpgrade]
  )

  return {
    activePlan,
    activeSubscription,
    getDefaultPriceIndex,
    isCurrentPlan,
    isDowngrade,
    isUpgrade,
    getPlanStatus,
  }
}
