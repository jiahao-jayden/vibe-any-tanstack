import type { WebsiteConfig } from "@/shared/types/config"
import { PaymentTypes, PlanIntervals, PlanTypes } from "@/shared/types/payment"

export const websiteConfig: WebsiteConfig = {
  blog: {
    initialLoadSize: 12,
    relatedPostsSize: 3,
  },
  newsletter: {
    provider: "resend",
    autoSubscribeAfterSignUp: true,
  },
  plans: [
    {
      id: "free",
      planType: PlanTypes.FREE,
      prices: [],
    },
    {
      id: "pro",
      planType: PlanTypes.SUBSCRIPTION,
      credit: {
        amount: 100,
        expireDays: 31,
      },
      prices: [
        {
          type: PaymentTypes.SUBSCRIPTION,
          priceId: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID!,
          amount: 990,
          currency: "USD",
          interval: PlanIntervals.MONTH,
        },
        {
          type: PaymentTypes.SUBSCRIPTION,
          priceId: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID!,
          amount: 9900,
          currency: "USD",
          interval: PlanIntervals.YEAR,
        },
      ],
      display: {
        isRecommended: true,
        group: "subscription",
      },
    },
    {
      id: "lifetime",
      planType: PlanTypes.LIFETIME,
      prices: [
        {
          type: PaymentTypes.ONE_TIME,
          priceId: import.meta.env.VITE_STRIPE_LIFETIME_PRICE_ID!,
          amount: 19900,
          currency: "USD",
        },
      ],
      display: {
        group: "one-time",
      },
    },
  ],
}
