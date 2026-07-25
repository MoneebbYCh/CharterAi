import { PipelineHeader } from '../components/layout/PipelineChrome'
import { DocumentCanvas } from '../components/canvas/DocumentCanvas'
import { useCharterDocument } from '../hooks/useCharterDocument'
import type { View } from '../hooks/useViewState'

interface ProjectCharterPageProps {
  onNavigate: (view: View) => void
  goHome: () => void
}

export function ProjectCharterPage({ onNavigate, goHome }: ProjectCharterPageProps) {
  const {
    blocks,
    setBlocks,
    saveNow,
    lastSaved,
    isDirty,
    ready,
    externalRevision,
    externalBlocks,
  } = useCharterDocument()

  const handleExport = () => {
    saveNow()
    window.alert('PDF export for the canvas document is coming soon. Your draft is saved.')
  }

  const saveLabel = isDirty
    ? 'Saving…'
    : lastSaved
      ? `Saved ${lastSaved.toLocaleTimeString()}`
      : 'Save Draft'

  return (
    <div className="charter-canvas-page flex flex-col h-screen overflow-hidden">
      <PipelineHeader
        onHome={goHome}
        onExport={handleExport}
        onSave={saveNow}
        saveLabel={saveLabel}
      />

      {/* Infinite-scroll document surface — Notion-style page */}
      <div className="charter-canvas-scroll flex-1 min-h-0 overflow-y-auto">
        <div className="charter-canvas-sheet">
          <header className="charter-canvas-masthead">
            <p className="charter-canvas-kicker">Phase 01 · Authorization</p>
            <h1 className="charter-canvas-title">Project Charter</h1>
            <p className="charter-canvas-subtitle">
              Formally authorize the work: purpose, measurable success, explicit scope
              boundaries, ownership, and sign-off.
            </p>
          </header>

          {!ready ? (
            <p className="charter-canvas-loading">Loading canvas…</p>
          ) : (
            <DocumentCanvas
              initialBlocks={blocks}
              onChange={setBlocks}
              externalRevision={externalRevision}
              externalBlocks={externalBlocks}
            />
          )}

          {/* Scroll past the last block — the “infinite” breathing room */}
          <div className="charter-canvas-tail" aria-hidden>
            <button
              type="button"
              className="charter-canvas-proceed"
              onClick={() => {
                saveNow()
                onNavigate({ page: 'prd', section: 'overview' })
              }}
            >
              Proceed to PRD →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
