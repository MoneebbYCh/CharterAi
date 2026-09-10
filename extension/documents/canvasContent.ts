import type { RenderedCanvasDocument } from './DocumentRenderer'

/** True when the canvas has real content (not just an empty placeholder paragraph). */
export function canvasHasContent(canvas: RenderedCanvasDocument | null | undefined): boolean {
  if (!canvas?.blocks?.length) return false
  return canvas.blocks.some((block) => {
    const type = String(block.type || '')
    if (type === 'diagram' || type === 'table') return true
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
