import { customProvider, extractReasoningMiddleware, wrapLanguageModel } from "ai"
import type { AIProviderConfigs } from "./types"

const reasoningMiddleware = extractReasoningMiddleware({ tagName: "think" })
const reasoningMiddlewareStartWith = extractReasoningMiddleware({
  tagName: "think",
  startWithReasoning: true,
})

async function createProviderInstances(configs: AIProviderConfigs) {
  const openai = configs.openai?.apiKey
    ? (await import("@ai-sdk/openai")).createOpenAI({
        apiKey: configs.openai.apiKey,
        ...(configs.openai.baseUrl && { baseURL: configs.openai.baseUrl }),
      })
    : null

  const anthropic = configs.anthropic?.apiKey
    ? (await import("@ai-sdk/anthropic")).createAnthropic({ apiKey: configs.anthropic.apiKey })
    : null

  const google = configs.google?.apiKey
    ? (await import("@ai-sdk/google")).createGoogleGenerativeAI({ apiKey: configs.google.apiKey })
    : null

  const xai = configs.xai?.apiKey
    ? (await import("@ai-sdk/xai")).createXai({ apiKey: configs.xai.apiKey })
    : null

  const groq = configs.groq?.apiKey
    ? (await import("@ai-sdk/groq")).createGroq({ apiKey: configs.groq.apiKey })
    : null

  const mistral = configs.mistral?.apiKey
    ? (await import("@ai-sdk/mistral")).createMistral({ apiKey: configs.mistral.apiKey })
    : null

  const cohere = configs.cohere?.apiKey
    ? (await import("@ai-sdk/cohere")).createCohere({ apiKey: configs.cohere.apiKey })
    : null

  const needsOpenAICompatible =
    configs.deepseek?.apiKey ||
    configs.huggingface?.apiKey ||
    configs.novita?.apiKey ||
    configs.siliconflow?.apiKey ||
    configs.baseten?.apiKey ||
    configs.volcengine?.apiKey

  const createOpenAICompatible = needsOpenAICompatible
    ? (await import("@ai-sdk/openai-compatible")).createOpenAICompatible
    : null

  const deepseek =
    configs.deepseek?.apiKey && createOpenAICompatible
      ? createOpenAICompatible({
          name: "deepseek",
          baseURL: configs.deepseek.baseUrl || "https://api.deepseek.com/v1",
          apiKey: configs.deepseek.apiKey,
        })
      : null

  const huggingface =
    configs.huggingface?.apiKey && createOpenAICompatible
      ? createOpenAICompatible({
          name: "huggingface",
          baseURL: "https://router.huggingface.co/v1",
          apiKey: configs.huggingface.apiKey,
        })
      : null

  const novita =
    configs.novita?.apiKey && createOpenAICompatible
      ? createOpenAICompatible({
          name: "novita",
          baseURL: "https://api.novita.ai/openai",
          apiKey: configs.novita.apiKey,
        })
      : null

  const siliconflow =
    configs.siliconflow?.apiKey && createOpenAICompatible
      ? createOpenAICompatible({
          name: "siliconflow",
          baseURL: "https://api.siliconflow.cn/v1",
          apiKey: configs.siliconflow.apiKey,
        })
      : null

  const baseten =
    configs.baseten?.apiKey && createOpenAICompatible
      ? createOpenAICompatible({
          name: "baseten",
          baseURL: "https://inference.baseten.co/v1",
          apiKey: configs.baseten.apiKey,
        })
      : null

  const volcengine =
    configs.volcengine?.apiKey && createOpenAICompatible
      ? createOpenAICompatible({
          name: "volcengine",
          baseURL: "https://ark.cn-beijing.volces.com/api/v3",
          apiKey: configs.volcengine.apiKey,
        })
      : null

  return {
    openai,
    anthropic,
    google,
    xai,
    groq,
    mistral,
    cohere,
    deepseek,
    huggingface,
    novita,
    siliconflow,
    baseten,
    volcengine,
  }
}

export async function createAIProvider(configs: AIProviderConfigs) {
  const p = await createProviderInstances(configs)

  return customProvider({
    languageModels: {
      // ==================== OpenAI ====================
      ...(p.openai && {
        "openai/gpt-4o": p.openai("gpt-4o"),
        "openai/gpt-4o-mini": p.openai("gpt-4o-mini"),
        "openai/gpt-4.1": p.openai("gpt-4.1"),
        "openai/gpt-4.1-mini": p.openai("gpt-4.1-mini"),
        "openai/gpt-4.1-nano": p.openai("gpt-4.1-nano"),
        "openai/o3": p.openai("o3"),
        "openai/o3-mini": p.openai("o3-mini"),
        "openai/o4-mini": p.openai("o4-mini"),
        "openai/gpt-5": p.openai("gpt-5"),
        "openai/gpt-5-mini": p.openai("gpt-5-mini"),
        "openai/gpt-5-nano": p.openai("gpt-5-nano"),
        "openai/gpt-5-medium": p.openai("gpt-5"),
        "openai/gpt-5.1": p.openai("gpt-5.1"),
        "openai/gpt-5.1-thinking": p.openai("gpt-5.1"),
        "openai/gpt-5.2": p.openai("gpt-5.2"),
        "openai/gpt-5.2-thinking": p.openai("gpt-5.2"),
        "openai/gpt-5.1-codex": p.openai("gpt-5.1-codex"),
        "openai/gpt-5.1-codex-mini": p.openai("gpt-5.1-codex-mini"),
        "openai/gpt-5.1-codex-max": p.openai("gpt-5.1-codex-max"),
        "openai/gpt-5-codex": p.openai("gpt-5-codex"),
      }),

      // OpenAI OSS (via Groq / Baseten)
      ...(p.groq && {
        "openai/gpt-oss-20b": wrapLanguageModel({
          model: p.groq("openai/gpt-oss-20b"),
          middleware: [reasoningMiddleware],
        }),
      }),
      ...(p.baseten && {
        "openai/gpt-oss-120b": wrapLanguageModel({
          model: p.baseten.chatModel("openai/gpt-oss-120b"),
          middleware: [reasoningMiddleware],
        }),
      }),

      // ==================== Anthropic ====================
      ...(p.anthropic && {
        "anthropic/claude-haiku-4-5": p.anthropic("claude-haiku-4-5"),
        "anthropic/claude-sonnet-4-5": p.anthropic("claude-sonnet-4-5"),
        "anthropic/claude-sonnet-4-5-thinking": p.anthropic("claude-sonnet-4-5"),
        "anthropic/claude-opus-4-5": p.anthropic("claude-opus-4-5"),
        "anthropic/claude-opus-4-5-thinking": p.anthropic("claude-opus-4-5"),
      }),

      // ==================== Google ====================
      ...(p.google && {
        "google/gemini-2.0-flash-lite": p.google("gemini-2.0-flash-lite"),
        "google/gemini-2.0-flash": p.google("gemini-2.0-flash"),
        "google/gemini-2.5-flash-lite": p.google("gemini-flash-lite-latest"),
        "google/gemini-2.5-flash": p.google("gemini-flash-latest"),
        "google/gemini-2.5-flash-thinking": p.google("gemini-flash-latest"),
        "google/gemini-2.5-pro": p.google("gemini-2.5-pro"),
        "google/gemini-2.5-pro-thinking": p.google("gemini-2.5-pro"),
        "google/gemini-3-flash": p.google("gemini-3-flash-preview"),
        "google/gemini-3-flash-thinking": p.google("gemini-3-flash-preview"),
        "google/gemini-3-pro": p.google("gemini-3-pro-preview"),
      }),

      // ==================== xAI ====================
      ...(p.xai && {
        "xai/grok-3-mini": p.xai("grok-3-mini"),
        "xai/grok-3": p.xai("grok-3"),
        "xai/grok-3-fast": p.xai("grok-3-fast"),
        "xai/grok-4": p.xai("grok-4"),
        "xai/grok-4-fast": p.xai("grok-4-fast-non-reasoning"),
        "xai/grok-4-fast-thinking": p.xai("grok-4-fast"),
        "xai/grok-4.1-fast": p.xai("grok-4-1-fast-non-reasoning"),
        "xai/grok-4.1-fast-thinking": p.xai("grok-4-1-fast"),
        "xai/grok-code": p.xai("grok-code-fast-1"),
      }),

      // ==================== Groq ====================
      ...(p.groq && {
        "groq/llama-3.3-70b": p.groq("llama-3.3-70b-versatile"),
        "groq/llama-3.1-8b": p.groq("llama-3.1-8b-instant"),
        "groq/qwen-qwq-32b": wrapLanguageModel({
          model: p.groq("qwen-qwq-32b"),
          middleware: [reasoningMiddleware],
        }),
        "groq/qwen3-32b": wrapLanguageModel({
          model: p.groq("qwen/qwen3-32b"),
          middleware: [reasoningMiddleware],
        }),
        "groq/kimi-k2": p.groq("moonshotai/kimi-k2-instruct-0905"),
      }),

      // ==================== Mistral ====================
      ...(p.mistral && {
        "mistral/ministral-3b": p.mistral("ministral-3b-2512"),
        "mistral/ministral-8b": p.mistral("ministral-8b-2512"),
        "mistral/ministral-14b": p.mistral("ministral-14b-2512"),
        "mistral/mistral-small": p.mistral("mistral-small-latest"),
        "mistral/mistral-medium": p.mistral("mistral-medium-2508"),
        "mistral/mistral-large": p.mistral("mistral-large-2512"),
        "mistral/magistral-small": p.mistral("magistral-small-2509"),
        "mistral/magistral-medium": p.mistral("magistral-medium-2509"),
        "mistral/codestral": p.mistral("codestral-latest"),
        "mistral/devstral": p.mistral("devstral-2512"),
        "mistral/devstral-small": p.mistral("labs-devstral-small-2512"),
      }),

      // ==================== Cohere ====================
      ...(p.cohere && {
        "cohere/command-a": p.cohere("command-a-03-2025"),
        "cohere/command-a-thinking": p.cohere("command-a-reasoning-08-2025"),
        "cohere/command-r-plus": p.cohere("command-r-plus"),
      }),

      // ==================== DeepSeek (direct) ====================
      ...(p.deepseek && {
        "deepseek/deepseek-chat": p.deepseek.chatModel("deepseek-chat"),
        "deepseek/deepseek-reasoner": wrapLanguageModel({
          model: p.deepseek.chatModel("deepseek-reasoner"),
          middleware: [reasoningMiddleware],
        }),
      }),

      // DeepSeek via Baseten
      ...(p.baseten && {
        "deepseek/deepseek-v3": p.baseten.chatModel("deepseek-ai/DeepSeek-V3-0324"),
      }),

      // DeepSeek via Novita
      ...(p.novita && {
        "deepseek/deepseek-v3.1-terminus": p.novita.chatModel("deepseek/deepseek-v3.1-terminus"),
        "deepseek/deepseek-v3.2": p.novita.chatModel("deepseek/deepseek-v3.2"),
        "deepseek/deepseek-v3.2-thinking": wrapLanguageModel({
          model: p.novita.chatModel("deepseek/deepseek-v3.2-thinking"),
          middleware: [reasoningMiddleware],
        }),
        "deepseek/deepseek-v3.2-exp": p.novita.chatModel("deepseek/deepseek-v3.2-exp"),
        "deepseek/deepseek-v3.2-exp-thinking": wrapLanguageModel({
          model: p.novita.chatModel("deepseek/deepseek-v3.2-exp-thinking"),
          middleware: [reasoningMiddleware],
        }),
        "deepseek/deepseek-r1-turbo": wrapLanguageModel({
          model: p.novita.chatModel("deepseek/deepseek-r1-turbo"),
          middleware: [reasoningMiddleware],
        }),
        "deepseek/deepseek-r1-0528": wrapLanguageModel({
          model: p.novita.chatModel("deepseek/deepseek-r1-0528"),
          middleware: [reasoningMiddleware],
        }),
      }),

      // ==================== Qwen (via multiple providers) ====================
      // Qwen via HuggingFace
      ...(p.huggingface && {
        "qwen/qwen3-4b": p.huggingface.chatModel("Qwen/Qwen3-4B-Instruct-2507:nscale"),
        "qwen/qwen3-4b-thinking": wrapLanguageModel({
          model: p.huggingface.chatModel("Qwen/Qwen3-4B-Thinking-2507:nscale"),
          middleware: [reasoningMiddlewareStartWith],
        }),
        "qwen/qwen3-30b": p.huggingface.chatModel("Qwen/Qwen3-30B-A3B-Instruct-2507:nebius"),
        "qwen/qwen3-30b-thinking": wrapLanguageModel({
          model: p.huggingface.chatModel("Qwen/Qwen3-30B-A3B-Thinking-2507:nebius"),
          middleware: [reasoningMiddleware],
        }),
        "qwen/qwen3-next-80b": p.huggingface.chatModel(
          "Qwen/Qwen3-Next-80B-A3B-Instruct:hyperbolic"
        ),
        "qwen/qwen3-next-80b-thinking": wrapLanguageModel({
          model: p.huggingface.chatModel("Qwen/Qwen3-Next-80B-A3B-Thinking:hyperbolic"),
          middleware: [reasoningMiddlewareStartWith],
        }),
        "qwen/qwen3-235b": p.huggingface.chatModel(
          "Qwen/Qwen3-235B-A22B-Instruct-2507:fireworks-ai"
        ),
        "qwen/qwen3-235b-thinking": wrapLanguageModel({
          model: p.huggingface.chatModel("Qwen/Qwen3-235B-A22B-Thinking-2507:fireworks-ai"),
          middleware: [reasoningMiddlewareStartWith],
        }),
      }),

      // Qwen via Novita
      ...(p.novita && {
        "qwen/qwen3-coder-30b": p.novita.chatModel("qwen/qwen3-coder-30b-a3b-instruct"),
        "qwen/qwen3-vl-30b": p.novita.chatModel("qwen/qwen3-vl-30b-a3b-instruct"),
        "qwen/qwen3-vl-30b-thinking": wrapLanguageModel({
          model: p.novita.chatModel("qwen/qwen3-vl-30b-a3b-thinking"),
          middleware: [reasoningMiddleware],
        }),
        "qwen/qwen3-max": p.novita.chatModel("qwen/qwen3-max"),
        "qwen/qwen3-vl-235b": p.novita.chatModel("qwen/qwen3-vl-235b-a22b-instruct"),
        "qwen/qwen3-vl-235b-thinking": wrapLanguageModel({
          model: p.novita.chatModel("qwen/qwen3-vl-235b-a22b-thinking"),
          middleware: [reasoningMiddleware],
        }),
      }),

      // Qwen via Baseten
      ...(p.baseten && {
        "qwen/qwen3-coder-480b": p.baseten.chatModel("Qwen/Qwen3-Coder-480B-A35B-Instruct"),
      }),

      // ==================== GLM / Zhipu (via multiple providers) ====================
      ...(p.novita && {
        "glm/glm-4.5-air": p.novita.chatModel("zai-org/glm-4.5-air"),
        "glm/glm-4.5": wrapLanguageModel({
          model: p.novita.chatModel("zai-org/glm-4.5"),
          middleware: [reasoningMiddleware],
        }),
      }),
      ...(p.huggingface && {
        "glm/glm-4.6": wrapLanguageModel({
          model: p.huggingface.chatModel("zai-org/GLM-4.6:cerebras"),
          middleware: [reasoningMiddleware],
        }),
        "glm/glm-4.6v-flash": wrapLanguageModel({
          model: p.huggingface.chatModel("zai-org/GLM-4.6V-Flash:zai-org"),
          middleware: [reasoningMiddleware],
        }),
        "glm/glm-4.6v": wrapLanguageModel({
          model: p.huggingface.chatModel("zai-org/GLM-4.6V:zai-org"),
          middleware: [reasoningMiddleware],
        }),
      }),
      ...(p.baseten && {
        "glm/glm-4.7": wrapLanguageModel({
          model: p.baseten.chatModel("zai-org/GLM-4.7"),
          middleware: [reasoningMiddleware],
        }),
      }),

      // ==================== MiniMax (via Novita) ====================
      ...(p.novita && {
        "minimax/minimax-m1-80k": wrapLanguageModel({
          model: p.novita.chatModel("minimaxai/minimax-m1-80k"),
          middleware: [reasoningMiddleware],
        }),
        "minimax/minimax-m2": wrapLanguageModel({
          model: p.novita.chatModel("minimaxai/minimax-m2"),
          middleware: [reasoningMiddleware],
        }),
        "minimax/minimax-m2.1": wrapLanguageModel({
          model: p.novita.chatModel("minimaxai/minimax-m2.1"),
          middleware: [reasoningMiddleware],
        }),
        "minimax/minimax-m2.1-lightning": wrapLanguageModel({
          model: p.novita.chatModel("minimaxai/minimax-m2.1-lightning"),
          middleware: [reasoningMiddleware],
        }),
      }),

      // ==================== Kimi / MoonShot (via Baseten) ====================
      ...(p.baseten && {
        "kimi/kimi-k2": p.baseten.chatModel("moonshotai/Kimi-K2-Instruct-0905"),
        "kimi/kimi-k2-thinking": wrapLanguageModel({
          model: p.baseten.chatModel("moonshotai/Kimi-K2-Thinking"),
          middleware: [reasoningMiddleware],
        }),
      }),

      // ==================== Others ====================
      // Novita
      ...(p.novita && {
        "novita/kat-coder": p.novita.chatModel("kat-coder"),
        "novita/mimo-v2-flash": wrapLanguageModel({
          model: p.novita.chatModel("xiaomimimo/mimo-v2-flash"),
          middleware: [reasoningMiddleware],
        }),
      }),

      // SiliconFlow
      ...(p.siliconflow && {
        "siliconflow/deepseek-v3": p.siliconflow.chatModel("deepseek-ai/DeepSeek-V3"),
        "siliconflow/qwen-2.5-72b": p.siliconflow.chatModel("Qwen/Qwen2.5-72B-Instruct"),
      }),

      // Volcengine
      ...(p.volcengine && {
        "volcengine/doubao-seed-2-0-pro-260215": p.volcengine.chatModel(
          "doubao-seed-2-0-pro-260215"
        ),
      }),
    },
    fallbackProvider: customProvider({
      languageModels: {},
    }),
  })
}
