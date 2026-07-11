import { logger } from "@/shared/lib/tools/logger"
import type { CryptoCurrencyId } from "@/shared/types/crypto"
import { CryptoPaymentError } from "./errors"

export interface EvmTxSubmissionAntiAbuseContext {
  orderId: string
  userId: string
  cryptoCurrency: CryptoCurrencyId
  txHash: string
  clientIp?: string
  userAgent?: string
}

export type EvmTxSubmissionAntiAbuseResult =
  | {
      allowed: true
    }
  | {
      allowed: false
      reason: string
      retryAfterSeconds?: number
      context?: Record<string, unknown>
    }

export type EvmTxSubmissionAntiAbuseHook = (
  context: EvmTxSubmissionAntiAbuseContext
) => Promise<EvmTxSubmissionAntiAbuseResult> | EvmTxSubmissionAntiAbuseResult

const defaultAntiAbuseHook: EvmTxSubmissionAntiAbuseHook = async () => ({ allowed: true })

let antiAbuseHook: EvmTxSubmissionAntiAbuseHook = defaultAntiAbuseHook

export function setEvmTxSubmissionAntiAbuseHook(hook?: EvmTxSubmissionAntiAbuseHook) {
  antiAbuseHook = hook ?? defaultAntiAbuseHook
}

export async function assertEvmTxSubmissionAllowed(context: EvmTxSubmissionAntiAbuseContext) {
  const result = await antiAbuseHook(context)

  if (result.allowed) {
    return
  }

  logger.warn("evm_tx_submission_blocked", {
    orderId: context.orderId,
    userId: context.userId,
    cryptoCurrency: context.cryptoCurrency,
    submittedTxHash: context.txHash,
    clientIp: context.clientIp,
    antiAbuseReason: result.reason,
    retryAfterSeconds: result.retryAfterSeconds,
    ...result.context,
  })

  throw new CryptoPaymentError({
    code: "payment_rate_limited",
    statusCode: 429,
    orderId: context.orderId,
    userMessage: "Too many transaction-hash submissions. Please wait a moment and try again.",
    message: `EVM tx submission blocked by anti-abuse hook: ${result.reason}`,
    context: {
      userId: context.userId,
      cryptoCurrency: context.cryptoCurrency,
      submittedTxHash: context.txHash,
      clientIp: context.clientIp,
      antiAbuseReason: result.reason,
      retryAfterSeconds: result.retryAfterSeconds,
      ...result.context,
    },
  })
}
