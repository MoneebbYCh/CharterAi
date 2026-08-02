import OpenAI from 'openai'
import { EMBEDDING_PROVIDERS, type EmbeddingProviderInfo } from './llmClient'

export interface EmbeddingConfig {
  provider: string
  model: string
  /** Optional explicit key; otherwise resolved from the provider env var. */
  apiKey?: string
}

const BATCH_SIZE = 64
const MAX_RETRIES = 2

function providerInfo(provider: string): EmbeddingProviderInfo {
  return EMBEDDING_PROVIDERS[provider] ?? EMBEDDING_PROVIDERS.ollama
}

function resolveKey(cfg: EmbeddingConfig): string {
  if (cfg.apiKey) return cfg.apiKey
  const info = providerInfo(cfg.provider)
  if (info.env && process.env[info.env]) return process.env[info.env] as string
  // Ollama ignores the key but the OpenAI SDK requires a non-empty string.
  return 'ollama'
}

function makeClient(cfg: EmbeddingConfig): OpenAI {
  const info = providerInfo(cfg.provider)
  return new OpenAI({ apiKey: resolveKey(cfg), baseURL: info.baseUrl, timeout: 60_000 })
}

/** In-place L2 normalization so cosine similarity reduces to a dot product. */
function normalize(vec: number[]): number[] {
  let sum = 0
  for (const v of vec) sum += v * v
  const norm = Math.sqrt(sum)
  if (!norm || !Number.isFinite(norm)) return vec
  for (let i = 0; i < vec.length; i++) vec[i] = vec[i] / norm
  return vec
}

async function embedBatch(client: OpenAI, model: string, inputs: string[]): Promise<number[][]> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await client.embeddings.create({ model, input: inputs })
      return res.data
        .sort((a, b) => a.index - b.index)
        .map((d) => normalize(d.embedding as number[]))
    } catch (err) {
      lastErr = err
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

/** Embed many texts (batched + normalized). Order matches the input. */
export async function embedTexts(texts: string[], cfg: EmbeddingConfig): Promise<number[][]> {
  if (texts.length === 0) return []
  const client = makeClient(cfg)
  const out: number[][] = []
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE).map((t) => (t.trim() ? t : ' '))
    const vectors = await embedBatch(client, cfg.model, batch)
    out.push(...vectors)
  }
  return out
}

export async function embedQuery(text: string, cfg: EmbeddingConfig): Promise<number[]> {
  const [vec] = await embedTexts([text], cfg)
  return vec ?? []
}

/** Quick reachability probe so callers can degrade gracefully. */
export async function embeddingsAvailable(cfg: EmbeddingConfig): Promise<boolean> {
  try {
    const vec = await embedQuery('ping', cfg)
    return Array.isArray(vec) && vec.length > 0
  } catch {
    return false
  }
}
