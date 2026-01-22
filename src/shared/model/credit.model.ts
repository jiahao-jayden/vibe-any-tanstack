import { and, asc, count, desc, eq, gte, isNull, or } from "drizzle-orm"
import { type DbTransaction, db } from "@/db"
import { credits } from "@/db/credit.schema"

export async function insertCredits(data: typeof credits.$inferInsert, tx?: DbTransaction) {
  const dbInstance = tx || db
  const [result] = await dbInstance.insert(credits).values(data).returning()
  return result
}

export async function getUserValidCredits(userId: string) {
  const data = await db
    .select()
    .from(credits)
    .where(
      and(
        eq(credits.userId, userId),
        // Include credits that are either permanent (expiresAt is null) or not yet expired
        or(isNull(credits.expiresAt), gte(credits.expiresAt, new Date()))
      )
    )
    // Order by expiry date: credits with expiry date first (ascending), then permanent credits (null) last
    // This ensures we use expiring credits before permanent ones (FIFO for expiring, LIFO for permanent)
    .orderBy(asc(credits.expiresAt))

  return data
}

export async function getCreditsByUserId(
  userId: string,
  page: number = 1,
  limit: number = 10,
  days?: number
) {
  const baseCondition = eq(credits.userId, userId)

  // If days parameter is provided, filter by date range
  if (days !== undefined && days > 0) {
    const dateAgo = new Date()
    dateAgo.setDate(dateAgo.getDate() - days)

    const condition = and(baseCondition, gte(credits.createdAt, dateAgo))

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(credits)
        .where(condition)
        .orderBy(desc(credits.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ count: count() }).from(credits).where(condition),
    ])

    return {
      data,
      total: totalResult[0].count,
      page,
      limit,
    }
  }

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(credits)
      .where(baseCondition)
      .orderBy(desc(credits.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(credits).where(baseCondition),
  ])

  return {
    data,
    total: totalResult[0].count,
    page,
    limit,
  }
}

export async function getCreditsByTransactionId(transactionId: string) {
  const data = await db.select().from(credits).where(eq(credits.transactionId, transactionId))
  return data
}
