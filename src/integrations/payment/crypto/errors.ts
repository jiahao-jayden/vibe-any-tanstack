import { logger } from "@/shared/lib/tools/logger"
import { Resp } from "@/shared/lib/tools/response"
import type { CryptoPaymentErrorCode } from "@/shared/types/crypto"

type CryptoErrorContext = Record<string, unknown>

interface CryptoPaymentErrorParams {
  code: CryptoPaymentErrorCode
  userMessage: string
  statusCode?: number
  orderId?: string
  message?: string
  context?: CryptoErrorContext
}

interface CryptoErrorFallback {
  code: CryptoPaymentErrorCode
  userMessage: string
  statusCode?: number
  orderId?: string
  context?: CryptoErrorContext
}

export class CryptoPaymentError extends Error {
  readonly code: CryptoPaymentErrorCode
  readonly userMessage: string
  readonly statusCode: number
  readonly orderId?: string
  readonly context?: CryptoErrorContext

  constructor(params: CryptoPaymentErrorParams) {
    super(params.message ?? params.userMessage)
    this.name = "CryptoPaymentError"
    this.code = params.code
    this.userMessage = params.userMessage
    this.statusCode = params.statusCode ?? 400
    this.orderId = params.orderId
    this.context = params.context
  }
}

export function isCryptoPaymentError(error: unknown): error is CryptoPaymentError {
  return error instanceof CryptoPaymentError
}

export function createCryptoErrorResponse(error: unknown, fallback: CryptoErrorFallback): Response {
  if (isCryptoPaymentError(error)) {
    return Resp.error(error.userMessage, error.statusCode, error.code, {
      orderId: error.orderId,
    })
  }

  return Resp.error(fallback.userMessage, fallback.statusCode ?? 500, fallback.code, {
    orderId: fallback.orderId,
  })
}

export function logCryptoError(event: string, error: unknown, extraContext?: CryptoErrorContext) {
  if (isCryptoPaymentError(error)) {
    logger.error(event, {
      ...extraContext,
      ...error.context,
      orderId: error.orderId,
      errorCode: error.code,
      userMessage: error.userMessage,
      debugMessage: error.message,
    })
    return
  }

  logger.error(event, {
    ...extraContext,
    debugMessage: error instanceof Error ? error.message : "Unknown crypto payment error",
  })
}
