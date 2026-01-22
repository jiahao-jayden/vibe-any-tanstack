import { relations } from "drizzle-orm"
import { boolean, index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { user } from "./auth.schema"

export const paymentProviderEnum = pgEnum("payment_provider", [
  "stripe",
  "creem",
  "paypal",
  "wechat",
  "alipay",
])

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
  "paused",
  "incomplete",
  "unpaid",
])

export const subscriptionIntervalEnum = pgEnum("subscription_interval", ["month", "year"])

export const subscription = pgTable(
  "subscription",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    provider: paymentProviderEnum("provider").notNull(),
    providerSubscriptionId: text("provider_subscription_id"),
    providerCustomerId: text("provider_customer_id"),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    planId: text("plan_id").notNull(),
    priceId: text("price_id").notNull(),

    status: subscriptionStatusEnum("status").notNull(),
    interval: subscriptionIntervalEnum("interval"),
    amount: text("amount"),
    currency: text("currency").default("usd"),

    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),

    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    canceledAt: timestamp("canceled_at"),
    cancelReason: text("cancel_reason"),

    trialStart: timestamp("trial_start"),
    trialEnd: timestamp("trial_end"),

    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("subscription_user_id_idx").on(table.userId),
    index("subscription_provider_id_idx").on(table.providerSubscriptionId),
    index("subscription_status_idx").on(table.status),
  ]
)

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id],
  }),
}))
