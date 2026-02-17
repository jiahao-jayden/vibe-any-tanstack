import type { ConfigValues } from "@/config/dynamic-config"
import { getAllConfigs } from "@/shared/model/config.model"
import { createAIProvider } from "./providers"
import type { AIProviderConfigs } from "./types"

export { models } from "./models"
export { createAIProvider } from "./providers"
export * from "./types"
export * from "./utils"

function extractProviderConfigs(configs: ConfigValues): AIProviderConfigs {
  return {
    openai: configs.ai_openai_api_key
      ? {
          apiKey: configs.ai_openai_api_key,
          baseUrl: configs.ai_openai_base_url || undefined,
        }
      : undefined,
    anthropic: configs.ai_anthropic_api_key ? { apiKey: configs.ai_anthropic_api_key } : undefined,
    google: configs.ai_google_api_key ? { apiKey: configs.ai_google_api_key } : undefined,
    xai: configs.ai_xai_api_key ? { apiKey: configs.ai_xai_api_key } : undefined,
    groq: configs.ai_groq_api_key ? { apiKey: configs.ai_groq_api_key } : undefined,
    mistral: configs.ai_mistral_api_key ? { apiKey: configs.ai_mistral_api_key } : undefined,
    cohere: configs.ai_cohere_api_key ? { apiKey: configs.ai_cohere_api_key } : undefined,
    deepseek: configs.ai_deepseek_api_key
      ? {
          apiKey: configs.ai_deepseek_api_key,
          baseUrl: configs.ai_deepseek_base_url || undefined,
        }
      : undefined,
    huggingface: configs.ai_huggingface_api_key
      ? { apiKey: configs.ai_huggingface_api_key }
      : undefined,
    novita: configs.ai_novita_api_key ? { apiKey: configs.ai_novita_api_key } : undefined,
    siliconflow: configs.ai_siliconflow_api_key
      ? { apiKey: configs.ai_siliconflow_api_key }
      : undefined,
    baseten: configs.ai_baseten_api_key ? { apiKey: configs.ai_baseten_api_key } : undefined,
    volcengine: configs.ai_volcengine_api_key
      ? { apiKey: configs.ai_volcengine_api_key }
      : undefined,
  }
}

export async function getAIProvider() {
  const configs = await getAllConfigs()
  const providerConfigs = extractProviderConfigs(configs)
  return await createAIProvider(providerConfigs)
}
