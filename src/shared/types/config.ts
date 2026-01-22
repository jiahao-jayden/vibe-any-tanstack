import type { PaymentAdapterType, PlanWithPrice } from "@/shared/types/payment"

// Website config types
export type ThemeId = "default" | string
export type ColorMode = "light" | "dark" | "system" | string

export type MetadataConfig = {
  title: string
  author?: string
  description?: string
  theme: {
    defaultTheme: ThemeId
    enableSwitch: boolean
  }
  mode: {
    defaultMode: ColorMode
    enableSwitch: boolean
  }
  images: {
    ogImage?: string
    logo?: string
    isInvert?: boolean
  }
  social: {
    github?: string
    twitter?: string
    discord?: string
    youtube?: string
    [k: string]: string | undefined
  }
}

export type MailConfig = {
  provider: "resend" | "custom"
  contact: string
}

export type StorageConfig = {
  provider: "cloudflare" | string
}

export type CreditConfig = {
  enabled: boolean
  allowFreeUserPurchase: boolean
  signupBonus: {
    enabled: boolean
    amount: number
    expireDays?: number
  }
}

export type PaymentConfig = {
  enabled: boolean
  provider: PaymentAdapterType
  credit: CreditConfig
  plans: PlanWithPrice[]
}

export type WebsiteConfig = {
  metadata: {
    title?: string
    author?: string
    description?: string
    theme: {
      defaultTheme: ThemeId
      enableSwitch: boolean
    }
    mode: {
      defaultMode: ColorMode
      enableSwitch: boolean
    }
    images: {
      ogImage?: string
      logo?: string
      isInvert?: boolean
    }
    social: {
      github?: string
      twitter?: string
      discord?: string
      youtube?: string
      [k: string]: string | undefined
    }
  }
  i18n: {
    defaultLocale: string
    locales: Record<string, { flag: string; name: string }>
  }
  blog?: {
    initialLoadSize: number
    relatedPostsSize: number
  }
  newsletter?: {
    provider: "resend" | string
    autoSubscribeAfterSignUp: boolean
  }
  payment?: {
    enabled: boolean
    provider: PaymentAdapterType
    credit?: CreditConfig
  }
  plans?: PlanWithPrice[]
}
