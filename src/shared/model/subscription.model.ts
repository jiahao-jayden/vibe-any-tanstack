import { eq } from "drizzle-orm"
import { type DbTransaction, db } from "@/db"
import { subscription } from "@/db/subscription.schema"

export type SubscriptionInsert = typeof subscription.$inferInsert
export type SubscriptionSelect = typeof subscription.$inferSelect

export async function findSubscriptionByProviderId(
  providerSubscriptionId: string,
  tx?: DbTransaction
) {
  const dbInstance = tx || db
  const [result] = await dbInstance
    .select()
    .from(subscription)
    .where(eq(subscription.providerSubscriptionId, providerSubscriptionId))
    .limit(1)
  return result
}

export async function findSubscriptionById(id: string, tx?: DbTransaction) {
  const dbInstance = tx || db
  const [result] = await dbInstance
    .select()
    .from(subscription)
    .where(eq(subscription.id, id))
    .limit(1)
  return result
}

export async function findSubscriptionsByUserId(userId: string, tx?: DbTransaction) {
  const dbInstance = tx || db
  return dbInstance.select().from(subscription).where(eq(subscription.userId, userId))
}

export async function insertSubscription(data: SubscriptionInsert, tx?: DbTransaction) {
  const dbInstance = tx || db
  const [result] = await dbInstance.insert(subscription).values(data).returning()
  return result
}

export async function updateSubscription(
  providerSubscriptionId: string,
  data: Partial<SubscriptionInsert>,
  tx?: DbTransaction
) {
  const dbInstance = tx || db
  const [result] = await dbInstance
    .update(subscription)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subscription.providerSubscriptionId, providerSubscriptionId))
    .returning()
  return result
}

export async function updateSubscriptionById(
  id: string,
  data: Partial<SubscriptionInsert>,
  tx?: DbTransaction
) {
  const dbInstance = tx || db
  const [result] = await dbInstance
    .update(subscription)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subscription.id, id))
    .returning()
  return result
}
