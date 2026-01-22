import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"

export * from "./auth.schema"
export * from "./config.schema"
export * from "./credit.schema"
export * from "./subscription.schema"
export * from "./payment.schema"
export * from "./rbac.schema"

import { env } from "@/config/env"
import * as authSchema from "./auth.schema"
import * as configSchema from "./config.schema"
import * as creditSchema from "./credit.schema"
import * as subscriptionSchema from "./subscription.schema"
import * as paymentSchema from "./payment.schema"
import * as rbacSchema from "./rbac.schema"

const schema = {
  ...authSchema,
  ...configSchema,
  ...creditSchema,
  ...subscriptionSchema,
  ...paymentSchema,
  ...rbacSchema,
}

export type DbSchema = typeof schema
export type Database = NodePgDatabase<DbSchema>
export type DbTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0]

let _db: Database | null = null

export function getDb(): Database {
  if (!_db) {
    const url = env.DATABASE_URL || process.env.DATABASE_URL
    if (!url) {
      throw new Error("DATABASE_URL is not set")
    }
    _db = drizzle(url, { schema })
  }
  return _db
}

export const db = new Proxy({} as Database, {
  get(_, prop) {
    return getDb()[prop as keyof Database]
  },
})
