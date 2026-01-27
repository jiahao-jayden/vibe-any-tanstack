import { createFileRoute } from "@tanstack/react-router"
import { configResolver, configSchema } from "@/config/schema"
import { Resp } from "@/shared/lib/tools/response"
import { adminMiddleware } from "@/shared/middleware/auth.middleware"
import { getConfigs, setConfig } from "@/shared/model/config.model"

export const Route = createFileRoute("/api/admin/config")({
  server: {
    middleware: [adminMiddleware],
    handlers: {
      GET: async () => {
        const dbConfigs = await getConfigs()
        const values = configResolver.resolveAllConfigs(dbConfigs)
        const metas = configResolver.getConfigMetas(values)
        return Resp.success(metas)
      },

      PUT: async ({ request }) => {
        const body = await request.json()
        const { key, value } = body as { key: string; value: unknown }

        if (!key || !(key in configSchema)) {
          return Resp.error("Invalid config key", 400)
        }

        if (configResolver.isConfigLocked(key as keyof typeof configSchema)) {
          return Resp.error("Config is locked by environment variable", 400)
        }

        const validation = configResolver.validateConfig(key as keyof typeof configSchema, value)
        if (!validation.success) {
          return Resp.error(validation.error ?? "Validation failed", 400)
        }

        await setConfig(key, value)
        return Resp.success({ updated: true })
      },
    },
  },
})
