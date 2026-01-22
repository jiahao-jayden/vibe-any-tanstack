import { relations } from "drizzle-orm"
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { user } from "./auth.schema"
import { paymentProviderEnum, subscription } from "./subscription.schema"

export const paymentTypeEnum = pgEnum("payment_type", [
  "subscription_create",
  "subscription_renewal",
  "one_time",
])

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
  "partially_refunded",
])

export const payment = pgTable(
  "payment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    provider: paymentProviderEnum("provider").notNull(),
    providerPaymentId: text("provider_payment_id"),
    providerInvoiceId: text("provider_invoice_id"),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id").references(() => subscription.id, {
      onDelete: "set null",
    }),

    paymentType: paymentTypeEnum("payment_type").notNull(),

    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),

    status: paymentStatusEnum("status").notNull(),

    planId: text("plan_id"),
    priceId: text("price_id"),

    refundedAt: timestamp("refunded_at"),
    refundAmount: integer("refund_amount"),

    metadata: jsonb("metadata").$type<Record<string, string>>(),

    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("payment_user_id_idx").on(table.userId),
    index("payment_subscription_id_idx").on(table.subscriptionId),
    index("payment_provider_payment_id_idx").on(table.providerPaymentId),
    index("payment_status_idx").on(table.status),
  ]
)

export const paymentRelations = relations(payment, ({ one }) => ({
  user: one(user, {
    fields: [payment.userId],
    references: [user.id],
  }),
  subscription: one(subscription, {
    fields: [payment.subscriptionId],
    references: [subscription.id],
  }),
}))
