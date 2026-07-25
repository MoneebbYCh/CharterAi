import type { PartialBlock } from '@blocknote/core'
import type { BlockNoteBlock } from '../../types/document'

const CUSTOM_TYPES = new Set(['callout', 'kpiGrid', 'scopeBounds', 'stakeholderTable', 'riskList'])

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

/**
 * Normalize LLM-friendly props into BlockNote propSchema shapes.
 * LLMs emit arrays/objects; BlockNote stores complex data as JSON strings.
 */
export function sanitizeCanvasBlocks(blocks: BlockNoteBlock[]): PartialBlock[] {
  if (!blocks.length) {
    return [{ type: 'paragraph', content: '' }]
  }

  return blocks.map((raw) => {
    const block = { ...raw } as Record<string, unknown>
    const type = String(block.type || 'paragraph')
    const props =
      block.props && typeof block.props === 'object' && !Array.isArray(block.props)
        ? { ...(block.props as Record<string, unknown>) }
        : {}

    if (type === 'kpiGrid') {
      if (Array.isArray(props.items)) {
        props.itemsJson = JSON.stringify(props.items)
        delete props.items
      } else if (typeof props.itemsJson !== 'string') {
        props.itemsJson = '[]'
      }
    }

    if (type === 'stakeholderTable') {
      if (Array.isArray(props.rows)) {
        props.rowsJson = JSON.stringify(props.rows)
        delete props.rows
      } else if (typeof props.rowsJson !== 'string') {
        props.rowsJson = '[]'
      }
    }

    if (type === 'riskList') {
      if (Array.isArray(props.rows)) {
        props.rowsJson = JSON.stringify(props.rows)
        delete props.rows
      } else if (typeof props.rowsJson !== 'string') {
        props.rowsJson = '[]'
      }
    }

    if (type === 'scopeBounds') {
      if (Array.isArray(props.inScope)) {
        props.inScopeJson = JSON.stringify(props.inScope)
        delete props.inScope
      } else if (typeof props.inScopeJson !== 'string') {
        props.inScopeJson = '[]'
      }
      if (Array.isArray(props.outOfScope)) {
        props.outOfScopeJson = JSON.stringify(props.outOfScope)
        delete props.outOfScope
      } else if (typeof props.outOfScopeJson !== 'string') {
        props.outOfScopeJson = '[]'
      }
    }

    if (type === 'callout') {
      if (!props.variant) props.variant = 'info'
      if (props.title == null) props.title = ''
      const allowed = new Set(['info', 'warn', 'success', 'error'])
      if (!allowed.has(String(props.variant))) props.variant = 'info'
    }

    // Drop unknown custom types so replaceBlocks doesn't blow up.
    if (!CUSTOM_TYPES.has(type) && type.includes('Grid') === false) {
      // keep default BlockNote types as-is
    }

    const next: Record<string, unknown> = {
      type,
      props,
    }

    if (block.content !== undefined) next.content = block.content
    if (Array.isArray(block.children) && block.children.length) {
      next.children = sanitizeCanvasBlocks(asArray(block.children) as BlockNoteBlock[])
    }

    return next as PartialBlock
  })
}
