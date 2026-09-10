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
  listPipelineDocumentTypes,
  type DocumentTypeMeta,
} from '../data/documentTypes'
import {
  documentHasContent,
  toCanvasDocument,
  type CanvasDocument,
} from '../types/document'
import { loadProfile, profileInitials } from '../utils/profile'
import { getVscodeApi } from '../utils/vscodeApi'
import { storageKeyFor, hasWorkspaceScope } from '../utils/workspaceScope'

interface HomePageProps {
  onNavigate: (view: View) => void
  /** Send a chat message from the Home ask bar (opens the side panel). */
  onAsk?: (text: string) => void
  isAsking?: boolean
  /** Bumped when the extension pushes updated doc types. */
  docTypesRev?: number
  /** No folder is open in VS Code — show a notice instead of the pipeline. */
  noWorkspace?: boolean
}

function loadSavedDoc(phaseId: string): { doc: CanvasDocument | null; hasDraft: boolean } {
  try {
    const meta = getDocumentType(phaseId)
    if (!meta) return { doc: null, hasDraft: false }
    const raw =
      localStorage.getItem(storageKeyFor(meta.storageKey)) ??
      (meta.legacyStorageKey ? localStorage.getItem(meta.legacyStorageKey) : null)
    if (!raw) return { doc: null, hasDraft: false }
    const doc = toCanvasDocument(JSON.parse(raw))
    return { doc, hasDraft: documentHasContent(doc) }
  } catch {
    return { doc: null, hasDraft: false }
  }
}

/** Wipe all pipeline documents on disk (registry + canvas files + agent IRs). */
function clearAllDocs() {
  const vscode = getVscodeApi()
  vscode?.postMessage({ type: 'documentResetAll' })
  for (const meta of listDocumentTypes()) {
    try {
      localStorage.removeItem(storageKeyFor(meta.storageKey))
      if (!hasWorkspaceScope() && meta.legacyStorageKey) {
        localStorage.removeItem(meta.legacyStorageKey)
      }
    } catch {
      /* ignore storage errors */
    }
  }
}

const ASK_HINTS = [
  'What docs does this project need?',
  'Add an ADR and API contract',
]

export function HomePage({
  onNavigate,
  onAsk,
  isAsking,
  docTypesRev: docTypesRevProp = 0,
  noWorkspace = false,
}: HomePageProps) {
  const [profile] = useState(() => loadProfile())

  const [pendingReset, setPendingReset] = useState(false)
  const [docTypesRevLocal, setDocTypesRev] = useState(0)
  const docTypesRev = docTypesRevLocal + docTypesRevProp
  const [showNewDoc, setShowNewDoc] = useState(false)
  const [pendingDeleteDoc, setPendingDeleteDoc] = useState<DocumentTypeMeta | null>(null)
  const [workspace, setWorkspace] = useState<{ path: string; name: string } | null>(null)
  const [homeAsk, setHomeAsk] = useState('')

  const docTypes = useMemo(() => listPipelineDocumentTypes(), [docTypesRev])
  const hasDraft = useMemo(() => {
    return listPipelineDocumentTypes().some((meta) => loadSavedDoc(meta.id).hasDraft)
  }, [docTypesRev])

  const firstDocId = docTypes[0]?.id ?? null

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

  const confirmReset = () => {
    clearAllDocs()
    setPendingReset(false)
    if (firstDocId) onNavigate({ page: firstDocId })
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

  const submitAsk = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isAsking || !onAsk) return
    onAsk(trimmed)
    setHomeAsk('')
  }

  const workspaceLabel = workspace?.name
    ?? (getVscodeApi() ? 'Detecting…' : 'Local preview')

  return (
    <div className="home-desktop h-screen w-full overflow-hidden flex flex-col dither-bg">
      {noWorkspace ? (
        <div className="home-mac-window flex-1 min-h-0 m-2 md:m-3 border-2 border-on-background bg-white mac-window-shadow flex flex-col items-center justify-center gap-5 p-8 text-center">
          <BrandMark size="lg" markOnly className="home-empty-mascot" />
          <h2
            className="text-xl font-bold text-on-background"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Open a folder to get started
          </h2>
          <p className="text-sm text-on-surface-variant max-w-sm" style={{ fontFamily: 'var(--font-body)' }}>
            Charter needs a project folder. Open one in VS Code, then run Charter Ai again.
          </p>
        </div>
      ) : (
        <div className="home-mac-window flex-1 min-h-0 m-2 md:m-3 border-2 border-on-background bg-white mac-window-shadow flex flex-col">
          <header className="home-chrome shrink-0">
            <div className="mac-striped-header home-chrome-stripe" aria-hidden />
            <BrandMark size="sm" />
            <div className="mac-striped-header home-chrome-stripe" aria-hidden />
            <button
              type="button"
              className="home-chrome-profile"
              onClick={() => onNavigate({ page: 'profile' })}
              title="Open profile"
              aria-label={`Open profile for ${profile.name}`}
            >
              <span className="home-chrome-profile-avatar" aria-hidden>
                {profileInitials(profile.name)}
              </span>
              <span className="home-chrome-profile-meta">
                <span className="home-chrome-profile-name">{profile.name}</span>
                <span className="home-chrome-profile-role">{profile.role}</span>
              </span>
            </button>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <section className="home-hero" aria-label="Ask Charter Ai">
              <div className="home-hero-mascot" aria-hidden>
                <BrandMark size="lg" markOnly />
              </div>
              <div className="home-hero-copy">
                <p className="home-hero-line">
                  {hasDraft ? 'Pick up where you left off — or ask for more.' : 'What should we document?'}
                </p>
                <form
                  className="home-ask-bar"
                  onSubmit={(e) => {
                    e.preventDefault()
                    submitAsk(homeAsk)
                  }}
                >
                  <input
                    className="home-ask-input"
                    type="text"
                    value={homeAsk}
                    onChange={(e) => setHomeAsk(e.target.value)}
                    placeholder="Ask about docs for this repo…"
                    disabled={Boolean(isAsking) || !onAsk}
                    aria-label="Ask Charter Ai"
                  />
                  <button
                    type="submit"
                    className="home-ask-submit border-2 border-on-background bg-primary text-on-primary font-bold px-5 py-2 text-sm outset-button hover:opacity-90 disabled:opacity-40"
                    style={{ fontFamily: 'var(--font-label)' }}
                    disabled={!homeAsk.trim() || Boolean(isAsking) || !onAsk}
                  >
                    {isAsking ? 'Working…' : 'Ask'}
                  </button>
                </form>
                <div className="home-ask-hints">
                  {ASK_HINTS.map((hint) => (
                    <button
                      key={hint}
                      type="button"
                      className="home-ask-chip"
                      disabled={Boolean(isAsking) || !onAsk}
                      onClick={() => submitAsk(hint)}
                    >
                      {hint}
                    </button>
                  ))}
                  {hasDraft && firstDocId ? (
                    <button
                      type="button"
                      className="home-ask-chip home-ask-chip--accent"
                      onClick={() => onNavigate({ page: firstDocId })}
                    >
                      Resume documents
                    </button>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="home-docs" aria-label="Documents">
              <div className="home-docs-header">
                <h2 className="home-docs-title">Documents</h2>
                <div className="home-docs-actions">
                  <button
                    type="button"
                    className="home-docs-browse"
                    onClick={() => onNavigate({ page: 'templates' })}
                  >
                    Browse Templates
                  </button>
                  {hasDraft ? (
                    <button
                      type="button"
                      className="home-docs-link home-docs-link--danger"
                      onClick={() => setPendingReset(true)}
                      title="Clear all documents"
                    >
                      Reset
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="home-docs-grid">
                {docTypes.length === 0 ? (
                  <div className="home-docs-empty">
                    <p>Nothing here yet — ask above, or add one.</p>
                  </div>
                ) : null}
                {docTypes.map((doc) => (
                  <div key={doc.id} className="home-doc-card group">
                    <button
                      type="button"
                      onClick={() => onNavigate({ page: doc.id })}
                      className="home-doc-card-main"
                    >
                      <span className="material-symbols-outlined home-doc-card-icon">
                        {doc.icon}
                      </span>
                      <span className="home-doc-card-title">{doc.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPendingDeleteDoc(doc)
                      }}
                      className="home-doc-card-delete"
                      title={`Delete "${doc.title}"`}
                      aria-label={`Delete ${doc.title}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setShowNewDoc(true)}
                  className="home-doc-new"
                  title="Add a document"
                >
                  <span className="material-symbols-outlined">add</span>
                  <span>New</span>
                </button>
              </div>
            </section>
          </div>

          <footer
            className="home-workspace-footer shrink-0"
            title={workspace?.path ?? undefined}
          >
            <span className="home-workspace-footer-label">Opened in workspace</span>
            <span className="home-workspace-footer-sep" aria-hidden>
              ·
            </span>
            <span className="home-workspace-footer-name">{workspaceLabel}</span>
            {workspace?.path ? (
              <span className="home-workspace-footer-path">{workspace.path}</span>
            ) : null}
          </footer>
        </div>
      )}

      {pendingReset ? (
        <ConfirmDialog
          title="Reset Documents"
          message="Clear all documents back to blank? This can't be undone."
          confirmLabel="Reset"
          danger
          onConfirm={confirmReset}
          onCancel={() => setPendingReset(false)}
        />
      ) : null}

      {showNewDoc ? (
        <NewDocumentModal onCreate={handleCreateDoc} onCancel={() => setShowNewDoc(false)} />
      ) : null}

      {pendingDeleteDoc ? (
        <ConfirmDialog
          title="Delete Document"
          message={`Remove "${pendingDeleteDoc.title}" from the pipeline? Its saved content will no longer be reachable.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDeleteDoc}
          onCancel={() => setPendingDeleteDoc(null)}
        />
      ) : null}
    </div>
  )
}
