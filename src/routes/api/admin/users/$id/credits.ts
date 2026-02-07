import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { CreditService } from "@/services/credits.service"
import { Resp } from "@/shared/lib/tools/response"
import { CreditsType } from "@/shared/types/credit"

const grantCreditsSchema = z.object({
  amount: z.number().int().positive(),
  description: z.string().optional(),
})

export const Route = createFileRoute("/api/admin/users/$id/credits")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const { id } = params
          const body = await request.json()
          const { amount, description } = grantCreditsSchema.parse(body)

          const creditService = new CreditService()
          await creditService.increaseCredits({
            userId: id,
            credits: amount,
            creditsType: CreditsType.ADD_ADMIN,
            description: description || `Admin granted ${amount} credits`,
          })

          return Resp.success({ granted: amount })
        } catch (error) {
          console.error("Failed to grant credits:", error)
          return Resp.error("Failed to grant credits")
        }
      },
    },
  },
})
