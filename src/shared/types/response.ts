import type errorContent from "@/config/locale/error.content"

export type ErrorCode = keyof typeof errorContent.content | undefined

export type ApiErrorDetails = {
  orderId?: string
} & Record<string, string | number | boolean | null | undefined>

export type ApiResponse<T = unknown> = {
  code: number
  message: string
  error?: ErrorCode
  data?: T
  details?: ApiErrorDetails
}
