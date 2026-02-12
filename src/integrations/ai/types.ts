import type { LanguageModel } from "ai"

export type AIProviderKey =
  | "openai"
  | "anthropic"
  | "google"
  | "xai"
  | "groq"
  | "mistral"
  | "cohere"
  | "deepseek"
  | "huggingface"
  | "novita"
  | "siliconflow"
  | "baseten"

export interface ModelParameters {
  temperature?: number
  topP?: number
  topK?: number
  minP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  maxOutputTokens?: number
}

export interface AIModelMeta {
  id: string
  label: string
  provider: AIProviderKey
  providerModelId: string
  description: string
  capabilities: {
    vision: boolean
    reasoning: boolean
    pdf: boolean
  }
  tier: "free" | "pro"
  maxOutputTokens: number
  parameters?: ModelParameters
  creditCost?: number
  isNew?: boolean
}

export interface AIProviderConfig {
  apiKey: string
  baseUrl?: string
}

export type AIProviderConfigs = Partial<Record<AIProviderKey, AIProviderConfig>>

export interface CustomAIProvider {
  languageModel: (modelId: string) => LanguageModel
}
