import { and, desc, eq } from "drizzle-orm"
import { type DbTransaction, db } from "@/db"
import { payment } from "@/db/payment.schema"

export type PaymentInsert = typeof payment.$inferInsert
export type PaymentSelect = typeof payment.$inferSelect

export async function findSucceededOneTimePayments(userId: string, tx?: DbTransaction) {
  const dbInstance = tx || db
  return dbInstance
    .select({ priceId: payment.priceId })
    .from(payment)
    .where(
      and(
        eq(payment.userId, userId),
        eq(payment.paymentType, "one_time"),
        eq(payment.status, "succeeded")
      )
    )
}

export async function findPaymentByProviderId(providerPaymentId: string, tx?: DbTransaction) {
  const dbInstance = tx || db
  const [result] = await dbInstance
    .select()
    .from(payment)
    .where(eq(payment.providerPaymentId, providerPaymentId))
    .limit(1)
  return result
}

export async function findPaymentById(id: string, tx?: DbTransaction) {
  const dbInstance = tx || db
  const [result] = await dbInstance.select().from(payment).where(eq(payment.id, id)).limit(1)
  return result
}

export async function findPaymentsByUserId(userId: string, tx?: DbTransaction) {
  const dbInstance = tx || db
  return dbInstance
    .select()
    .from(payment)
    .where(eq(payment.userId, userId))
    .orderBy(desc(payment.createdAt))
}

export async function findPaymentsBySubscriptionId(subscriptionId: string, tx?: DbTransaction) {
  const dbInstance = tx || db
  return dbInstance
    .select()
    .from(payment)
    .where(eq(payment.subscriptionId, subscriptionId))
    .orderBy(desc(payment.createdAt))
}

export async function insertPayment(data: PaymentInsert, tx?: DbTransaction) {
  const dbInstance = tx || db
  const [result] = await dbInstance.insert(payment).values(data).returning()
  return result
}

export async function updatePayment(
  providerPaymentId: string,
  data: Partial<PaymentInsert>,
  tx?: DbTransaction
) {
  const dbInstance = tx || db
  const [result] = await dbInstance
    .update(payment)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(payment.providerPaymentId, providerPaymentId))
    .returning()
  return result
}

export async function updatePaymentById(
  id: string,
  data: Partial<PaymentInsert>,
  tx?: DbTransaction
) {
  const dbInstance = tx || db
  const [result] = await dbInstance
    .update(payment)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(payment.id, id))
    .returning()
  return result
}
