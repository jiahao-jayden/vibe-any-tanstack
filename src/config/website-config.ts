import type { WebsiteConfig } from "@/shared/types/config"

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
      planType: "free",
      prices: [],
    },
    {
      id: "pro",
      planType: "subscription",
      credit: {
        amount: 100,
        expireDays: 31,
      },
      prices: [
        {
          priceId: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID!,
          amount: 990,
          currency: "USD",
          interval: "month",
        },
        {
          priceId: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID!,
          amount: 9900,
          currency: "USD",
          interval: "year",
        },
      ],
      display: {
        isRecommended: true,
        group: "subscription",
      },
    },
    {
      id: "lifetime",
      planType: "lifetime",
      prices: [
        {
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
