import { documentHasContent, toCanvasDocument } from '../types/document'

/** Latest agent checkpoint pushed from the extension host (survives late canvas mount). */
export interface CanvasPush {
  data: unknown
  revision?: number
}

const latestByPhase = new Map<string, CanvasPush>()

export function cacheCanvasPush(phase: string, data: unknown, revision?: number): void {
  const prev = latestByPhase.get(phase)
  const incoming = data ? toCanvasDocument(data) : null
  const incomingHasContent = incoming ? documentHasContent(incoming) : false
  const prevHasContent = prev?.data ? documentHasContent(toCanvasDocument(prev.data)) : false
  const prevRev = typeof prev?.revision === 'number' ? prev.revision : -1

  if (prev) {
    if (typeof revision === 'number' && revision < prevRev) return
    if (!incomingHasContent && prevHasContent) return
  }

  latestByPhase.set(phase, { data, revision })
}

export function peekCanvasPush(phase: string): CanvasPush | undefined {
  return latestByPhase.get(phase)
}

export function clearCanvasPush(phase: string): void {
  latestByPhase.delete(phase)
}
