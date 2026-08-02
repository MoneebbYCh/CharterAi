import OpenAI from 'openai'

export interface ProviderInfo {
  baseUrl: string
  defaultModel: string
  env: string
}

export const PROVIDERS: Record<string, ProviderInfo> = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-v4-flash',
    env: 'DEEPSEEK_API_KEY',
  },
  kimi: {
    baseUrl: 'https://api.moonshot.ai/v1',
    defaultModel: 'kimi-k2.6',
    env: 'MOONSHOT_API_KEY',
  },
  local: {
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    env: '',
  },
}

export interface EmbeddingProviderInfo {
  baseUrl: string
  defaultModel: string
  /** Env var holding the API key, if the provider needs one. */
  env: string
}

/** Providers used for code embeddings (separate from the chat model). */
export const EMBEDDING_PROVIDERS: Record<string, EmbeddingProviderInfo> = {
  ollama: {
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'nomic-embed-text',
    env: '',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'text-embedding-3-small',
    env: 'OPENAI_API_KEY',
  },
}

// Checked after the provider-specific variable above.
const GENERIC_ENV_VARS = ['REQ_GATH_SYS_API_KEY', 'LLM_API_KEY'] as const

export interface LlmConfig {
  provider: string
  model?: string | null
  apiKey: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function getProvider(provider: string): ProviderInfo {
  return PROVIDERS[provider] ?? PROVIDERS.deepseek
}

export function resolveApiKey(config: LlmConfig): string {
  if (config.apiKey) return config.apiKey

  const provider = getProvider(config.provider)
  if (provider.env) {
    const value = process.env[provider.env]
    if (value) return value
  }

  for (const name of GENERIC_ENV_VARS) {
    const value = process.env[name]
    if (value) return value
  }

  return ''
}

export function resolveModel(config: LlmConfig): string {
  if (config.model) return config.model
  return getProvider(config.provider).defaultModel
}

export function resolveBaseUrl(provider: string): string {
  return getProvider(provider).baseUrl
}

export async function callLlm(
  messages: ChatMessage[],
  config: LlmConfig,
  options: { jsonMode?: boolean; timeout?: number } = {},
): Promise<string> {
  const { jsonMode = true, timeout = 60_000 } = options
  const apiKey = resolveApiKey(config)

  if (!apiKey && config.provider !== 'local') {
    const provider = getProvider(config.provider)
    const envName = provider.env || 'DEEPSEEK_API_KEY'
    throw new Error(
      `No API key configured. Set the ${envName} environment variable ` +
        "or run 'Charter Ai: Configure API Key' in VS Code.",
    )
  }

  const client = new OpenAI({
    apiKey: apiKey || 'ollama',
    baseURL: resolveBaseUrl(config.provider),
    timeout,
  })

  const model = resolveModel(config)
  const body: Record<string, unknown> = {
    model,
    messages,
  }

  if (jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  // Kimi echoes reasoning tokens unless thinking is explicitly disabled.
  if (config.provider === 'kimi') {
    body.thinking = { type: 'disabled' }
  }

  const response = await client.chat.completions.create(
    body as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
  )
  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('The model returned an empty response.')
  }
  return content
}
