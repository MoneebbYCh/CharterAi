/** BlockNote document persisted for canvas phases (Charter Option A). */

export type BlockNoteBlock = Record<string, unknown>

export interface CanvasDocument {
  version: 1
  kind: 'blocknote'
  blocks: BlockNoteBlock[]
}

export const CHARTER_DOC_STORAGE_KEY = 'ascen-charter-doc-v1'

export function emptyCanvasDocument(): CanvasDocument {
  return {
    version: 1,
    kind: 'blocknote',
    blocks: [
      {
        type: 'paragraph',
        content: '',
      },
    ],
  }
}

/** True when stored JSON is a canvas doc (not the legacy form shape). */
export function isCanvasDocument(data: unknown): data is CanvasDocument {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  const d = data as Record<string, unknown>
  return d.kind === 'blocknote' && Array.isArray(d.blocks)
}

/** Normalize anything loaded from disk into a canvas document. Legacy forms become empty. */
export function toCanvasDocument(data: unknown): CanvasDocument {
  if (isCanvasDocument(data)) {
    return {
      version: 1,
      kind: 'blocknote',
      blocks: data.blocks.length > 0 ? data.blocks : emptyCanvasDocument().blocks,
    }
  }
  return emptyCanvasDocument()
}

export function documentHasContent(doc: CanvasDocument): boolean {
  return doc.blocks.some((block) => {
    const content = block.content
    if (typeof content === 'string') return content.trim().length > 0
    if (Array.isArray(content)) {
      return content.some((c) => {
        if (typeof c === 'string') return c.trim().length > 0
        if (c && typeof c === 'object' && 'text' in c) {
          return String((c as { text: unknown }).text).trim().length > 0
        }
        return false
      })
    }
    const children = block.children
    return Array.isArray(children) && children.length > 0
  })
}
