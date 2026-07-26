import { useCallback, useState } from 'react'
import { PipelineHeader } from '../components/layout/PipelineChrome'
import { DocumentCanvas } from '../components/canvas/DocumentCanvas'
import { CanvasErrorBoundary } from '../components/canvas/CanvasErrorBoundary'
import { CanvasToolsSidebar } from '../components/canvas/CanvasToolsSidebar'
import type { CanvasEditor } from '../components/canvas/schema'
import { usePhaseDocument } from '../hooks/usePhaseDocument'
import type { CanvasPhaseId } from '../data/canvasPhases'
import type { View } from '../hooks/useViewState'

interface PhaseCanvasPageProps {
  phaseId: CanvasPhaseId
  onNavigate: (view: View) => void
  goHome: () => void
}

export function PhaseCanvasPage({ phaseId, onNavigate, goHome }: PhaseCanvasPageProps) {
  const {
    meta,
    blocks,
    setBlocks,
    saveNow,
    reset,
    lastSaved,
    isDirty,
    ready,
    externalRevision,
    externalBlocks,
  } = usePhaseDocument(phaseId)

  const [editor, setEditor] = useState<CanvasEditor | null>(null)
  const [toolsCollapsed, setToolsCollapsed] = useState(false)

  const handleEditorReady = useCallback((next: CanvasEditor | null) => {
    setEditor(next)
  }, [])

  const handleExport = () => {
    saveNow()
    window.alert('PDF export for canvas documents is coming soon. Your draft is saved.')
  }

  const saveLabel = isDirty
    ? 'Saving…'
    : lastSaved
      ? `Saved ${lastSaved.toLocaleTimeString()}`
      : 'Save Draft'

  const phasePad = String(meta.number).padStart(2, '0')

  return (
    <div className="charter-canvas-page flex flex-col h-screen overflow-hidden">
      <PipelineHeader
        onHome={goHome}
        onExport={handleExport}
        onSave={saveNow}
        saveLabel={saveLabel}
        currentPhaseId={phaseId}
        onNavigate={onNavigate}
      />

      <div className="charter-canvas-workspace">
        <CanvasToolsSidebar
          editor={editor}
          blocks={blocks}
          phaseTitle={meta.title}
          collapsed={toolsCollapsed}
          onToggleCollapsed={() => setToolsCollapsed((v) => !v)}
        />

        <div className="charter-canvas-scroll flex-1 min-h-0 overflow-y-auto">
          <div className="charter-canvas-sheet">
            <header className="charter-canvas-masthead">
              <p className="charter-canvas-kicker">{meta.kicker || `Phase ${phasePad}`}</p>
              <h1 className="charter-canvas-title">{meta.title}</h1>
              <p className="charter-canvas-subtitle">{meta.subtitle}</p>
            </header>

            {!ready ? (
              <p className="charter-canvas-loading">Loading canvas…</p>
            ) : (
              <CanvasErrorBoundary onReset={reset}>
                <DocumentCanvas
                  initialBlocks={blocks}
                  onChange={setBlocks}
                  externalRevision={externalRevision}
                  externalBlocks={externalBlocks}
                  editorKey={`${phaseId}-${externalRevision}`}
                  onEditorReady={handleEditorReady}
                />
              </CanvasErrorBoundary>
            )}

            {meta.next ? (
              <div className="charter-canvas-tail">
                <button
                  type="button"
                  className="charter-canvas-proceed"
                  onClick={() => {
                    saveNow()
                    onNavigate({ page: meta.next!.page })
                  }}
                >
                  {meta.next.label}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
