import type { user } from "@/db/auth.schema"
import type { PlanWithPrice, Subscription } from "./payment"

export type User = typeof user.$inferSelect

export type UserInfo = {
  user: typeof user.$inferSelect | null
  payment: {
    activePlan: PlanWithPrice | null
    activeSubscription: Subscription | null
  }
  credits: {
    userCredits: number
    dailyBonusCredits: number
    nextRefreshTime: string | null
  }
}
