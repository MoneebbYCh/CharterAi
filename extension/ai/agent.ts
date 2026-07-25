import { buildCodeContext } from './codeContext'
import { getFieldGuide } from './fieldGuides'
import { CANVAS_BLOCK_CATALOG } from './blockCatalog'
import { callLlm, type ChatMessage, type LlmConfig } from './llmClient'
import {
  loadCharter,
  loadConfig,
  loadForm,
  loadPrd,
  saveCharter,
  saveForm,
  savePrd,
} from '../formStateManager'

const FORM_PHASES = ['prd', 'system-design'] as const
const CANVAS_PHASES = ['project-charter'] as const

const FORM_SYSTEM_PROMPT = `You are an AI assistant for Req-Gath-Sys, a requirements gathering system.
Help users fill project requirements forms (PRD, system design) accurately and concisely.

You MUST respond with a single JSON object and nothing else. No prose, no markdown fences.
Shape:
{
  "message": "A short human-readable reply explaining what you did or answering the question",
  "updates": {
    "section1.projectName": "Example value"
  }
}

Rules for "updates":
- Use dot-path keys that match the field schema exactly (e.g. "section2.coreProblem").
- Only include fields you are actually changing. Do not restate unchanged fields.
- Match the declared type for each field: string, boolean, array, or object.
- For array fields, provide the full array value (a list of objects/strings as described).
- Prefer concrete, specific values inferred from the conversation and current form data.
- If the user is only asking a question (no form change needed), set "updates": {}.
- Never invent a field name that is not in the field schema.

Always return valid JSON with both "message" and "updates" keys, even when "updates" is empty.`

const CANVAS_SYSTEM_PROMPT = `You are an AI assistant for Req-Gath-Sys helping users draft a Project Charter.

WHAT A CHARTER IS:
It formally authorizes a project to exist and gives the lead authority to spend resources.
Before the charter: an idea. After it: a sanctioned project with owner, boundary, and success criteria.
Your job is to turn "we should build X" into "X is authorized — here is who owns it, what it covers, and how we will know it worked."

DEFAULT DRAFTING BRIEF (follow unless the user asks for a narrower edit):
Draft a complete PMI-aligned charter with purpose, measurable objectives, explicit scope in/out,
stakeholders, milestones, budget/resources, assumptions/constraints, risks, and approval.

Required structure on any full draft:
1. Title (heading 1)
2. Purpose / justification — callout with the business problem (not a feature wishlist)
3. Objectives & success criteria — kpiGrid (specific, measurable, checkable later)
4. High-level scope — scopeBounds with BOTH inScope and outOfScope (exclusions mandatory)
5. Key stakeholders — stakeholderTable (sponsor, delivery owner/PM, major stakeholders)
6. High-level milestones — heading + short numbered/bullet list (checkpoints only)
7. High-level budget / resources — heading + concise paragraph or bullets
8. Assumptions & constraints — heading + bullets; hard constraints in a warn callout
9. High-level risks — riskList
10. Approval / sign-off — callout naming who must approve for this to be real

QUALITY RULES:
- Reject vague objectives ("modernize the platform", "improve efficiency"). Prefer measurable targets.
- Always state what is out of scope. Fuzzy scope is the root of creep.
- Name authority: who can decide and spend. Do not leave ownership implied.
- If the user is vague, still produce a strong draft with clear [PLACEHOLDER] markers and ask 1–3 sharp follow-ups in "message".
- Prefer custom blocks over bullet lists for KPIs, scope, stakeholders, and risks.

The canvas uses BlockNote. You MUST respond with a single JSON object and nothing else.
Shape example:
{
  "message": "Drafted an authorization charter. Confirm sponsor, budget ceiling, and hard launch date.",
  "document": [
    { "type": "heading", "props": { "level": 1 }, "content": "Project Charter — Checkout Latency" },
    { "type": "callout", "props": { "variant": "info", "title": "Purpose" }, "content": "Authorize work to cut checkout p95 latency so conversion stops leaking at peak." },
    { "type": "heading", "props": { "level": 2 }, "content": "Objectives & success criteria" },
    { "type": "kpiGrid", "props": { "items": [ { "metric": "Checkout p95 latency", "target": "<800ms", "method": "APM, peak hour" } ] } },
    { "type": "heading", "props": { "level": 2 }, "content": "Scope" },
    { "type": "scopeBounds", "props": { "inScope": ["Checkout API path"], "outOfScope": ["Mobile redesign"] } },
    { "type": "heading", "props": { "level": 2 }, "content": "Stakeholders" },
    { "type": "stakeholderTable", "props": { "rows": [ { "nameRole": "Alex / Sponsor", "interest": "H", "influence": "H", "concern": "Conversion" } ] } },
    { "type": "heading", "props": { "level": 2 }, "content": "Milestones" },
    { "type": "numberedListItem", "content": "Baseline + target locked — Week 1" },
    { "type": "heading", "props": { "level": 2 }, "content": "Budget & resources" },
    { "type": "paragraph", "content": "2 backend engineers, 1 SRE consult; cap [PLACEHOLDER]." },
    { "type": "heading", "props": { "level": 2 }, "content": "Assumptions & constraints" },
    { "type": "bulletListItem", "content": "Assumption: production APM already covers checkout." },
    { "type": "callout", "props": { "variant": "warn", "title": "Constraint" }, "content": "No schema migrations in peak season." },
    { "type": "heading", "props": { "level": 2 }, "content": "Risks" },
    { "type": "riskList", "props": { "rows": [ { "risk": "Cache invalidation bugs", "likelihood": "M", "impact": "H", "mitigation": "Feature flag + canary" } ] } },
    { "type": "heading", "props": { "level": 2 }, "content": "Approval" },
    { "type": "callout", "props": { "variant": "success", "title": "Sign-off required" }, "content": "Sponsor + Eng Manager must approve before spend." }
  ]
}

Rules for "document":
- Provide the FULL document as a BlockNote block array (not a patch).
- If the user only asks a question and no document change is needed, set "document": null.

${CANVAS_BLOCK_CATALOG}

Always return valid JSON with "message" and "document" keys.`

function isFormPhase(phase: string): boolean {
  return (FORM_PHASES as readonly string[]).includes(phase)
}

function isCanvasPhase(phase: string): boolean {
  return (CANVAS_PHASES as readonly string[]).includes(phase)
}

function emptyCanvasDoc() {
  return {
    version: 1 as const,
    kind: 'blocknote' as const,
    blocks: [{ type: 'paragraph', content: '' }],
  }
}

function normalizeCanvasDoc(data: unknown): { version: 1; kind: 'blocknote'; blocks: unknown[] } {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const d = data as Record<string, unknown>
    if (d.kind === 'blocknote' && Array.isArray(d.blocks)) {
      return {
        version: 1,
        kind: 'blocknote',
        blocks: d.blocks.length > 0 ? d.blocks : emptyCanvasDoc().blocks,
      }
    }
  }
  return emptyCanvasDoc()
}

async function loadFormData(workspaceRoot: string, phase: string): Promise<unknown | null> {
  if (phase === 'project-charter') {
    return loadCharter(workspaceRoot)
  }
  if (phase === 'prd') {
    return (await loadPrd(workspaceRoot)).prd
  }
  if (isFormPhase(phase)) {
    return loadForm(workspaceRoot, phase)
  }
  return null
}

export async function buildMessages(
  text: string,
  phase: string,
  workspaceRoot: string,
): Promise<ChatMessage[]> {
  const fieldGuide = getFieldGuide(phase)
  const formData = await loadFormData(workspaceRoot, phase)
  const canvas = isCanvasPhase(phase)
  const current = canvas
    ? JSON.stringify(normalizeCanvasDoc(formData), null, 2)
    : formData !== null && formData !== undefined
      ? JSON.stringify(formData, null, 2)
      : 'No form data yet.'
  const codeContext = buildCodeContext(workspaceRoot)

  const parts = [
    `USER: ${text}`,
    '',
  ]

  if (fieldGuide) {
    parts.push(canvas ? 'Document guidance:' : 'Available form fields:', fieldGuide, '')
  }

  parts.push(
    canvas ? 'CURRENT DOCUMENT (BlockNote JSON):' : 'CURRENT FORM DATA:',
    '```json',
    current,
    '```',
  )

  if (codeContext) parts.push('', codeContext)

  return [
    { role: 'system', content: canvas ? CANVAS_SYSTEM_PROMPT : FORM_SYSTEM_PROMPT },
    { role: 'user', content: parts.join('\n') },
  ]
}

export function parseResponse(text: string): {
  message: string
  updates: Record<string, unknown> | null
  document: unknown[] | null
} {
  let trimmed = text.trim()
  if (!trimmed) {
    return { message: 'No response.', updates: null, document: null }
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

        let nextUpdates: Record<string, unknown> | null = null
        if (updates && typeof updates === 'object' && !Array.isArray(updates) && Object.keys(updates).length > 0) {
          nextUpdates = updates as Record<string, unknown>
        }

        let nextDocument: unknown[] | null = null
        if (Array.isArray(document) && document.length > 0) {
          nextDocument = document
        }

        return { message: parsed.message, updates: nextUpdates, document: nextDocument }
      }
    } catch {
      // fall through
    }
  }

  return { message: trimmed, updates: null, document: null }
}

export function deepMerge(target: Record<string, unknown>, updates: Record<string, unknown>): void {
  for (const [dotPath, value] of Object.entries(updates)) {
    const keys = dotPath.split('.')
    let current = target
    for (const key of keys.slice(0, -1)) {
      const existing = current[key]
      if (existing === null || existing === undefined || typeof existing !== 'object' || Array.isArray(existing)) {
        current[key] = {}
      }
      current = current[key] as Record<string, unknown>
    }
    current[keys[keys.length - 1]] = value
  }
}

export interface ChatReload {
  type: 'load_charter' | 'load_prd' | 'load_form'
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
}

export async function processChat(args: ProcessChatArgs): Promise<ChatResult> {
  const { text, phase, workspaceRoot, apiKey, provider, model } = args

  const config = await loadConfig(workspaceRoot)
  const llmSettings = config.llm ?? { provider: 'deepseek', model: null }

  const llmConfig: LlmConfig = {
    provider: provider || llmSettings.provider || 'deepseek',
    model: model ?? llmSettings.model ?? null,
    apiKey,
  }

  const messages = await buildMessages(text, phase, workspaceRoot)
  const raw = await callLlm(messages, llmConfig, { jsonMode: true })
  const { message: replyText, updates, document } = parseResponse(raw)

  let formUpdated = false
  let reload: ChatReload | null = null

  if (isCanvasPhase(phase) && document) {
    const saved = {
      version: 1 as const,
      kind: 'blocknote' as const,
      blocks: document,
    }
    await saveCharter(workspaceRoot, saved)
    reload = { type: 'load_charter', data: saved }
    formUpdated = true
  } else if (updates && isFormPhase(phase)) {
    const formData = await loadFormData(workspaceRoot, phase)
    const base = formData && typeof formData === 'object' && !Array.isArray(formData)
      ? (formData as Record<string, unknown>)
      : {}
    const merged = structuredClone(base)
    deepMerge(merged, updates)

    if (phase === 'prd') {
      await savePrd(workspaceRoot, merged)
      const charter = (await loadPrd(workspaceRoot)).charter
      reload = { type: 'load_prd', data: merged, charterData: charter }
    } else {
      await saveForm(workspaceRoot, phase, merged)
      reload = { type: 'load_form', phase, data: merged }
    }

    formUpdated = true
  }

  return {
    message: replyText,
    form_updated: formUpdated,
    reload,
  }
}
