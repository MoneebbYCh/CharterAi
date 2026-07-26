import { useCallback, useEffect, useRef, useState } from 'react'
import {
  emptyCanvasDocument,
  toCanvasDocument,
  type CanvasDocument,
  type BlockNoteBlock,
} from '../types/document'
import { getCanvasPhase, type CanvasPhaseId } from '../data/canvasPhases'
import { getVscodeApi } from '../utils/vscodeApi'

const vscode = getVscodeApi()

function loadFromStorage(storageKey: string, legacyStorageKey?: string): CanvasDocument {
  try {
    const raw =
      localStorage.getItem(storageKey) ??
      (legacyStorageKey ? localStorage.getItem(legacyStorageKey) : null)
    if (!raw) return emptyCanvasDocument()
    return toCanvasDocument(JSON.parse(raw))
  } catch {
    return emptyCanvasDocument()
  }
}

/** Shared load/save hook for every BlockNote canvas phase. */
export function usePhaseDocument(phaseId: CanvasPhaseId) {
  const meta = getCanvasPhase(phaseId)
  if (!meta) {
    throw new Error(`Unknown canvas phase: ${phaseId}`)
  }
  const storageKey = meta.storageKey
  const legacyStorageKey = meta.legacyStorageKey

  const [doc, setDoc] = useState<CanvasDocument>(() => loadFromStorage(storageKey, legacyStorageKey))
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [ready, setReady] = useState(!vscode)
  const [externalRevision, setExternalRevision] = useState(0)
  const [externalBlocks, setExternalBlocks] = useState<BlockNoteBlock[] | null>(null)
  const docRef = useRef(doc)
  docRef.current = doc

  // When navigating between phases, remount state from that phase's storage.
  useEffect(() => {
    setDoc(loadFromStorage(storageKey, legacyStorageKey))
    setIsDirty(false)
    setLastSaved(null)
    setExternalBlocks(null)
    setExternalRevision(0)
    setReady(!vscode)
  }, [storageKey, legacyStorageKey])

  const persist = useCallback(
    (next: CanvasDocument) => {
      localStorage.setItem(storageKey, JSON.stringify(next))
      if (phaseId === 'project-charter') {
        localStorage.removeItem('charter-ai-project-charter-v2')
        localStorage.removeItem('ascen-project-charter-v2')
      }
      if (vscode) {
        vscode.postMessage({ type: 'saveCanvas', phase: phaseId, data: next })
      }
      setLastSaved(new Date())
      setIsDirty(false)
    },
    [phaseId, storageKey],
  )

  useEffect(() => {
    if (!isDirty) return
    const timer = setTimeout(() => {
      persist(docRef.current)
    }, 500)
    return () => clearTimeout(timer)
  }, [doc, isDirty, persist])

  const setBlocks = useCallback((blocks: BlockNoteBlock[]) => {
    setDoc((prev) => ({
      version: 1,
      kind: 'blocknote',
      blocks,
      anchors: prev.anchors ?? {},
    }))
    setIsDirty(true)
  }, [])

  const applyExternalDocument = useCallback(
    (next: CanvasDocument) => {
      const normalized = toCanvasDocument(next)
      setDoc(normalized)
      localStorage.setItem(storageKey, JSON.stringify(normalized))
      setExternalBlocks(normalized.blocks)
      setExternalRevision((n) => n + 1)
      setIsDirty(false)
      setLastSaved(new Date())
    },
    [storageKey],
  )

  const saveNow = useCallback(() => {
    persist(docRef.current)
  }, [persist])

  const reset = useCallback(() => {
    const fresh = emptyCanvasDocument()
    setDoc(fresh)
    persist(fresh)
    setExternalBlocks(fresh.blocks)
    setExternalRevision((n) => n + 1)
  }, [persist])

  useEffect(() => {
    if (!vscode) return
    const handler = (event: MessageEvent) => {
      const msg = event.data
      if (msg.type === 'loadCanvas' && msg.phase === phaseId) {
        if (msg.data) {
          applyExternalDocument(toCanvasDocument(msg.data))
        }
        setReady(true)
      }
      // Backward-compat: charter used loadCharter before unified canvas messages.
      if (phaseId === 'project-charter' && msg.type === 'loadCharter') {
        if (msg.data) {
          applyExternalDocument(toCanvasDocument(msg.data))
        }
        setReady(true)
      }
    }
    window.addEventListener('message', handler)
    vscode.postMessage({ type: 'loadCanvas', phase: phaseId })
    return () => window.removeEventListener('message', handler)
  }, [applyExternalDocument, phaseId])

  return {
    meta,
    doc,
    blocks: doc.blocks,
    setBlocks,
    applyExternalDocument,
    reset,
    saveNow,
    lastSaved,
    isDirty,
    ready,
    externalRevision,
    externalBlocks,
  }
}

/** @deprecated Prefer usePhaseDocument('project-charter') */
export function useCharterDocument() {
  return usePhaseDocument('project-charter')
}
