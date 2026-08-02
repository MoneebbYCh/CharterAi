import { useCallback, useEffect, useRef, useState } from 'react'
import {
  emptyCanvasDocument,
  toCanvasDocument,
  type CanvasDocument,
  type BlockNoteBlock,
} from '../types/document'
import { getDocumentType } from '../data/documentTypes'
import { getVscodeApi } from '../utils/vscodeApi'
import { getActiveVersionId, storageKeyFor, DEFAULT_VERSION_ID } from '../utils/versions'
import { hasWorkspaceScope } from '../utils/workspaceScope'

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

/** Shared load/save hook for every BlockNote canvas document (built-in or custom). */
export function usePhaseDocument(phaseId: string) {
  const meta = getDocumentType(phaseId)
  if (!meta) {
    throw new Error(`Unknown document type: ${phaseId}`)
  }
  // Documents are isolated per version; capture the active version at mount.
  // Switching versions always routes through Home, which remounts this hook.
  const [versionId] = useState(() => getActiveVersionId())
  const storageKey = storageKeyFor(meta.storageKey, versionId)
  // Never fall back to unscoped legacy keys once a workspace folder is active —
  // that was the cross-project leak.
  const legacyStorageKey =
    !hasWorkspaceScope() && versionId === DEFAULT_VERSION_ID
      ? meta.legacyStorageKey
      : undefined

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
      if (phaseId === 'project-charter' && versionId === DEFAULT_VERSION_ID) {
        localStorage.removeItem('charter-ai-project-charter-v2')
        localStorage.removeItem('ascen-project-charter-v2')
      }
      if (vscode) {
        vscode.postMessage({ type: 'saveCanvas', phase: phaseId, version: versionId, data: next })
      }
      setLastSaved(new Date())
      setIsDirty(false)
    },
    [phaseId, storageKey, versionId],
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
    (next: CanvasDocument, options?: { persistToDisk?: boolean }) => {
      const normalized = toCanvasDocument(next)
      setDoc(normalized)
      localStorage.setItem(storageKey, JSON.stringify(normalized))
      // Persist to disk when the change originates in the webview (e.g. applying a template),
      // so the extension's loadCanvas round-trip doesn't clobber it on the next open.
      if (options?.persistToDisk && vscode) {
        vscode.postMessage({ type: 'saveCanvas', phase: phaseId, version: versionId, data: normalized })
      }
      setExternalBlocks(normalized.blocks)
      setExternalRevision((n) => n + 1)
      setIsDirty(false)
      setLastSaved(new Date())
    },
    [storageKey, phaseId, versionId],
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
      // Ignore responses meant for a different version to avoid cross-version races.
      const msgVersion = typeof msg?.version === 'string' ? msg.version : versionId
      if (msg.type === 'loadCanvas' && msg.phase === phaseId && msgVersion === versionId) {
        // null/empty from disk must clear the workspace-scoped cache — never keep
        // another folder's draft that happened to share a bare localStorage key.
        if (msg.data) {
          applyExternalDocument(toCanvasDocument(msg.data))
        } else {
          applyExternalDocument(emptyCanvasDocument())
        }
        setReady(true)
      }
      // Backward-compat: charter used loadCharter before unified canvas messages.
      if (
        phaseId === 'project-charter' &&
        versionId === DEFAULT_VERSION_ID &&
        !hasWorkspaceScope() &&
        msg.type === 'loadCharter'
      ) {
        if (msg.data) {
          applyExternalDocument(toCanvasDocument(msg.data))
        } else {
          applyExternalDocument(emptyCanvasDocument())
        }
        setReady(true)
      }
    }
    window.addEventListener('message', handler)
    // Make sure the extension targets this version for disk + AI chat.
    vscode.postMessage({ type: 'setActiveVersion', version: versionId })
    vscode.postMessage({ type: 'loadCanvas', phase: phaseId, version: versionId })
    return () => window.removeEventListener('message', handler)
  }, [applyExternalDocument, phaseId, versionId])

  return {
    meta,
    doc,
    versionId,
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
