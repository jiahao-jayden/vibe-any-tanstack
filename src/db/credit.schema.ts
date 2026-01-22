import { relations } from "drizzle-orm"
import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { getSnowId } from "@/shared/lib/tools/hash"
import { user } from "./auth.schema"
import { payment } from "./payment.schema"

/**
 * Credit transaction records
 * Tracks all credit changes for users (purchases, usage, grants, etc.)
 */
export const credits = pgTable("credits", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  /** Unique transaction ID for tracking */
  transactionId: text("transaction_id")
    .notNull()
    .unique()
    .$defaultFn(() => getSnowId()),

  /** User who owns this credit record */
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  /** Reference to payment record, null for admin grants */
  paymentId: text("payment_id"),

  /** Transaction type: "credit" (add) or "debit" (subtract) */
  transactionType: text("transaction_type").notNull(),

  /** Source type: "purchase", "subscription", "grant", "usage", etc. */
  creditsType: text("credits_type").notNull(),

  /** Amount of credits (positive for credit, negative for debit) */
  credits: integer("credits").notNull(),

  /** Optional description of the transaction */
  description: text("description"),

  /** When these credits expire, null means never */
  expiresAt: timestamp("expires_at"),

  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
})

export const creditRelations = relations(credits, ({ one }) => ({
  user: one(user, {
    fields: [credits.userId],
    references: [user.id],
  }),
  payment: one(payment, {
    fields: [credits.paymentId],
    references: [payment.id],
  }),
}))

/**
 * Credit packages configuration
 * Managed via Admin panel, stores purchasable credit packages
 */
export const creditPackage = pgTable("credit_package", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  /** Display name of the credit package */
  name: text("name").notNull(),

  /** Optional description for the package */
  description: text("description"),

  /** Number of credits included in this package */
  creditAmount: integer("credit_amount").notNull(),

  /** Days until credits expire, null means never expires */
  expireDays: integer("expire_days"),

  /** Price in cents (e.g., 990 = $9.90) */
  priceAmount: integer("price_amount").notNull(),

  /** Currency code (e.g., USD, CNY) */
  currency: text("currency").notNull().default("USD"),

  /** Stripe Price ID for checkout */
  stripePriceId: text("stripe_price_id").notNull(),

  /** Display order, lower values appear first */
  sortOrder: integer("sort_order").notNull().default(0),

  /** Whether this package is available for purchase */
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
})

export const creditPackageRelations = relations(creditPackage, () => ({}))
