import type errorContent from "@/config/locale/error.content"

export type ErrorCode = keyof typeof errorContent.content | undefined

export type ApiResponse<T = unknown> = {
  code: number
  message: string
  error?: ErrorCode
  data?: T
}
