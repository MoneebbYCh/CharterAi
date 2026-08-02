import { buildGroundedContext } from './codeContext'
import { getFieldGuide } from './fieldGuides'
import { CANVAS_BLOCK_CATALOG } from './blockCatalog'
import { callLlm, type ChatMessage, type LlmConfig } from './llmClient'
import { runAgentLoop } from './agentLoop'
import type { EmbeddingConfig } from './embeddings'
import {
  extractDiagramCodes,
  normalizeMermaidSource,
  parseMermaid,
} from './mermaidValidate'
import {
  docLabelFor,
  loadConfig,
  loadForm,
  resolveEmbeddingSettings,
  saveForm,
} from '../formStateManager'
import { CodeIndexer } from '../codeIndexer'

const PHASE_LABELS: Record<string, string> = {
  'project-charter': 'Project Charter',
  prd: 'Product Requirements Document (PRD)',
  'system-design': 'System Design',
  dev: 'Development notes',
  qa: 'QA / verification',
  'post-dev': 'Post Dev / handover',
}

function canvasSystemPrompt(phase: string, label?: string): string {
  const resolvedLabel = label || PHASE_LABELS[phase] || phase
  const charterExtra =
    phase === 'project-charter'
      ? `
CHARTER-SPECIFIC RULES:
- Dual framing: formal authorization + soft agreement on scope/timeline/budget.
- Business Case FIRST before objectives; measurable objectives gate (number/date/binary).
- Return anchors: { "businessCaseId", "objectivesId", "shortName" } when drafting.
- Keep ≤ ~1500–2000 words (~5 pages).
`
      : `
PHASE RULES:
- Follow the document guidance for this phase.
- Prefer custom blocks over long prose; keep decision-dense.
- When useful, return "anchors" for stable cross-phase IDs (shortName, requirement ids, etc.).
`

  return `You are drafting the ${resolvedLabel} as a BlockNote canvas document for Charter Ai.
Help the user elicit and write a clear, usable document for this pipeline phase.

HARD CONSTRAINTS:
- Prefer custom blocks over long prose.
- You MUST respond with a single JSON object and nothing else (no markdown fences).
${charterExtra}
Response shape:
{
  "message": "What you changed + 1–3 sharp follow-ups if needed",
  "anchors": { /* optional stable ids */ },
  "document": [ /* full BlockNote block array, or null if Q&A only */ ]
}

${CANVAS_BLOCK_CATALOG}

If the user only asks a question and no document change is needed, set "document": null.
Always return valid JSON with "message"; include "document" (and "anchors" when useful) when drafting/updating.`
}

// Every pipeline document (built-in or custom) is a BlockNote canvas.
function isCanvasPhase(phase: string): boolean {
  return typeof phase === 'string' && phase.trim().length > 0
}

function emptyCanvasDoc() {
  return {
    version: 1 as const,
    kind: 'blocknote' as const,
    blocks: [{ type: 'paragraph', content: '' }],
    anchors: {} as Record<string, string>,
  }
}

function normalizeCanvasDoc(data: unknown): {
  version: 1
  kind: 'blocknote'
  blocks: unknown[]
  anchors: Record<string, string>
} {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const d = data as Record<string, unknown>
    if (d.kind === 'blocknote' && Array.isArray(d.blocks)) {
      const anchors =
        d.anchors && typeof d.anchors === 'object' && !Array.isArray(d.anchors)
          ? (d.anchors as Record<string, string>)
          : {}
      return {
        version: 1,
        kind: 'blocknote',
        blocks: d.blocks.length > 0 ? d.blocks : emptyCanvasDoc().blocks,
        anchors,
      }
    }
  }
  return emptyCanvasDoc()
}

async function loadPhaseDocument(
  workspaceRoot: string,
  phase: string,
  version?: string,
): Promise<unknown | null> {
  if (!isCanvasPhase(phase)) return null
  return loadForm(workspaceRoot, phase, version)
}

export async function buildMessages(
  text: string,
  phase: string,
  workspaceRoot: string,
  embedCfg: EmbeddingConfig,
  version?: string,
): Promise<ChatMessage[]> {
  const fieldGuide = getFieldGuide(phase)
  const customLabel = await docLabelFor(workspaceRoot, phase)
  const formData = await loadPhaseDocument(workspaceRoot, phase, version)
  const current = JSON.stringify(normalizeCanvasDoc(formData), null, 2)
  const codeContext = await buildGroundedContext(workspaceRoot, text, embedCfg)

  const parts = [`USER: ${text}`, '']

  if (fieldGuide) {
    parts.push('Document guidance:', fieldGuide, '')
  }

  parts.push('CURRENT DOCUMENT (BlockNote JSON):', '```json', current, '```')

  if (codeContext) parts.push('', codeContext)

  return [
    { role: 'system', content: canvasSystemPrompt(phase, customLabel ?? undefined) },
    { role: 'user', content: parts.join('\n') },
  ]
}

export function parseResponse(text: string): {
  message: string
  updates: Record<string, unknown> | null
  document: unknown[] | null
  anchors: Record<string, string> | null
} {
  let trimmed = text.trim()
  if (!trimmed) {
    return { message: 'No response.', updates: null, document: null, anchors: null }
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenceMatch) {
    trimmed = fenceMatch[1].trim()
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object' && typeof parsed.message === 'string') {
        const updates = parsed.updates
        const document = parsed.document
        const anchorsRaw = parsed.anchors

        let nextUpdates: Record<string, unknown> | null = null
        if (
          updates &&
          typeof updates === 'object' &&
          !Array.isArray(updates) &&
          Object.keys(updates).length > 0
        ) {
          nextUpdates = updates as Record<string, unknown>
        }

        let nextDocument: unknown[] | null = null
        if (Array.isArray(document) && document.length > 0) {
          nextDocument = document
        }

        let nextAnchors: Record<string, string> | null = null
        if (anchorsRaw && typeof anchorsRaw === 'object' && !Array.isArray(anchorsRaw)) {
          nextAnchors = {}
          for (const [k, v] of Object.entries(anchorsRaw as Record<string, unknown>)) {
            if (typeof v === 'string' && v.trim()) nextAnchors[k] = v.trim()
          }
          if (Object.keys(nextAnchors).length === 0) nextAnchors = null
        }

        return {
          message: parsed.message,
          updates: nextUpdates,
          document: nextDocument,
          anchors: nextAnchors,
        }
      }
    } catch {
      // fall through
    }
  }

  return { message: trimmed, updates: null, document: null, anchors: null }
}

export function deepMerge(target: Record<string, unknown>, updates: Record<string, unknown>): void {
  for (const [dotPath, value] of Object.entries(updates)) {
    const keys = dotPath.split('.')
    let current = target
    for (const key of keys.slice(0, -1)) {
      const existing = current[key]
      if (
        existing === null ||
        existing === undefined ||
        typeof existing !== 'object' ||
        Array.isArray(existing)
      ) {
        current[key] = {}
      }
      current = current[key] as Record<string, unknown>
    }
    current[keys[keys.length - 1]] = value
  }
}

export interface ChatReload {
  type: 'load_canvas' | 'load_charter' | 'load_prd' | 'load_form'
  data: unknown
  charterData?: unknown
  phase?: string
}

export interface ChatResult {
  message: string
  form_updated: boolean
  reload: ChatReload | null
}

export interface ProcessChatArgs {
  text: string
  phase: string
  workspaceRoot: string
  apiKey: string
  provider?: string | null
  model?: string | null
  version?: string
  /** Interim UX status (e.g. "Updating code index…"). Pass null to clear. */
  onStatus?: (text: string | null) => void
}

/**
 * Lazy incremental embedding sync before chat.
 * Re-embeds only changed files (or builds the index on first use).
 * Returns false if Ollama / embeddings are unavailable (grep/read_file still work).
 */
async function ensureFreshEmbeddings(
  workspaceRoot: string,
  embedCfg: EmbeddingConfig,
  onStatus?: (text: string | null) => void,
): Promise<boolean> {
  try {
    onStatus?.('Checking for code changes…')
    const indexer = new CodeIndexer(workspaceRoot)
    const stats = await indexer.syncEmbeddings(embedCfg, (p) => {
      if (p.phase === 'embedding') {
        onStatus?.(`Updating code index… ${p.percent}%`)
      } else if (p.phase === 'embedding-scan') {
        onStatus?.('Checking for code changes…')
      }
    })
    if (stats.changed > 0) {
      onStatus?.(
        `Indexed ${stats.changed} changed file${stats.changed === 1 ? '' : 's'}`,
      )
    }
    return true
  } catch {
    onStatus?.('Semantic index unavailable — using file search tools…')
    return false
  }
}

export async function processChat(args: ProcessChatArgs): Promise<ChatResult> {
  const { text, phase, workspaceRoot, apiKey, provider, model, version, onStatus } = args

  const config = await loadConfig(workspaceRoot)
  const llmSettings = config.llm ?? { provider: 'deepseek', model: null }

  const llmConfig: LlmConfig = {
    provider: provider || llmSettings.provider || 'deepseek',
    model: model ?? llmSettings.model ?? null,
    apiKey,
  }

  const embedCfg: EmbeddingConfig = resolveEmbeddingSettings(config)

  // Option B: keep the semantic index fresh when possible (Ollama).
  // Tools (grep/read_file/list_dir) always work even if embeddings fail.
  await ensureFreshEmbeddings(workspaceRoot, embedCfg, onStatus)
  onStatus?.('Thinking…')

  let replyText: string
  let document: unknown[] | null
  let anchors: Record<string, string> | null
  // Message transcript used as context for diagram-fix retries.
  let fixMessages: ChatMessage[]

  // Always use the agentic tool loop so the model can actually read the open workspace.
  const fieldGuide = getFieldGuide(phase)
  const customLabel = await docLabelFor(workspaceRoot, phase)
  const currentDocJson = JSON.stringify(
    normalizeCanvasDoc(await loadPhaseDocument(workspaceRoot, phase, version)),
    null,
    2,
  )
  const result = await runAgentLoop({
    text,
    phase,
    label: customLabel ?? undefined,
    fieldGuide,
    workspaceRoot,
    llmConfig,
    embedCfg,
    currentDocJson,
  })
  replyText = result.message
  document = result.document
  anchors = result.anchors
  fixMessages = result.messages

  let formUpdated = false
  let reload: ChatReload | null = null

  if (isCanvasPhase(phase) && document) {
    const { blocks: validatedBlocks, notes } = await validateAndFixDiagrams(
      document,
      llmConfig,
      fixMessages,
    )
    const existing = normalizeCanvasDoc(await loadPhaseDocument(workspaceRoot, phase, version))
    const saved = {
      version: 1 as const,
      kind: 'blocknote' as const,
      blocks: validatedBlocks,
      anchors: anchors ?? existing.anchors ?? {},
    }
    await saveForm(workspaceRoot, phase, saved, version)
    reload = { type: 'load_canvas', phase, data: saved }
    formUpdated = true
    if (notes.length) {
      return {
        message: `${replyText}\n\n(${notes.join(' ')})`,
        form_updated: formUpdated,
        reload,
      }
    }
  }

  return {
    message: replyText,
    form_updated: formUpdated,
    reload,
  }
}

const DIAGRAM_FIX_RETRIES = 2

/**
 * Parse every diagram block before commit. On failure, ask the LLM to fix Mermaid
 * (1–2 retries), then drop still-invalid diagrams rather than blanking the canvas.
 */
async function validateAndFixDiagrams(
  blocks: unknown[],
  llmConfig: LlmConfig,
  priorMessages: ChatMessage[],
): Promise<{ blocks: unknown[]; notes: string[] }> {
  const notes: string[] = []
  let next = blocks.map((b) =>
    b && typeof b === 'object' ? { ...(b as Record<string, unknown>) } : b,
  )

  for (let attempt = 0; attempt <= DIAGRAM_FIX_RETRIES; attempt++) {
    const diagrams = extractDiagramCodes(next)
    const failures: { index: number; code: string; error: string }[] = []

    for (const d of diagrams) {
      const result = await parseMermaid(d.code)
      if (!result.ok) {
        failures.push({ ...d, error: result.error })
        continue
      }
      // Persist normalized source (unescaped \\n, stripped fences).
      const block = next[d.index]
      if (block && typeof block === 'object') {
        const b = { ...(block as Record<string, unknown>) }
        const props =
          b.props && typeof b.props === 'object' && !Array.isArray(b.props)
            ? { ...(b.props as Record<string, unknown>) }
            : {}
        props.code = result.code
        b.props = props
        next[d.index] = b
      }
    }

    if (failures.length === 0) return { blocks: next, notes }

    if (attempt === DIAGRAM_FIX_RETRIES) {
      // Last resort: replace with a warn callout — never a canned fake diagram.
      for (const f of failures) {
        const block = next[f.index]
        if (!block || typeof block !== 'object') continue
        const props =
          (block as Record<string, unknown>).props &&
          typeof (block as Record<string, unknown>).props === 'object' &&
          !Array.isArray((block as Record<string, unknown>).props)
            ? ((block as Record<string, unknown>).props as Record<string, unknown>)
            : {}
        const title =
          typeof props.title === 'string' && props.title.trim()
            ? props.title.trim()
            : 'Diagram'
        next[f.index] = {
          type: 'callout',
          props: {
            variant: 'warn',
            title: `${title} — Mermaid could not be validated`,
          },
          content:
            'Ask me to regenerate this diagram from the codebase or our chat so I can validate Mermaid again.',
        }
      }
      notes.push(
        `Replaced ${failures.length} invalid Mermaid diagram(s) with a warning callout after failed parse retries.`,
      )
      return { blocks: next, notes }
    }

    const fixPrompt = [
      'The document you returned has Mermaid diagram block(s) that failed to parse.',
      'Return a JSON object: { "message": "fixed", "fixes": [ { "index": <blockIndex>, "code": "<valid mermaid>" } ] }',
      'Only include diagram fixes. Do not rewrite the whole document.',
      '',
      'Failures:',
      ...failures.map(
        (f) =>
          `- index ${f.index}: error=${JSON.stringify(f.error)}\n  code=\n\`\`\`\n${f.code}\n\`\`\``,
      ),
    ].join('\n')

    try {
      const rawFix = await callLlm(
        [...priorMessages, { role: 'user', content: fixPrompt }],
        llmConfig,
        { jsonMode: true },
      )
      const fixes = parseDiagramFixes(rawFix)
      for (const fix of fixes) {
        const block = next[fix.index]
        if (!block || typeof block !== 'object') continue
        const b = { ...(block as Record<string, unknown>) }
        const props =
          b.props && typeof b.props === 'object' && !Array.isArray(b.props)
            ? { ...(b.props as Record<string, unknown>) }
            : {}
        props.code = normalizeMermaidSource(fix.code) || fix.code
        if (props.source !== 'code-index') props.source = 'llm'
        b.type = 'diagram'
        b.props = props
        next[fix.index] = b
      }
      notes.push(`Re-validated Mermaid after fix attempt ${attempt + 1}.`)
    } catch (err) {
      notes.push(
        `Diagram fix attempt failed: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  return { blocks: next, notes }
}

function parseDiagramFixes(text: string): { index: number; code: string }[] {
  let trimmed = text.trim()
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fence) trimmed = fence[1].trim()
  try {
    const parsed = JSON.parse(trimmed)
    const fixes = parsed?.fixes
    if (!Array.isArray(fixes)) return []
    return fixes
      .map((f: unknown) => {
        if (!f || typeof f !== 'object') return null
        const row = f as Record<string, unknown>
        const index = Number(row.index)
        const code = typeof row.code === 'string' ? row.code : ''
        if (!Number.isFinite(index) || !code.trim()) return null
        return { index: Math.trunc(index), code }
      })
      .filter((x): x is { index: number; code: string } => x !== null)
  } catch {
    return []
  }
}
