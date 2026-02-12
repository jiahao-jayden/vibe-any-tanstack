import { models } from "./models"
import type { AIModelMeta, AIProviderKey, ModelParameters } from "./types"

export function getModelConfig(modelId: string): AIModelMeta | undefined {
  return models.find((m) => m.id === modelId)
}

export function canUseModel(
  modelId: string,
  isProUser: boolean
): { canUse: boolean; reason?: string } {
  const model = getModelConfig(modelId)
  if (!model) {
    return { canUse: false, reason: "model_not_found" }
  }
  if (model.tier === "pro" && !isProUser) {
    return { canUse: false, reason: "pro_subscription_required" }
  }
  return { canUse: true }
}

export function hasVisionSupport(modelId: string): boolean {
  return getModelConfig(modelId)?.capabilities.vision ?? false
}

export function hasReasoningSupport(modelId: string): boolean {
  return getModelConfig(modelId)?.capabilities.reasoning ?? false
}

export function hasPdfSupport(modelId: string): boolean {
  return getModelConfig(modelId)?.capabilities.pdf ?? false
}

export function getMaxOutputTokens(modelId: string): number {
  return getModelConfig(modelId)?.maxOutputTokens ?? 8192
}

export function getModelParameters(modelId: string): ModelParameters {
  return getModelConfig(modelId)?.parameters ?? {}
}

export function getCreditCost(modelId: string): number {
  return getModelConfig(modelId)?.creditCost ?? 1
}

export function getModelsByProvider(provider: AIProviderKey): AIModelMeta[] {
  return models.filter((m) => m.provider === provider)
}

export function getModelsByTier(tier: "free" | "pro"): AIModelMeta[] {
  return models.filter((m) => m.tier === tier)
}

export function getAvailableProviders(): AIProviderKey[] {
  const providers = new Set(models.map((m) => m.provider))
  return [...providers]
}

export function getAllModels(): AIModelMeta[] {
  return models
}
