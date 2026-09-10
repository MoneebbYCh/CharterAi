import type { BlockNoteBlock, CanvasDocument } from '../types/document'

/**
 * Serialize a canvas document to Markdown for export.
 * Pure function — no VS Code or DOM dependencies (unit-tested).
 */

function inlineText(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .map((c) => {
      if (typeof c === 'string') return c
      if (c && typeof c === 'object' && 'text' in c) return String((c as { text: unknown }).text)
      return ''
    })
    .join('')
}

function propsOf(block: BlockNoteBlock): Record<string, unknown> {
  const p = block.props
  return p && typeof p === 'object' && !Array.isArray(p) ? (p as Record<string, unknown>) : {}
}

function table(headers: string[], rows: string[][]): string {
  const esc = (v: string) => v.replace(/\|/g, '\\|')
  return [
    `| ${headers.map(esc).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.map(esc).join(' | ')} |`),
  ].join('\n')
}

function cellText(cell: unknown): string {
  if (typeof cell === 'string' || typeof cell === 'number') return String(cell)
  if (Array.isArray(cell)) return inlineText(cell)
  if (cell && typeof cell === 'object') {
    const obj = cell as { content?: unknown }
    if ('content' in obj) return inlineText(obj.content)
  }
  return ''
}

function nativeTable(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const rows = (content as { type?: string; rows?: { cells?: unknown[] }[] }).rows
  if (!Array.isArray(rows) || rows.length === 0) return ''
  const matrix = rows.map((r) => (Array.isArray(r.cells) ? r.cells.map(cellText) : []))
  if (matrix.every((r) => r.length === 0)) return ''
  const width = Math.max(...matrix.map((r) => r.length))
  const normalized = matrix.map((r) => {
    const copy = [...r]
    while (copy.length < width) copy.push('')
    return copy
  })
  const [header, ...body] = normalized
  return table(header, body)
}

function blockToMarkdown(block: BlockNoteBlock): string {
  const type = String(block.type || '')
  const props = propsOf(block)
  const text = inlineText(block.content)

  switch (type) {
    case 'heading': {
      const level = Math.min(3, Math.max(1, Number(props.level) || 1))
      return `${'#'.repeat(level)} ${text}`.trimEnd()
    }
    case 'paragraph':
      return text
    case 'bulletListItem':
      return `- ${text}`
    case 'numberedListItem':
      return `1. ${text}`
    case 'checkListItem':
      return `- [${props.checked === true ? 'x' : ' '}] ${text}`
    case 'quote':
      return text
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')
    case 'codeBlock': {
      const lang = typeof props.language === 'string' ? props.language : ''
      return `\`\`\`${lang}\n${text}\n\`\`\``
    }
    case 'table':
      return nativeTable(block.content)
    case 'diagram': {
      const code = typeof props.code === 'string' ? props.code.trimEnd() : ''
      return code ? `\`\`\`mermaid\n${code}\n\`\`\`` : ''
    }
    default:
      return '' // unknown / non-exportable blocks are skipped
  }
}

export function canvasToMarkdown(doc: CanvasDocument): string {
  return doc.blocks
    .map(blockToMarkdown)
    .filter((s) => s.length > 0)
    .join('\n\n')
}