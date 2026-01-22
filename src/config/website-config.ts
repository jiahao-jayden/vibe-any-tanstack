import type { WebsiteConfig } from "@/shared/types/config"
import { PaymentTypes, PlanIntervals, PlanTypes } from "@/shared/types/payment"
import { siteConfig } from "./site-config"

/**
 * Website Configuration
 *
 * Global website configuration file containing all core feature configurations.
 * This configuration defines the website's basic information, features, and third-party service integrations.
 *
 * @description Centralized configuration management to avoid hardcoding and improve maintainability
 *
 * Configuration modules include:
 *
 * 1. metadata - Website metadata, SEO information, theme configuration, and brand assets
 * 2. i18n - Internationalization configuration
 * 3. blog - Blog functionality configuration
 * 4. mail - Email service configuration
 * 5. newsletter - Newsletter configuration
 * 6. storage - File storage configuration
 * 7. payment - Payment service configuration (provider, credit settings)
 * 8. plans - Pricing plans configuration (Free, Pro, Lifetime)
 *
 * Note: Credit packages are managed via Admin panel and stored in database.
 */
export const websiteConfig: WebsiteConfig = {
  metadata: siteConfig,
  i18n: {
    defaultLocale: "en",
    locales: {
      en: {
        flag: "🇺🇸",
        name: "English",
      },
      zh: {
        flag: "🇨🇳",
        name: "中文",
      },
    },
  },
  blog: {
    initialLoadSize: 12,
    relatedPostsSize: 3,
  },
  newsletter: {
    provider: "resend",
    autoSubscribeAfterSignUp: true,
  },
  payment: {
    enabled: true,
    provider: "stripe",
    credit: {
      enabled: true,
      allowFreeUserPurchase: false,
      signupBonus: {
        enabled: false,
        amount: 0,
        expireDays: 0,
      },
    },
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
