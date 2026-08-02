import * as fs from 'fs'
import * as path from 'path'
import { LEGACY_STATE_DIR, STATE_DIR } from '../brand'
import { retrieve } from './retrieval'
import type { EmbeddingConfig } from './embeddings'
import { parseMermaid } from './mermaidValidate'

export interface ToolContext {
  workspaceRoot: string
  embedCfg: EmbeddingConfig
}

const IGNORE_DIRS = new Set([
  'node_modules', 'dist', 'out', '.git', STATE_DIR, LEGACY_STATE_DIR, 'graphify-out', '.vscode',
])
const SUPPORTED =
  /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|rb|php|swift|kt|kts|scala|sh|bash|zsh|ps1|md|mdx|json|yaml|yml|toml|css|scss|html|htm|sql)$/i

const MAX_READ_LINES = 200
const MAX_GREP_MATCHES = 40
const MAX_GREP_FILES = 4000
const MAX_OBS_CHARS = 6000
const MAX_MERMAID_CHARS = 8000

export const TOOL_NAMES = [
  'semantic_search',
  'read_file',
  'grep',
  'list_dir',
  'validate_mermaid',
] as const

/** Human-readable tool catalog for the agent system prompt. */
export const TOOL_CATALOG = `AVAILABLE TOOLS (call one per step):
Codebase tools (user's open workspace folder):
- list_dir { "path": string }  -> explore folders (start with "." or "src")
- grep { "pattern": string, "glob"?: string }  -> regex matches across the codebase
- read_file { "path": string, "start"?: number, "end"?: number }  -> file contents (max ${MAX_READ_LINES} lines)
- semantic_search { "query": string, "k"?: number }  -> ranked code by meaning (may be empty if embeddings are offline; then use grep/list_dir/read_file instead)

Diagram tool (use when the document needs a Mermaid diagram):
- validate_mermaid { "code": string, "title"?: string }  -> parse-check your Mermaid; on success returns a ready diagram block JSON to put in "document". Reason about the codebase (or chat) first, then draft Mermaid yourself and validate here — do NOT invent from a fixed template.`

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

function safeResolve(workspaceRoot: string, rel: string): string | null {
  const root = path.resolve(workspaceRoot)
  const abs = path.resolve(root, rel || '.')
  if (abs !== root && !abs.startsWith(root + path.sep)) return null
  return abs
}

function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '.*')
    .replace(/\?/g, '.')
  return new RegExp(escaped)
}

function walkFiles(workspaceRoot: string, onFile: (abs: string, rel: string) => boolean): void {
  const walk = (dir: string): boolean => {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return true
    }
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!walk(abs)) return false
      } else if (entry.isFile() && SUPPORTED.test(entry.name)) {
        const rel = path.relative(workspaceRoot, abs)
        if (!onFile(abs, rel)) return false
      }
    }
    return true
  }
  walk(workspaceRoot)
}

async function semanticSearch(ctx: ToolContext, args: Record<string, unknown>): Promise<string> {
  const query = String(args.query ?? '').trim()
  if (!query) return 'error: "query" is required'
  const k = clampInt(args.k, 8, 1, 15)
  const hits = await retrieve(ctx.workspaceRoot, query, k, ctx.embedCfg)
  if (hits.length === 0) return 'No results (index empty or embeddings unavailable).'
  return hits
    .map(
      (h) =>
        `- ${h.file}:${h.startLine}-${h.endLine}` +
        `${h.symbol && h.symbol !== 'block' ? ' ' + h.symbol : ''} (score ${h.score.toFixed(3)})`,
    )
    .join('\n')
}

function readFileTool(ctx: ToolContext, args: Record<string, unknown>): string {
  const rel = String(args.path ?? '')
  if (!rel) return 'error: "path" is required'
  const abs = safeResolve(ctx.workspaceRoot, rel)
  if (!abs) return 'error: path is outside the workspace'
  let content: string
  try {
    content = fs.readFileSync(abs, 'utf-8')
  } catch {
    return `error: cannot read ${rel}`
  }
  const lines = content.split('\n')
  const start = clampInt(args.start, 1, 1, Math.max(1, lines.length))
  let end = clampInt(args.end, Math.min(lines.length, start + MAX_READ_LINES - 1), start, lines.length)
  if (end - start + 1 > MAX_READ_LINES) end = start + MAX_READ_LINES - 1
  const numbered = lines.slice(start - 1, end).map((l, i) => `${start + i}\t${l}`).join('\n')
  return `${rel}:${start}-${end}\n${numbered}`
}

function grepTool(ctx: ToolContext, args: Record<string, unknown>): string {
  const pattern = String(args.pattern ?? '')
  if (!pattern) return 'error: "pattern" is required'
  let re: RegExp
  try {
    re = new RegExp(pattern, 'i')
  } catch {
    return 'error: invalid regular expression'
  }
  const globRe = args.glob ? globToRegExp(String(args.glob)) : null
  const matches: string[] = []
  let scanned = 0

  walkFiles(ctx.workspaceRoot, (abs, rel) => {
    if (scanned >= MAX_GREP_FILES) return false
    scanned++
    if (globRe && !globRe.test(rel)) return true
    let text: string
    try {
      text = fs.readFileSync(abs, 'utf-8')
    } catch {
      return true
    }
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        matches.push(`${rel}:${i + 1}: ${lines[i].trim().slice(0, 200)}`)
        if (matches.length >= MAX_GREP_MATCHES) return false
      }
    }
    return true
  })

  if (matches.length === 0) return 'No matches.'
  return matches.join('\n')
}

function listDirTool(ctx: ToolContext, args: Record<string, unknown>): string {
  const rel = String(args.path ?? '.')
  const abs = safeResolve(ctx.workspaceRoot, rel)
  if (!abs) return 'error: path is outside the workspace'
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(abs, { withFileTypes: true })
  } catch {
    return `error: cannot list ${rel}`
  }
  return entries
    .filter((e) => !IGNORE_DIRS.has(e.name))
    .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
    .sort()
    .join('\n')
}

/**
 * Validate LLM-authored Mermaid and return a ready diagram block on success.
 * The model must reason from codebase tools / chat, then call this before finishing.
 */
async function validateMermaidTool(args: Record<string, unknown>): Promise<string> {
  const code = String(args.code ?? '').trim()
  if (!code) return 'error: "code" is required (Mermaid source string)'
  if (code.length > MAX_MERMAID_CHARS) {
    return `error: Mermaid source too long (${code.length} chars; max ${MAX_MERMAID_CHARS}). Simplify to ≤ ~15–20 nodes.`
  }

  const titleRaw = typeof args.title === 'string' ? args.title.trim() : ''
  const title = titleRaw || 'Diagram'
  const result = await parseMermaid(code)
  if (!result.ok) {
    return [
      'INVALID Mermaid — fix the syntax and call validate_mermaid again.',
      `error: ${result.error}`,
      'Tips: start with flowchart TD / graph TD / sequenceDiagram; simple ids (no spaces); labels in [brackets]; escape quotes in JSON.',
    ].join('\n')
  }

  const block = {
    type: 'diagram',
    props: { code, title, source: 'llm' },
  }
  return [
    'VALID Mermaid. Include this exact block (or equivalent props) in your final document array:',
    JSON.stringify(block),
  ].join('\n')
}

/** Execute a tool by name; always returns a bounded string observation. */
export async function runTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  let out: string
  try {
    switch (name) {
      case 'semantic_search':
        out = await semanticSearch(ctx, args)
        break
      case 'read_file':
        out = readFileTool(ctx, args)
        break
      case 'grep':
        out = grepTool(ctx, args)
        break
      case 'list_dir':
        out = listDirTool(ctx, args)
        break
      case 'validate_mermaid':
        out = await validateMermaidTool(args)
        break
      default:
        return `error: unknown tool "${name}"`
    }
  } catch (err) {
    return `error: ${err instanceof Error ? err.message : String(err)}`
  }
  return out.length > MAX_OBS_CHARS ? out.slice(0, MAX_OBS_CHARS) + '\n…(truncated)' : out
}
