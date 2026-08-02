import * as fs from 'fs'
import * as path from 'path'
import { STATE_DIR } from '../brand'

export interface ChunkMeta {
  id: string
  file: string
  startLine: number
  endLine: number
  symbol: string
  kind: string
}

export interface ScoredChunk extends ChunkMeta {
  score: number
}

interface StoredChunk extends ChunkMeta {
  /** base64-encoded Float32Array of the (already normalized) embedding. */
  vec: string
}

interface StoreShape {
  version: number
  model: string
  dim: number
  files: Record<string, string>
  chunks: StoredChunk[]
}

const STORE_VERSION = 1
const STORE_FILE = 'code-embeddings.json'

function encodeVec(vec: number[]): string {
  const f32 = Float32Array.from(vec)
  return Buffer.from(f32.buffer, f32.byteOffset, f32.byteLength).toString('base64')
}

function decodeVec(b64: string): Float32Array {
  const buf = Buffer.from(b64, 'base64')
  return new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4))
}

export class VectorStore {
  private model = ''
  private dim = 0
  private files: Record<string, string> = {}
  private chunks: StoredChunk[] = []
  /** Decoded vectors cached in parallel with `chunks` for fast search. */
  private vectors: Float32Array[] = []
  private loaded = false

  constructor(private workspaceRoot: string) {}

  private storePath(): string {
    return path.join(this.workspaceRoot, STATE_DIR, STORE_FILE)
  }

  load(): void {
    if (this.loaded) return
    this.loaded = true
    try {
      const raw = fs.readFileSync(this.storePath(), 'utf-8')
      const data = JSON.parse(raw) as StoreShape
      if (!data || data.version !== STORE_VERSION) return
      this.model = data.model ?? ''
      this.dim = data.dim ?? 0
      this.files = data.files ?? {}
      this.chunks = Array.isArray(data.chunks) ? data.chunks : []
      this.vectors = this.chunks.map((c) => decodeVec(c.vec))
    } catch {
      /* no/invalid store — start empty */
    }
  }

  /** Reset everything (used when the embedding model changes). */
  resetModel(model: string, dim: number): void {
    this.model = model
    this.dim = dim
    this.files = {}
    this.chunks = []
    this.vectors = []
  }

  getModel(): string {
    return this.model
  }

  chunkCount(): number {
    this.load()
    return this.chunks.length
  }

  knownFiles(): string[] {
    this.load()
    return Object.keys(this.files)
  }

  fileHash(file: string): string | undefined {
    this.load()
    return this.files[file]
  }

  removeFile(file: string): void {
    this.load()
    if (!(file in this.files)) return
    delete this.files[file]
    const keptChunks: StoredChunk[] = []
    const keptVecs: Float32Array[] = []
    for (let i = 0; i < this.chunks.length; i++) {
      if (this.chunks[i].file !== file) {
        keptChunks.push(this.chunks[i])
        keptVecs.push(this.vectors[i])
      }
    }
    this.chunks = keptChunks
    this.vectors = keptVecs
  }

  /** Replace all chunks for a file with a fresh set. */
  upsertFile(
    file: string,
    hash: string,
    entries: Array<{ meta: ChunkMeta; vector: number[] }>,
  ): void {
    this.load()
    this.removeFile(file)
    this.files[file] = hash
    for (const { meta, vector } of entries) {
      if (!this.dim && vector.length) this.dim = vector.length
      this.chunks.push({ ...meta, vec: encodeVec(vector) })
      this.vectors.push(Float32Array.from(vector))
    }
  }

  search(queryVec: number[], k: number, maxPerFile = 2): ScoredChunk[] {
    this.load()
    if (this.chunks.length === 0 || queryVec.length === 0) return []
    const q = Float32Array.from(queryVec)
    const scored: ScoredChunk[] = []
    for (let i = 0; i < this.chunks.length; i++) {
      const v = this.vectors[i]
      if (!v || v.length !== q.length) continue
      let dot = 0
      for (let j = 0; j < q.length; j++) dot += q[j] * v[j]
      const c = this.chunks[i]
      scored.push({ ...c, score: dot })
    }
    scored.sort((a, b) => b.score - a.score)

    const perFile = new Map<string, number>()
    const out: ScoredChunk[] = []
    for (const s of scored) {
      const used = perFile.get(s.file) ?? 0
      if (used >= maxPerFile) continue
      perFile.set(s.file, used + 1)
      out.push(s)
      if (out.length >= k) break
    }
    return out
  }

  save(): void {
    const data: StoreShape = {
      version: STORE_VERSION,
      model: this.model,
      dim: this.dim,
      files: this.files,
      chunks: this.chunks,
    }
    const dir = path.join(this.workspaceRoot, STATE_DIR)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(this.storePath(), JSON.stringify(data), 'utf-8')
  }
}

/** Cheap check for whether a usable embedding index exists on disk. */
export function hasEmbeddingIndex(workspaceRoot: string): boolean {
  const store = new VectorStore(workspaceRoot)
  return store.chunkCount() > 0
}
