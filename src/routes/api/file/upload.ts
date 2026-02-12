import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { createFileRoute } from "@tanstack/react-router"
import { getStorageProvider } from "@/integrations/storage"
import { logger } from "@/shared/lib/tools/logger"
import { Resp } from "@/shared/lib/tools/response"
import { apiAuthMiddleware } from "@/shared/middleware/auth.middleware"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const Route = createFileRoute("/api/file/upload")({
  server: {
    middleware: [apiAuthMiddleware],
    handlers: {
      POST: async ({ request }) => {
        try {
          const formData = await request.formData()
          const file = formData.get("file") as File | null

          if (!file) {
            return Resp.error("No file provided", 400)
          }

          if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return Resp.error(`File type not allowed: ${file.type}`, 400)
          }

          if (file.size > MAX_FILE_SIZE) {
            return Resp.error(`File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`, 400)
          }

          const buffer = Buffer.from(await file.arrayBuffer())
          const storage = await getStorageProvider()

          const hash = createHash("md5").update(buffer).digest("hex")
          const ext = storage.getExtensionFromMimeType(file.type)
          const folder = (formData.get("folder") as string) || "uploads"
          const key = `${folder}/${hash}.${ext}`

          const exists = await storage.exists(key)
          if (exists) {
            return Resp.success({
              url: storage.getPublicUrl(key),
              key,
              deduped: true,
            })
          }

          const result = await storage.uploadBuffer(buffer, `${hash}.${ext}`, {
            folder,
            filename: `${hash}.${ext}`,
            contentType: file.type,
            isPublic: formData.get("isPublic") !== "false",
          })

          if (!result.success) {
            return Resp.error(result.error || "Upload failed", 500)
          }

          return Resp.success({
            url: result.url,
            key: result.key,
            deduped: false,
          })
        } catch (error) {
          logger.error("File upload error:", error)
          return Resp.error(error instanceof Error ? error.message : "Unknown error", 500)
        }
      },
    },
  },
})
