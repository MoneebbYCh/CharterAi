import { useEffect, useMemo, useState } from 'react'
import type { View } from '../hooks/useViewState'
import { BrandMark } from '../components/BrandMark'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { NewDocumentModal } from '../components/NewDocumentModal'
import {
  createDocType,
  deleteDocType,
  getDocumentType,
  listDocumentTypes,
  type DocumentTypeMeta,
} from '../data/documentTypes'
import {
  documentHasContent,
  emptyCanvasDocument,
  toCanvasDocument,
  type CanvasDocument,
} from '../types/document'
import { useCodeIndex } from '../hooks/useCodeIndex'
import { loadProfile, profileInitials } from '../utils/profile'
import { getVscodeApi } from '../utils/vscodeApi'
import {
  createVersion,
  deleteVersion,
  getActiveVersionId,
  listVersions,
  renameVersion,
  setActiveVersionId,
  storageKeyFor,
  type DocVersion,
} from '../utils/versions'
import { hasWorkspaceScope } from '../utils/workspaceScope'

interface HomePageProps {
  onNavigate: (view: View) => void
}

function loadSavedDoc(
  phaseId: string,
  versionId: string,
): { doc: CanvasDocument | null; hasDraft: boolean } {
  try {
    const meta = getDocumentType(phaseId)
    if (!meta) return { doc: null, hasDraft: false }
    const raw =
      localStorage.getItem(storageKeyFor(meta.storageKey, versionId)) ??
      (meta.legacyStorageKey ? localStorage.getItem(meta.legacyStorageKey) : null)
    if (!raw) return { doc: null, hasDraft: false }
    const doc = toCanvasDocument(JSON.parse(raw))
    return { doc, hasDraft: documentHasContent(doc) }
  } catch {
    return { doc: null, hasDraft: false }
  }
}

/** Wipe a version's docs (built-in + custom) both locally and on disk. */
function clearVersionDocs(versionId: string) {
  const vscode = getVscodeApi()
  const empty = emptyCanvasDocument()
  listDocumentTypes().forEach((meta) => {
    try {
      localStorage.removeItem(storageKeyFor(meta.storageKey, versionId))
      if (!hasWorkspaceScope() && meta.legacyStorageKey) {
        localStorage.removeItem(meta.legacyStorageKey)
      }
    } catch {
      /* ignore storage errors */
    }
    vscode?.postMessage({ type: 'saveCanvas', phase: meta.id, version: versionId, data: empty })
  })
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { state, startIndexing, loadIndex, reset } = useCodeIndex()
  const [profile] = useState(() => loadProfile())

  const [versions, setVersions] = useState<DocVersion[]>(() => listVersions())
  const [activeId, setActiveId] = useState<string>(() => getActiveVersionId())
  const [pendingReset, setPendingReset] = useState<DocVersion | null>(null)
  const [pendingDelete, setPendingDelete] = useState<DocVersion | null>(null)
  // Bumped whenever the custom document-type list changes.
  const [docTypesRev, setDocTypesRev] = useState(0)
  const [showNewDoc, setShowNewDoc] = useState(false)
  const [pendingDeleteDoc, setPendingDeleteDoc] = useState<DocumentTypeMeta | null>(null)
  const [workspace, setWorkspace] = useState<{ path: string; name: string } | null>(null)

  const docTypes = useMemo(() => listDocumentTypes(), [docTypesRev])
  const activeVersion = versions.find((v) => v.id === activeId) ?? versions[0]
  const hasDraft = useMemo(
    () => loadSavedDoc('project-charter', activeId).hasDraft,
    [activeId],
  )

  useEffect(() => {
    const vscode = getVscodeApi()
    if (!vscode) return
    const handler = (event: MessageEvent) => {
      const msg = event.data
      if (msg?.type === 'workspaceInfo' && typeof msg.path === 'string') {
        setWorkspace({
          path: msg.path,
          name: typeof msg.name === 'string' && msg.name ? msg.name : msg.path.split(/[/\\]/).pop() || msg.path,
        })
      }
    }
    window.addEventListener('message', handler)
    vscode.postMessage({ type: 'loadWorkspaceInfo' })
    return () => window.removeEventListener('message', handler)
  }, [])

  const openVersion = (id: string) => {
    setActiveVersionId(id)
    setActiveId(id)
    onNavigate({ page: 'project-charter' })
  }

  const handleNewVersion = () => {
    const version = createVersion()
    setVersions(listVersions())
    openVersion(version.id)
  }

  const handleRename = (version: DocVersion) => {
    const next = window.prompt('Rename version', version.name)
    if (next && next.trim()) {
      renameVersion(version.id, next)
      setVersions(listVersions())
    }
  }

  const confirmReset = () => {
    if (!pendingReset) return
    clearVersionDocs(pendingReset.id)
    setPendingReset(null)
    if (pendingReset.id === activeId) {
      openVersion(activeId)
    }
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    const next = deleteVersion(pendingDelete.id)
    setVersions(next)
    setActiveId(getActiveVersionId())
    setPendingDelete(null)
  }

  const handleCreateDoc = (name: string, icon: string) => {
    const created = createDocType(name, icon)
    setShowNewDoc(false)
    setDocTypesRev((n) => n + 1)
    onNavigate({ page: created.id })
  }

  const confirmDeleteDoc = () => {
    if (!pendingDeleteDoc) return
    deleteDocType(pendingDeleteDoc.id)
    setPendingDeleteDoc(null)
    setDocTypesRev((n) => n + 1)
  }

  return (
    <div className="home-desktop h-screen w-full overflow-hidden flex flex-col dither-bg">
      <div className="home-mac-window flex-1 min-h-0 m-2 md:m-3 border-2 border-on-background bg-white mac-window-shadow flex flex-col">
        <div className="flex items-center gap-2 border-b-2 border-on-background bg-secondary-container px-2 py-1 shrink-0">
          <div className="mac-striped-header flex-1 min-w-0" aria-hidden />
          <span className="px-1">
            <BrandMark size="sm" />
          </span>
          <div className="mac-striped-header flex-1 min-w-0" aria-hidden />
        </div>

        <div
          className="home-workspace-bar"
          title={workspace?.path ?? 'No workspace folder open'}
        >
          <span className="home-workspace-bar-label">Workspace</span>
          <span className="home-workspace-bar-sep" aria-hidden>
            ·
          </span>
          {workspace ? (
            <>
              <span className="home-workspace-bar-name">{workspace.name}</span>
              <span className="home-workspace-bar-path">{workspace.path}</span>
            </>
          ) : (
            <span className="home-workspace-bar-path">
              {getVscodeApi() ? 'Detecting folder…' : 'Not running inside VS Code'}
            </span>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 md:p-6 border-b-2 border-on-background">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <BrandMark size="lg" className="mb-3" />
                <p className="text-sm text-on-surface-variant mb-1 max-w-md">
                  Select a pipeline stage below or resume your active version.
                </p>
                <p
                  className="text-[11px] font-bold uppercase tracking-widest text-primary mb-4"
                  style={{ fontFamily: 'var(--font-label)' }}
                >
                  Active · {activeVersion?.name ?? 'Version 1'}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate({ page: 'project-charter' })}
                    className="border-2 border-on-background bg-primary text-on-primary font-bold px-6 py-2 text-sm outset-button hover:opacity-90"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    {hasDraft ? 'Resume Charter' : 'Launch New Pipeline'}
                  </button>
                  <button
                    type="button"
                    onClick={handleNewVersion}
                    className="border-2 border-on-background bg-white text-on-background font-bold px-6 py-2 text-sm outset-button hover:bg-surface-container-low"
                    style={{ fontFamily: 'var(--font-label)' }}
                    title="Create a fresh, independent version in this codebase"
                  >
                    New Version
                  </button>
                  <button
                    type="button"
                    onClick={() => activeVersion && setPendingReset(activeVersion)}
                    className="border-2 border-on-background bg-white text-on-background font-bold px-6 py-2 text-sm outset-button hover:bg-surface-container-low disabled:opacity-40"
                    style={{ fontFamily: 'var(--font-label)' }}
                    title="Clear this version's documents back to blank"
                    disabled={!hasDraft}
                  >
                    Reset Version
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="home-profile-panel border-2 border-on-background bg-surface-container-low inset-field p-3 min-w-[200px] text-left"
                onClick={() => onNavigate({ page: 'profile' })}
                title="Open profile"
              >
                <div
                  className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2"
                  style={{ fontFamily: 'var(--font-label)' }}
                >
                  Profile
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 border-2 border-on-background bg-primary text-on-primary flex items-center justify-center text-xs font-bold mac-window-shadow shrink-0"
                    style={{ fontFamily: 'var(--font-label)' }}
                    aria-hidden
                  >
                    {profileInitials(profile.name)}
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block font-bold text-sm text-on-background truncate"
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
                      {profile.name}
                    </span>
                    <span
                      className="block text-[11px] text-on-surface-variant truncate"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      {profile.role}
                    </span>
                    <span
                      className="block text-[10px] text-primary mt-0.5 font-bold"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      Open profile…
                    </span>
                  </span>
                </div>
              </button>
            </div>
          </div>

          {hasDraft && (
            <div className="border-b-2 border-on-background bg-surface-container-low px-4 md:px-6 py-2 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-on-surface-variant" style={{ fontFamily: 'var(--font-label)' }}>
                Active draft on disk
              </span>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'project-charter' })}
                className="border-2 border-on-background bg-primary text-on-primary font-bold px-4 py-1 text-xs outset-button"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Open Charter
              </button>
            </div>
          )}

          <div className="p-4 md:p-6 border-b-2 border-on-background">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-bold tracking-widest text-on-surface-variant uppercase"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Versions
              </span>
              <div className="flex-1 h-px bg-on-background/30" />
              <span
                className="text-[11px] text-on-surface-variant"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Independent doc sets · same codebase
              </span>
            </div>
            <div className="border-2 border-on-background divide-y-2 divide-on-background">
              {versions.map((version) => {
                const isActive = version.id === activeId
                return (
                  <div
                    key={version.id}
                    className={`flex items-center gap-3 px-3 py-2 ${
                      isActive ? 'bg-secondary-container' : 'bg-white'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 border-2 border-on-background shrink-0 ${
                        isActive ? 'bg-primary' : 'bg-transparent'
                      }`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className="font-bold text-sm text-on-background truncate"
                        style={{ fontFamily: 'var(--font-headline)' }}
                      >
                        {version.name}
                        {isActive ? (
                          <span
                            className="ml-2 text-[10px] font-bold uppercase tracking-widest text-primary"
                            style={{ fontFamily: 'var(--font-label)' }}
                          >
                            Active
                          </span>
                        ) : null}
                      </div>
                      <div
                        className="text-[11px] text-on-surface-variant"
                        style={{ fontFamily: 'var(--font-label)' }}
                      >
                        Updated {new Date(version.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openVersion(version.id)}
                        className="border-2 border-on-background bg-primary text-on-primary font-bold px-3 py-0.5 text-xs outset-button"
                        style={{ fontFamily: 'var(--font-label)' }}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRename(version)}
                        className="border-2 border-on-background bg-white text-on-background font-bold px-3 py-0.5 text-xs outset-button"
                        style={{ fontFamily: 'var(--font-label)' }}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(version)}
                        disabled={versions.length <= 1}
                        className="border-2 border-on-background bg-white text-on-background font-bold px-3 py-0.5 text-xs outset-button disabled:opacity-40"
                        style={{ fontFamily: 'var(--font-label)' }}
                        title={versions.length <= 1 ? 'Cannot delete the only version' : 'Delete version'}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={handleNewVersion}
                className="border-2 border-on-background bg-white text-on-background font-bold px-4 py-1 text-xs outset-button hover:bg-surface-container-low"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                + New Version
              </button>
            </div>
          </div>

          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-bold tracking-widest text-on-surface-variant uppercase"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Documents
              </span>
              <div className="flex-1 h-px bg-on-background/30" />
              <span
                className="text-[11px] text-on-surface-variant"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Built-in phases + your own
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border-2 border-on-background">
              {docTypes.map((doc) => (
                <div
                  key={doc.id}
                  className="relative border border-on-background bg-white hover:bg-surface-container-low transition-colors group min-h-[110px] flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => onNavigate({ page: doc.id })}
                    className="flex-1 p-4 flex flex-col text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-on-background group-hover:text-primary mb-3">
                      {doc.icon}
                    </span>
                    <h3
                      className="font-bold text-sm text-on-background mb-0.5 pr-5"
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
                      {doc.title}
                    </h3>
                    <p
                      className="text-[11px] font-semibold text-on-background/75"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      {doc.builtin ? `Phase ${String(doc.number).padStart(2, '0')}` : 'Custom document'}
                    </p>
                  </button>
                  {!doc.builtin ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPendingDeleteDoc(doc)
                      }}
                      className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center border border-on-background bg-white text-on-background hover:bg-error hover:text-on-primary text-[13px] leading-none"
                      title={`Delete "${doc.title}"`}
                      aria-label={`Delete ${doc.title}`}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowNewDoc(true)}
                className="border border-on-background p-4 bg-secondary-container hover:bg-surface-container-low transition-colors min-h-[110px] flex flex-col items-center justify-center text-center cursor-pointer"
                title="Add a custom document to the pipeline"
              >
                <span className="material-symbols-outlined text-primary mb-2 text-[28px]">add</span>
                <span
                  className="font-bold text-xs text-on-background"
                  style={{ fontFamily: 'var(--font-label)' }}
                >
                  New Document
                </span>
              </button>
            </div>
          </div>

          <div className="px-4 md:px-6 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-bold tracking-widest text-on-surface-variant uppercase"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Codebase Index
              </span>
              <div className="flex-1 h-px bg-on-background/30" />
            </div>
            <div className="border-2 border-on-background bg-surface-container-low p-3 inset-field">
              {state.status === 'idle' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={startIndexing}
                    className="border-2 border-on-background bg-primary text-on-primary font-bold px-4 py-1 text-xs outset-button"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Index Codebase
                  </button>
                  <button
                    type="button"
                    onClick={loadIndex}
                    className="border-2 border-on-background bg-white text-on-background font-bold px-4 py-1 text-xs outset-button"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Load Cached
                  </button>
                </div>
              )}

              {state.status === 'indexing' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase" style={{ fontFamily: 'var(--font-label)' }}>
                      {state.phase.replace(/-/g, ' ')}
                    </span>
                    <span className="text-xs text-on-surface-variant" style={{ fontFamily: 'var(--font-label)' }}>
                      {Math.round(state.percent)}%
                    </span>
                  </div>
                  <div className="w-full h-4 border-2 border-on-background inset-field p-[2px] bg-white">
                    <div className="h-full bg-primary" style={{ width: `${state.percent}%` }} />
                  </div>
                </div>
              )}

              {state.status === 'done' && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-on-surface-variant mr-auto" style={{ fontFamily: 'var(--font-label)' }}>
                    {state.summary.totalFiles} files · {state.summary.totalTypes} types
                  </span>
                  <button
                    type="button"
                    onClick={startIndexing}
                    className="border-2 border-on-background bg-primary text-on-primary font-bold px-3 py-0.5 text-xs outset-button"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Re-index
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="border-2 border-on-background bg-white font-bold px-3 py-0.5 text-xs outset-button"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {state.status === 'error' && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-red-700 font-bold mr-auto" style={{ fontFamily: 'var(--font-label)' }}>
                    {state.message}
                  </span>
                  <button
                    type="button"
                    onClick={reset}
                    className="border-2 border-on-background bg-white font-bold px-3 py-0.5 text-xs outset-button"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {pendingReset ? (
        <ConfirmDialog
          title="Reset Version"
          message={`Clear all documents in "${pendingReset.name}" back to blank? This can't be undone.`}
          confirmLabel="Reset"
          danger
          onConfirm={confirmReset}
          onCancel={() => setPendingReset(null)}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete Version"
          message={`Delete "${pendingDelete.name}" and all of its documents? This can't be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}

      {showNewDoc ? (
        <NewDocumentModal onCreate={handleCreateDoc} onCancel={() => setShowNewDoc(false)} />
      ) : null}

      {pendingDeleteDoc ? (
        <ConfirmDialog
          title="Delete Document"
          message={`Remove "${pendingDeleteDoc.name}" from the pipeline? Its saved content in every version will no longer be reachable.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDeleteDoc}
          onCancel={() => setPendingDeleteDoc(null)}
        />
      ) : null}
    </div>
  )
}
