import { createFileRoute } from "@tanstack/react-router"
import { asc, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { creditPackage, db } from "@/db"
import { Resp } from "@/shared/lib/tools/response"
import { adminMiddleware } from "@/shared/middleware/auth.middleware"

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  creditAmount: z.number().int().positive(),
  expireDays: z.number().int().positive().optional(),
  priceAmount: z.number().int().positive(),
  currency: z.string().default("USD"),
  stripePriceId: z.string().min(1),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

const updateSchema = createSchema.partial().extend({
  id: z.string().uuid(),
})

export const Route = createFileRoute("/api/admin/credit-packages")({
  server: {
    middleware: [adminMiddleware],
    handlers: {
      GET: async () => {
        try {
          const packages = await db
            .select()
            .from(creditPackage)
            .orderBy(asc(creditPackage.sortOrder))

          return Resp.success(packages)
        } catch (error) {
          console.error("Failed to fetch credit packages:", error)
          return Resp.error("Failed to fetch credit packages")
        }
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const data = createSchema.parse(body)

          const [created] = await db
            .insert(creditPackage)
            .values({
              name: data.name,
              description: data.description,
              creditAmount: data.creditAmount,
              expireDays: data.expireDays,
              priceAmount: data.priceAmount,
              currency: data.currency,
              stripePriceId: data.stripePriceId,
              sortOrder: data.sortOrder,
              isActive: data.isActive,
            })
            .returning()

          return Resp.success(created)
        } catch (error) {
          if (error instanceof z.ZodError) {
            return Resp.error("Invalid data", 400, JSON.stringify(error.issues))
          }
          console.error("Failed to create credit package:", error)
          return Resp.error("Failed to create credit package")
        }
      },

      PUT: async ({ request }) => {
        try {
          const body = await request.json()
          const { id, ...data } = updateSchema.parse(body)

          const [updated] = await db
            .update(creditPackage)
            .set(data)
            .where(eq(creditPackage.id, id))
            .returning()

          if (!updated) {
            return Resp.error("Credit package not found", 404)
          }

          return Resp.success(updated)
        } catch (error) {
          if (error instanceof z.ZodError) {
            return Resp.error("Invalid data", 400, JSON.stringify(error.issues))
          }
          console.error("Failed to update credit package:", error)
          return Resp.error("Failed to update credit package")
        }
      },

      DELETE: async ({ request }) => {
        try {
          const { searchParams } = new URL(request.url)
          const id = searchParams.get("id")

          if (!id) {
            return Resp.error("ID is required", 400)
          }

          const [deleted] = await db
            .delete(creditPackage)
            .where(eq(creditPackage.id, id))
            .returning()

          if (!deleted) {
            return Resp.error("Credit package not found", 404)
          }

          return Resp.success({ deleted: true })
        } catch (error) {
          console.error("Failed to delete credit package:", error)
          return Resp.error("Failed to delete credit package")
        }
      },
    },
  },
})
