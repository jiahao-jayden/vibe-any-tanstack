import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { and, eq, or } from "drizzle-orm"
import { getPlanByPriceId, getPlans } from "@/config/payment-config"
import { configResolver, type PublicConfig } from "@/config/schema"
import { db, user } from "@/db"
import { payment } from "@/db/payment.schema"
import { subscription } from "@/db/subscription.schema"
import { CreditService } from "@/services/credits.service"
import { auth } from "@/shared/lib/auth/auth-server"
import { getConfigs } from "@/shared/model/config.model"
import type { PaymentProvider, PlanWithPrice, Subscription } from "@/shared/types/payment"
import type { UserInfo } from "@/shared/types/user"

export const getConfigFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicConfig> => {
    const dbConfigs = await getConfigs()
    const values = configResolver.resolveAllConfigs(dbConfigs)
    const publicConfigs = configResolver.filterPublicConfigs(values)
    return publicConfigs as PublicConfig
  }
)

export const getUserInfoFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<UserInfo> => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    const userId = session?.user?.id

    if (!userId) {
    return {
      user: null,
      payment: { activePlan: null, activeSubscription: null },
      credits: { userCredits: 0, dailyBonusCredits: 0, nextRefreshTime: null },
    }
    }

    const creditService = new CreditService()
    const [[userData], paymentInfo, credits] = await Promise.all([
      db.select().from(user).where(eq(user.id, userId)).limit(1),
      getPaymentInfo(userId),
      creditService.getUserCredits(userId),
    ])

    return {
      user: userData ?? null,
      payment: paymentInfo,
      credits,
    }
  }
)

async function getPaymentInfo(userId: string): Promise<{
  activePlan: PlanWithPrice | null
  activeSubscription: Subscription | null
}> {
  const plans = getPlans()
  const freePlans = plans.filter((plan) => plan.planType === "free")
  const subscriptionPlans = plans.filter((plan) => plan.planType === "subscription")
  const lifetimePlans = plans.filter((plan) => plan.planType === "lifetime")

  const defaultFreePlan = freePlans[0] ?? null

  if (lifetimePlans.length > 0) {
    const lifetimePlanIds = lifetimePlans.map((plan) => plan.id)
    const payments = await db
      .select({ priceId: payment.priceId })
      .from(payment)
      .where(
        and(
          eq(payment.userId, userId),
          eq(payment.paymentType, "one_time"),
          eq(payment.status, "succeeded")
        )
      )

    const lifetimePayment = payments.find((p) => {
      if (!p.priceId) return false
      const plan = getPlanByPriceId(p.priceId)
      return plan && lifetimePlanIds.includes(plan.id)
    })

    if (lifetimePayment?.priceId) {
      const lifetimePlan = lifetimePlans.find((plan) =>
        plan.prices.some((price) => price.priceId === lifetimePayment.priceId)
      )
      if (lifetimePlan) {
        return { activePlan: lifetimePlan, activeSubscription: null }
      }
    }
  }

  const [activeSubscriptionData] = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, userId),
        or(eq(subscription.status, "active"), eq(subscription.status, "trialing"))
      )
    )
    .limit(1)

  if (activeSubscriptionData) {
    const activeSubscription: Subscription = {
      id: activeSubscriptionData.id,
      provider: activeSubscriptionData.provider as PaymentProvider,
      userId: activeSubscriptionData.userId,
      planId: activeSubscriptionData.planId,
      priceId: activeSubscriptionData.priceId,
      status: activeSubscriptionData.status,
      interval: activeSubscriptionData.interval ?? undefined,
      currentPeriodStart: activeSubscriptionData.currentPeriodStart ?? undefined,
      currentPeriodEnd: activeSubscriptionData.currentPeriodEnd ?? undefined,
      cancelAtPeriodEnd: activeSubscriptionData.cancelAtPeriodEnd ?? undefined,
      trialStart: activeSubscriptionData.trialStart ?? undefined,
      trialEnd: activeSubscriptionData.trialEnd ?? undefined,
      createdAt: activeSubscriptionData.createdAt,
    }

    const subscriptionPlan = subscriptionPlans.find((plan) =>
      plan.prices.some((price) => price.priceId === activeSubscription.priceId)
    )

    return {
      activePlan: subscriptionPlan ?? defaultFreePlan,
      activeSubscription,
    }
  }

  return { activePlan: defaultFreePlan, activeSubscription: null }
}
