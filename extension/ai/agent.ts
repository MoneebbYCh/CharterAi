import { buildCodeContext } from './codeContext'
import { getFieldGuide } from './fieldGuides'
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

// Phases that have a structured form the AI can fill.
const FORM_PHASES = ['project-charter', 'prd', 'system-design'] as const

const SYSTEM_PROMPT = `You are an AI assistant for Req-Gath-Sys, a requirements gathering system.
Help users fill project requirements forms (charter, PRD, system design) accurately and concisely.

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

function isFormPhase(phase: string): boolean {
  return (FORM_PHASES as readonly string[]).includes(phase)
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
  const formJson = formData !== null && formData !== undefined
    ? JSON.stringify(formData, null, 2)
    : 'No form data yet.'
  const codeContext = buildCodeContext(workspaceRoot)

  let userContent: string
  if (fieldGuide) {
    const parts = [
      `USER: ${text}`,
      '',
      'Available form fields:',
      fieldGuide,
      '',
      'CURRENT FORM DATA:',
      '```json',
      formJson,
      '```',
    ]
    if (codeContext) parts.push('', codeContext)
    userContent = parts.join('\n')
  } else {
    const parts = [`USER: ${text}`]
    if (codeContext) parts.push('', codeContext)
    userContent = parts.join('\n')
  }

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userContent },
  ]
}

export function parseResponse(text: string): { message: string; updates: Record<string, unknown> | null } {
  let trimmed = text.trim()
  if (!trimmed) {
    return { message: 'No response.', updates: null }
  }

  // Strip markdown code fences if the model wrapped JSON anyway.
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenceMatch) {
    trimmed = fenceMatch[1].trim()
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object' && typeof parsed.message === 'string') {
        const updates = parsed.updates
        if (updates && typeof updates === 'object' && Object.keys(updates).length > 0) {
          return { message: parsed.message, updates: updates as Record<string, unknown> }
        }
        return { message: parsed.message, updates: null }
      }
    } catch {
      // fall through to returning raw text
    }
  }

  return { message: trimmed, updates: null }
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
  const { message: replyText, updates } = parseResponse(raw)

  const formData = await loadFormData(workspaceRoot, phase)
  let formUpdated = false
  let reload: ChatReload | null = null

  if (updates && isFormPhase(phase)) {
    const base = formData && typeof formData === 'object' && !Array.isArray(formData)
      ? (formData as Record<string, unknown>)
      : {}
    const merged = structuredClone(base)
    deepMerge(merged, updates)

    if (phase === 'project-charter') {
      await saveCharter(workspaceRoot, merged)
      reload = { type: 'load_charter', data: merged }
    } else if (phase === 'prd') {
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
