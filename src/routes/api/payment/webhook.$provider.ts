import { createFileRoute } from "@tanstack/react-router"
import { paymentProviderEnum } from "@/db/subscription.schema"
import { logger } from "@/shared/lib/tools/logger"
import { Resp } from "@/shared/lib/tools/response"
import type { PaymentProvider } from "@/shared/types/payment"

const VALID_PROVIDERS = paymentProviderEnum.enumValues

export const Route = createFileRoute("/api/payment/webhook/$provider")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { provider } = params

        if (!VALID_PROVIDERS.includes(provider as PaymentProvider)) {
          return Resp.error(`Invalid provider: ${provider}`, 400)
        }

        return Resp.json(200, "Webhook endpoint is active", {
          status: "ready",
          provider,
        })
      },

      POST: async ({ params, request }: { params: { provider: string }; request: Request }) => {
        const { provider } = params

        if (!VALID_PROVIDERS.includes(provider as PaymentProvider)) {
          logger.error(`Invalid provider: ${provider}`)
          return Resp.error(`Invalid provider: ${provider}`, 400)
        }

        try {
          const paymentModule = await import("@/integrations/payment/index")
          const adapter = await paymentModule.getPaymentAdapter(provider as PaymentProvider)

          const event = await adapter.handleWebhook(request)

          const webhookModule = await import("@/integrations/payment/services/webhook")
          await webhookModule.processWebhookEvent(event)

          logger.info(`Webhook processed: ${provider} - ${event.type}`)
          return Resp.json(200, "Webhook received")
        } catch (error) {
          logger.error(`Webhook error [${provider}]:`, error)
          const message = error instanceof Error ? error.message : "Unknown error"
          return Resp.error(`Webhook Error: ${message}`, 400)
        }
      },
    },
  },
})
