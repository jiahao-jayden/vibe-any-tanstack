import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import postgres from "postgres"

export * from "./auth.schema"
export * from "./config.schema"
export * from "./credit.schema"
export * from "./order.schema"
export * from "./payment.schema"
export * from "./rbac.schema"
export * from "./subscription.schema"
export * from "./waitlist.schema"

import * as authSchema from "./auth.schema"
import * as configSchema from "./config.schema"
import * as creditSchema from "./credit.schema"
import * as orderSchema from "./order.schema"
import * as paymentSchema from "./payment.schema"
import * as rbacSchema from "./rbac.schema"
import * as subscriptionSchema from "./subscription.schema"
import * as waitlistSchema from "./waitlist.schema"

const schema = {
  ...authSchema,
  ...configSchema,
  ...creditSchema,
  ...orderSchema,
  ...subscriptionSchema,
  ...paymentSchema,
  ...rbacSchema,
  ...waitlistSchema,
}

export type DbSchema = typeof schema
export type Database = PostgresJsDatabase<DbSchema>
export type DbTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0]

let _db: Database | null = null
let _client: postgres.Sql | null = null

export const isDatabaseEnabled = !!process.env.DATABASE_URL

export function getDb(): Database | null {
  if (!isDatabaseEnabled) {
    return null
  }
  if (!_db) {
    _client = postgres(process.env.DATABASE_URL!, { prepare: false })
    _db = drizzle(_client, { schema })
  }
  return _db
}

export function requireDb(): Database {
  const database = getDb()
  if (!database) {
    throw new Error("Database is not configured. Please set DATABASE_URL environment variable.")
  }
  return database
}

export async function closeDb(): Promise<void> {
  if (_client) {
    await _client.end()
    _client = null
    _db = null
  }
}

export const db = new Proxy({} as Database, {
  get(_, prop) {
    return requireDb()[prop as keyof Database]
  },
})
