import { irBlockSchema, type IRBlock } from './DocumentIR'
import { sanitizeMermaidLabels } from '../../shared/mermaidSanitize'
import { normalizeMarkdown } from './markdownNormalize'

/**
 * Deterministic, LLM-tolerant block sanitation. The model is asked for a
 * precise JSON shape, but minor deviations (ragged table rows, fence-wrapped
 * diagrams, empty items) must not wipe an otherwise valid block. Hopeless
 * shapes become editable Markdown review notes — never dropped.
 *
 * Legacy widget types (kpiGrid, callout, …) are coerced into tables /
 * Markdown so older model output still lands as editable canvas content.
 */

const FENCE = /^```(?:mermaid)?\s*([\s\S]*?)\s*```$/i

const LIMITS = {
  paragraph: 8_000,
  listItems: 1_000,
  listMax: 40,
  tableHeader: 200,
  tableCell: 500,
  tableCols: 8,
  tableRows: 40,
  mermaidDiagram: 10_000,
  markdownSource: 12_000,
  blockTitle: 200,
  riskText: 500,
  riskLevel: 50,
  riskMitigation: 1_000,
  rowsMax: 40,
  scopeItem: 1_000,
  scopeMax: 40,
  kpiMetric: 200,
  kpiMax: 40,
  stakeholderName: 200,
  stakeholderLevel: 20,
  stakeholderConcern: 500,
  reviewNote: 2_000,
}

function string(raw: unknown): string | undefined {
  return typeof raw === 'string' ? raw : undefined
}

function clean(value: unknown, max: number): string | undefined {
  const s = string(value)
  if (s === undefined) return undefined
  const trimmed = s.trim()
  return trimmed ? trimmed.slice(0, max) : undefined
}

function cleanList(raw: unknown, itemMax: number, listMax: number): string[] {
  if (!Array.isArray(raw)) return []
  const items: string[] = []
  for (const entry of raw) {
    const item = clean(entry, itemMax)
    if (item !== undefined) items.push(item)
    if (items.length >= listMax) break
  }
  return items
}

function title(raw: unknown): string | undefined {
  return clean(raw, LIMITS.blockTitle)
}

function level(raw: unknown, max = LIMITS.riskLevel): string | undefined {
  const s = string(raw)?.trim().toLowerCase()
  if (!s) return undefined
  const short =
    s === 'high' || s === 'h'
      ? 'H'
      : s === 'medium' || s === 'med' || s === 'm'
        ? 'M'
        : s === 'low' || s === 'l'
          ? 'L'
          : s.toUpperCase()
  return short.slice(0, max)
}

function mermaidCode(raw: unknown): string | undefined {
  let code = string(raw)
  if (code === undefined) return undefined
  const fenced = code.trim().match(FENCE)
  if (fenced) code = fenced[1]!
  code = sanitizeMermaidLabels(code.trim())
  return code ? code.slice(0, LIMITS.mermaidDiagram) : undefined
}

function reviewMarkdown(titleText: string, body: string): IRBlock {
  const source = `> **${titleText}:** ${body}`.slice(0, LIMITS.markdownSource)
  return { type: 'markdown', source }
}

interface Dict {
  [key: string]: unknown
}

function asDict(raw: unknown): Dict | undefined {
  return raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Dict) : undefined
}

function makeTable(header: string[], rows: string[][]): IRBlock | null {
  if (header.length === 0 || rows.length === 0) return null
  const cappedHeader = header.slice(0, LIMITS.tableCols)
  const cappedRows = rows.slice(0, LIMITS.tableRows).map((row) => {
    const cells = row.map((c) => c.slice(0, LIMITS.tableCell)).slice(0, cappedHeader.length)
    while (cells.length < cappedHeader.length) cells.push('')
    return cells
  })
  return { type: 'table', header: cappedHeader, rows: cappedRows }
}

/**
 * Sanitizes one raw model-emitted block into a valid IRBlock, or null when the
 * shape is unrecoverable (the caller's salvage/fallback then applies).
 */
export function sanitizeBlock(raw: unknown): IRBlock | null {
  const dict = asDict(raw)
  if (!dict) return null
  const sanitized = sanitizeByType(dict.type, dict)
  if (!sanitized) return null
  const parsed = irBlockSchema.safeParse(sanitized)
  return parsed.success ? parsed.data : null
}

function sanitizeByType(type: unknown, d: Dict): IRBlock | null {
  switch (type) {
    case 'paragraph': {
      const text = clean(d.text, LIMITS.paragraph)
      return text !== undefined ? { type: 'paragraph', text } : null
    }
    case 'bullets': {
      const items = cleanList(d.items, LIMITS.listItems, LIMITS.listMax)
      return items.length > 0 ? { type: 'bullets', items } : null
    }
    case 'numbered': {
      const items = cleanList(d.items, LIMITS.listItems, LIMITS.listMax)
      return items.length > 0 ? { type: 'numbered', items } : null
    }
    case 'markdown': {
      const source = clean(d.source ?? d.md, LIMITS.markdownSource)
      if (source === undefined) return null
      const normalized = normalizeMarkdown(source)
      return normalized ? { type: 'markdown', source: normalized.slice(0, LIMITS.markdownSource) } : null
    }
    case 'mermaid': {
      const diagram = mermaidCode(d.diagram)
      if (diagram === undefined) return null
      return { type: 'mermaid', diagram, ...(title(d.title) ? { title: title(d.title) } : {}) }
    }
    case 'table': {
      if (!Array.isArray(d.rows) || !Array.isArray(d.header)) return null
      const header = d.header
        .map((h) => clean(h, LIMITS.tableHeader))
        .filter((h): h is string => h !== undefined)
        .slice(0, LIMITS.tableCols)
      if (header.length === 0) return null
      const rows: string[][] = []
      for (const rawRow of d.rows) {
        if (!Array.isArray(rawRow)) continue
        const cells = rawRow
          .map((c) => clean(c, LIMITS.tableCell) ?? '')
          .slice(0, LIMITS.tableCols)
        while (cells.length < header.length) cells.push('')
        cells.length = header.length
        if (cells.every((c) => c === '')) continue
        rows.push(cells)
        if (rows.length >= LIMITS.tableRows) break
      }
      return rows.length > 0 ? { type: 'table', header, rows } : null
    }
    // Legacy widgets → tables / Markdown (no longer first-class IR types).
    case 'callout': {
      const text = clean(d.text, LIMITS.reviewNote)
      if (text === undefined) return null
      const heading = title(d.title)
      return reviewMarkdown(heading ?? 'Note', text)
    }
    case 'kpiGrid': {
      if (!Array.isArray(d.items)) return null
      const rows: string[][] = []
      for (const rawItem of d.items) {
        const item = asDict(rawItem)
        const metric = clean(item?.metric, LIMITS.kpiMetric)
        if (metric === undefined) continue
        rows.push([
          metric,
          clean(item?.target, LIMITS.kpiMetric) ?? '',
          clean(item?.method, LIMITS.kpiMetric) ?? '',
        ])
        if (rows.length >= LIMITS.kpiMax) break
      }
      return makeTable(['Metric', 'Target', 'Method'], rows)
    }
    case 'stakeholderTable': {
      if (!Array.isArray(d.rows)) return null
      const rows: string[][] = []
      for (const rawRow of d.rows) {
        const row = asDict(rawRow)
        const nameRole = clean(row?.nameRole, LIMITS.stakeholderName)
        if (nameRole === undefined) continue
        rows.push([
          nameRole,
          level(row?.interest, LIMITS.stakeholderLevel) ?? '',
          level(row?.influence, LIMITS.stakeholderLevel) ?? '',
          clean(row?.concern, LIMITS.stakeholderConcern) ?? '',
        ])
        if (rows.length >= LIMITS.rowsMax) break
      }
      return makeTable(['Name / Role', 'Interest', 'Influence', 'Concern'], rows)
    }
    case 'risk':
    case 'riskList': {
      if (!Array.isArray(d.rows) && !Array.isArray(d.items)) return null
      const source = Array.isArray(d.rows) ? d.rows : d.items
      const rows: string[][] = []
      for (const rawRow of source!) {
        const row = asDict(rawRow)
        const risk = clean(row?.risk ?? row?.text, LIMITS.riskText)
        if (risk === undefined) continue
        rows.push([
          risk,
          level(row?.likelihood) ?? '',
          level(row?.impact) ?? '',
          clean(row?.mitigation, LIMITS.riskMitigation) ?? '',
        ])
        if (rows.length >= LIMITS.rowsMax) break
      }
      return makeTable(['Risk', 'Likelihood', 'Impact', 'Mitigation'], rows)
    }
    case 'scope':
    case 'scopeBounds': {
      const inScope = cleanList(d.inScope, LIMITS.scopeItem, LIMITS.scopeMax)
      const outOfScope = cleanList(d.outOfScope, LIMITS.scopeItem, LIMITS.scopeMax)
      if (inScope.length === 0 && outOfScope.length === 0) return null
      const lines: string[] = []
      if (inScope.length) {
        lines.push('**In scope**', ...inScope.map((i) => `- ${i}`))
      }
      if (outOfScope.length) {
        if (lines.length) lines.push('')
        lines.push('**Out of scope**', ...outOfScope.map((i) => `- ${i}`))
      }
      const source = normalizeMarkdown(lines.join('\n'))
      return source ? { type: 'markdown', source: source.slice(0, LIMITS.markdownSource) } : null
    }
    default:
      return null
  }
}

/** Sanitizes a raw `{"blocks":[...]}` payload; hopeless blocks become Markdown review notes. */
export function sanitizeBlockList(raw: unknown): { blocks: IRBlock[]; coerced: number } | null {
  const dict = asDict(raw)
  if (!dict || !Array.isArray(dict.blocks)) return null
  return sanitizeEntries(dict.blocks)
}

/**
 * Sanitizes a `{"parts":[...]}` section payload: each part is either
 * `{"md":"..."}` (prose Markdown → IR markdown) or a typed block (mermaid / table / …).
 */
export function sanitizePartsList(raw: unknown): { blocks: IRBlock[]; coerced: number } | null {
  const dict = asDict(raw)
  if (!dict || !Array.isArray(dict.parts)) return null
  const entries: unknown[] = []
  for (const part of dict.parts) {
    const p = asDict(part)
    if (!p) {
      entries.push(part)
      continue
    }
    if (typeof p.md === 'string') {
      entries.push({ type: 'markdown', source: p.md })
      continue
    }
    entries.push(part)
  }
  return sanitizeEntries(entries)
}

function sanitizeEntries(entries: unknown[]): { blocks: IRBlock[]; coerced: number } | null {
  const blocks: IRBlock[] = []
  let coerced = 0
  for (const entry of entries) {
    const block = sanitizeBlock(entry)
    if (block) {
      blocks.push(block)
    } else {
      const text = typeof entry === 'string' ? entry : safeJson(entry)
      blocks.push(reviewMarkdown('Unsupported content', (text ?? '').slice(0, LIMITS.reviewNote) || 'Empty block.'))
      coerced++
    }
    if (blocks.length >= 60) break
  }
  return blocks.length > 0 ? { blocks, coerced } : null
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
