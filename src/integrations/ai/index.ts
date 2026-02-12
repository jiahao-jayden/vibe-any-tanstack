import { getAllConfigs } from "@/shared/model/config.model"
import { createAIProvider } from "./providers"
import type { AIProviderConfigs } from "./types"

export { models } from "./models"
export { createAIProvider } from "./providers"
export * from "./types"
export * from "./utils"

function extractProviderConfigs(configs: Record<string, unknown>): AIProviderConfigs {
  return {
    openai: configs.ai_openai_api_key
      ? {
          apiKey: configs.ai_openai_api_key as string,
          baseUrl: (configs.ai_openai_base_url as string) || undefined,
        }
      : undefined,
    anthropic: configs.ai_anthropic_api_key
      ? { apiKey: configs.ai_anthropic_api_key as string }
      : undefined,
    google: configs.ai_google_api_key ? { apiKey: configs.ai_google_api_key as string } : undefined,
    xai: configs.ai_xai_api_key ? { apiKey: configs.ai_xai_api_key as string } : undefined,
    groq: configs.ai_groq_api_key ? { apiKey: configs.ai_groq_api_key as string } : undefined,
    mistral: configs.ai_mistral_api_key
      ? { apiKey: configs.ai_mistral_api_key as string }
      : undefined,
    cohere: configs.ai_cohere_api_key ? { apiKey: configs.ai_cohere_api_key as string } : undefined,
    deepseek: configs.ai_deepseek_api_key
      ? {
          apiKey: configs.ai_deepseek_api_key as string,
          baseUrl: (configs.ai_deepseek_base_url as string) || undefined,
        }
      : undefined,
    huggingface: configs.ai_huggingface_api_key
      ? { apiKey: configs.ai_huggingface_api_key as string }
      : undefined,
    novita: configs.ai_novita_api_key ? { apiKey: configs.ai_novita_api_key as string } : undefined,
    siliconflow: configs.ai_siliconflow_api_key
      ? { apiKey: configs.ai_siliconflow_api_key as string }
      : undefined,
    baseten: configs.ai_baseten_api_key
      ? { apiKey: configs.ai_baseten_api_key as string }
      : undefined,
  }
}

export async function getAIProvider() {
  const configs = await getAllConfigs()
  const providerConfigs = extractProviderConfigs(configs)
  return createAIProvider(providerConfigs)
}
