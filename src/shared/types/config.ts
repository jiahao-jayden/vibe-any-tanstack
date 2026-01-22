import type { PaymentAdapterType, PlanWithPrice } from "@/shared/types/payment"

export type MailConfig = {
  provider: "resend" | "custom"
  contact: string
}

export type StorageConfig = {
  provider: "cloudflare" | string
}

export type PaymentConfig = {
  enabled: boolean
  provider: PaymentAdapterType
  plans: PlanWithPrice[]
}

export type WebsiteConfig = {
  blog?: {
    initialLoadSize: number
    relatedPostsSize: number
  }
  newsletter?: {
    provider: "resend" | string
    autoSubscribeAfterSignUp: boolean
  }
  plans?: PlanWithPrice[]
}
