import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CHARTER_DOC_STORAGE_KEY,
  emptyCanvasDocument,
  toCanvasDocument,
  type CanvasDocument,
  type BlockNoteBlock,
} from '../types/document'
import { getVscodeApi } from '../utils/vscodeApi'

const vscode = getVscodeApi()

function loadFromStorage(): CanvasDocument {
  try {
    const raw = localStorage.getItem(CHARTER_DOC_STORAGE_KEY)
    if (!raw) return emptyCanvasDocument()
    return toCanvasDocument(JSON.parse(raw))
  } catch {
    return emptyCanvasDocument()
  }
}

export function useCharterDocument() {
  const [doc, setDoc] = useState<CanvasDocument>(loadFromStorage)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [ready, setReady] = useState(!vscode)
  /** Bumped when extension/LLM pushes a new document so the editor can replace content. */
  const [externalRevision, setExternalRevision] = useState(0)
  const [externalBlocks, setExternalBlocks] = useState<BlockNoteBlock[] | null>(null)
  const docRef = useRef(doc)
  docRef.current = doc

  const persist = useCallback((next: CanvasDocument) => {
    localStorage.setItem(CHARTER_DOC_STORAGE_KEY, JSON.stringify(next))
    localStorage.removeItem('ascen-project-charter-v2')
    if (vscode) {
      vscode.postMessage({ type: 'saveCharter', data: next })
    }
    setLastSaved(new Date())
    setIsDirty(false)
  }, [])

  useEffect(() => {
    if (!isDirty) return
    const timer = setTimeout(() => {
      persist(docRef.current)
    }, 500)
    return () => clearTimeout(timer)
  }, [doc, isDirty, persist])

  const setBlocks = useCallback((blocks: BlockNoteBlock[]) => {
    setDoc({ version: 1, kind: 'blocknote', blocks })
    setIsDirty(true)
  }, [])

  const applyExternalDocument = useCallback((next: CanvasDocument) => {
    const normalized = toCanvasDocument(next)
    setDoc(normalized)
    localStorage.setItem(CHARTER_DOC_STORAGE_KEY, JSON.stringify(normalized))
    setExternalBlocks(normalized.blocks)
    setExternalRevision((n) => n + 1)
    setIsDirty(false)
    setLastSaved(new Date())
  }, [])

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
      if (msg.type === 'loadCharter') {
        if (msg.data) {
          applyExternalDocument(toCanvasDocument(msg.data))
        }
        setReady(true)
      }
    }
    window.addEventListener('message', handler)
    vscode.postMessage({ type: 'loadCharter' })
    return () => window.removeEventListener('message', handler)
  }, [applyExternalDocument])

  return {
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
