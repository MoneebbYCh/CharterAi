import * as fs from 'fs'
import * as path from 'path'
import { VectorStore, type ScoredChunk } from './vectorStore'
import { embedQuery, type EmbeddingConfig } from './embeddings'

export interface RetrievedChunk extends ScoredChunk {
  /** Fresh code text read from disk for the chunk's line range. */
  text: string
}

/** Read a 1-based inclusive line range from a workspace file. */
export function readLineRange(
  workspaceRoot: string,
  file: string,
  start: number,
  end: number,
): string {
  try {
    const abs = path.join(workspaceRoot, file)
    const lines = fs.readFileSync(abs, 'utf-8').split('\n')
    return lines.slice(Math.max(0, start - 1), end).join('\n')
  } catch {
    return ''
  }
}

/** Embed the query and return the top-k most similar code chunks, with code text. */
export async function retrieve(
  workspaceRoot: string,
  query: string,
  k: number,
  cfg: EmbeddingConfig,
): Promise<RetrievedChunk[]> {
  const store = new VectorStore(workspaceRoot)
  if (store.chunkCount() === 0) return []
  const qv = await embedQuery(query, cfg)
  if (!qv.length) return []
  const hits = store.search(qv, k)
  return hits
    .map((h) => ({ ...h, text: readLineRange(workspaceRoot, h.file, h.startLine, h.endLine) }))
    .filter((h) => h.text.trim().length > 0)
}

function citation(c: RetrievedChunk): string {
  const sym = c.symbol && c.symbol !== 'block' ? ` ${c.symbol}` : ''
  return `${c.file}:${c.startLine}-${c.endLine}${sym}`
}

/** Render retrieved chunks as a fenced, cited block for prompt injection. */
export function formatChunksForPrompt(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return ''
  const parts = ['RELEVANT CODE (retrieved by semantic search — cite as file:line):']
  for (const c of chunks) {
    parts.push('', `// ${citation(c)}`, '```', c.text, '```')
  }
  return parts.join('\n')
}
