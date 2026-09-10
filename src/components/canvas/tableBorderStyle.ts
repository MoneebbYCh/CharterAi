/** Document-level table border appearance (persisted in canvas anchors). */

export type TableBorderLine = 'solid' | 'dashed' | 'dotted' | 'none'

export interface TableBorderStyle {
  /** Border width in px (0 = invisible). */
  width: number
  color: string
  line: TableBorderLine
}

export type TableBorderPresetId =
  | 'invisible'
  | 'thin'
  | 'medium'
  | 'thick'
  | 'extra'
  | 'dashed'
  | 'custom'

export const DEFAULT_TABLE_BORDER: TableBorderStyle = {
  width: 2,
  color: '#000000',
  line: 'solid',
}

export const TABLE_BORDER_PRESETS: Array<{
  id: Exclude<TableBorderPresetId, 'custom'>
  label: string
  style: TableBorderStyle
}> = [
  { id: 'invisible', label: 'Invisible', style: { width: 0, color: '#000000', line: 'none' } },
  { id: 'thin', label: 'Thin', style: { width: 1, color: '#000000', line: 'solid' } },
  { id: 'medium', label: 'Medium', style: { width: 2, color: '#000000', line: 'solid' } },
  { id: 'thick', label: 'Thick', style: { width: 3, color: '#000000', line: 'solid' } },
  { id: 'extra', label: 'Extra thick', style: { width: 4, color: '#000000', line: 'solid' } },
  { id: 'dashed', label: 'Dashed', style: { width: 2, color: '#000000', line: 'dashed' } },
]

const ANCHOR_KEY = 'tableBorder'

export function tableBorderAnchorKey(): string {
  return ANCHOR_KEY
}

export function matchTableBorderPreset(style: TableBorderStyle): TableBorderPresetId {
  for (const preset of TABLE_BORDER_PRESETS) {
    const p = preset.style
    if (p.width === style.width && p.color === style.color && p.line === style.line) {
      return preset.id
    }
  }
  return 'custom'
}

export function serializeTableBorder(style: TableBorderStyle): string {
  return JSON.stringify({
    w: style.width,
    c: style.color,
    l: style.line,
  })
}

export function parseTableBorder(raw: string | undefined | null): TableBorderStyle {
  if (!raw?.trim()) return { ...DEFAULT_TABLE_BORDER }
  try {
    const parsed = JSON.parse(raw) as { w?: unknown; c?: unknown; l?: unknown }
    const width = Number(parsed.w)
    const color = typeof parsed.c === 'string' && parsed.c.trim() ? parsed.c.trim() : DEFAULT_TABLE_BORDER.color
    const line =
      parsed.l === 'solid' || parsed.l === 'dashed' || parsed.l === 'dotted' || parsed.l === 'none'
        ? parsed.l
        : DEFAULT_TABLE_BORDER.line
    return {
      width: Number.isFinite(width) ? Math.max(0, Math.min(12, Math.round(width))) : DEFAULT_TABLE_BORDER.width,
      color,
      line,
    }
  } catch {
    return { ...DEFAULT_TABLE_BORDER }
  }
}

/** CSS custom properties applied on `.bn-canvas-host`. */
export function tableBorderCssVars(style: TableBorderStyle): Record<string, string> {
  const width = style.line === 'none' || style.width <= 0 ? 0 : style.width
  return {
    '--rg-table-border-width': `${width}px`,
    '--rg-table-border-color': style.color || '#000000',
    '--rg-table-border-style': width === 0 ? 'none' : style.line,
  }
}
