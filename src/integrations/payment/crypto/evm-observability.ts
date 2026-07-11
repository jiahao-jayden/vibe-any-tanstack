import { logger } from "@/shared/lib/tools/logger"
import type { CryptoCurrencyId, EvmDirectCryptoOrderMetadata } from "@/shared/types/crypto"

export interface EvmObservabilityContext {
  orderId: string
  cryptoCurrency?: CryptoCurrencyId
  submittedTxHash?: string
  expectedAmount?: string
  actualAmount?: string
  currentConfirmations?: number
  requiredConfirmations?: number
  confirmationLatencySeconds?: number
}

export interface EvmMetricEvent {
  name:
    | "evm_tx_submitted"
    | "evm_invalid_tx_hash_submitted"
    | "evm_tx_duplicate_conflict"
    | "evm_rpc_primary_failed"
    | "evm_rpc_fallback_used"
    | "evm_verification_started"
    | "evm_confirmation_progressed"
    | "evm_review_required"
    | "evm_verification_success"
  context: EvmObservabilityContext
  meta?: Record<string, unknown>
}

export type EvmMetricEventHook = (event: EvmMetricEvent) => void | Promise<void>

const defaultMetricEventHook: EvmMetricEventHook = () => {}

let metricEventHook: EvmMetricEventHook = defaultMetricEventHook

export function setEvmMetricEventHook(hook?: EvmMetricEventHook) {
  metricEventHook = hook ?? defaultMetricEventHook
}

export function emitEvmMetricEvent(event: EvmMetricEvent) {
  void Promise.resolve(metricEventHook(event)).catch((error) => {
    logger.error("evm_metric_hook_failed", {
      metricEvent: event.name,
      orderId: event.context.orderId,
      message: error instanceof Error ? error.message : "Unknown EVM metric hook error",
    })
  })
}

export function buildEvmObservabilityContext(params: {
  orderId: string
  metadata?: Pick<
    EvmDirectCryptoOrderMetadata,
    "cryptoCurrency" | "submittedTxHash" | "cryptoAmount" | "actualAmount" | "requiredConfirmations"
  >
  submittedTxHash?: string
  actualAmount?: string
  currentConfirmations?: number
  requiredConfirmations?: number
  confirmationLatencySeconds?: number
}): EvmObservabilityContext {
  const parsedRequiredConfirmations =
    params.requiredConfirmations ??
    (params.metadata?.requiredConfirmations
      ? Number.parseInt(params.metadata.requiredConfirmations, 10)
      : undefined)

  return {
    orderId: params.orderId,
    cryptoCurrency: params.metadata?.cryptoCurrency,
    submittedTxHash: params.submittedTxHash ?? params.metadata?.submittedTxHash,
    expectedAmount: params.metadata?.cryptoAmount,
    actualAmount: params.actualAmount ?? params.metadata?.actualAmount,
    currentConfirmations: params.currentConfirmations,
    requiredConfirmations: Number.isFinite(parsedRequiredConfirmations)
      ? parsedRequiredConfirmations
      : undefined,
    confirmationLatencySeconds: params.confirmationLatencySeconds,
  }
}

export function logEvmEvent(
  level: "info" | "warn" | "error",
  event: string,
  context: EvmObservabilityContext,
  meta?: Record<string, unknown>
) {
  logger[level](event, {
    orderId: context.orderId,
    cryptoCurrency: context.cryptoCurrency ?? null,
    submittedTxHash: context.submittedTxHash ?? null,
    expectedAmount: context.expectedAmount ?? null,
    actualAmount: context.actualAmount ?? null,
    currentConfirmations: context.currentConfirmations ?? null,
    requiredConfirmations: context.requiredConfirmations ?? null,
    confirmationLatencySeconds: context.confirmationLatencySeconds ?? null,
    ...meta,
  })
}
