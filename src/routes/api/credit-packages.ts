import { createFileRoute } from "@tanstack/react-router"
import { asc, eq } from "drizzle-orm"
import { creditPackage, db } from "@/db"
import { Resp } from "@/shared/lib/tools/response"

export const Route = createFileRoute("/api/credit-packages")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const packages = await db
            .select()
            .from(creditPackage)
            .where(eq(creditPackage.isActive, true))
            .orderBy(asc(creditPackage.sortOrder))

          return Resp.success(packages)
        } catch (error) {
          console.error("Failed to fetch credit packages:", error)
          return Resp.error("Failed to fetch credit packages")
        }
      },
    },
  },
})
