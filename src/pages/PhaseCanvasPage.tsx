import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PipelineHeader } from '../components/layout/PipelineChrome'
import { DocumentCanvas } from '../components/canvas/DocumentCanvas'
import { CanvasErrorBoundary } from '../components/canvas/CanvasErrorBoundary'
import { CanvasToolsSidebar } from '../components/canvas/CanvasToolsSidebar'
import { CanvasNavRail } from '../components/canvas/CanvasNavRail'
import type { CanvasEditor } from '../components/canvas/schema'
import {
  parseTableBorder,
  serializeTableBorder,
  tableBorderAnchorKey,
  tableBorderCssVars,
  type TableBorderStyle,
} from '../components/canvas/tableBorderStyle'
import { usePhaseDocument } from '../hooks/usePhaseDocument'
import type { View } from '../hooks/useViewState'
import { documentHasContent, documentHasOwnHeading } from '../types/document'
import { getMarketplaceTemplate } from '../data/marketplaceTemplates'
import { getDocumentType } from '../data/documentTypes'
import { extractManifestFromBlocks } from '../data/templates/extractManifestFromBlocks'
import { getVscodeApi } from '../utils/vscodeApi'
import { canvasToMarkdown } from '../utils/exportMarkdown'
import { LoadingSplash } from '../components/BrandMark'

interface PhaseCanvasPageProps {
  phaseId: string
  onNavigate: (view: View) => void
  goHome: () => void
  /** Marketplace template id to apply once the canvas is ready (one-shot). */
  seedFromMarketplaceId?: string
  /** Templates → Create custom: canvas draft with Continue-to-template action. */
  authoringTemplate?: boolean
}

export function PhaseCanvasPage({
  phaseId,
  onNavigate,
  goHome,
  seedFromMarketplaceId,
  authoringTemplate = false,
}: PhaseCanvasPageProps) {
  // In-app notice — webview window.alert is unreliable even with allowModals.
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 3500)
    return () => clearTimeout(t)
  }, [notice])

  // N7: an external replacement landed while the user was editing — surface it.
  const handleDraftReplaced = useCallback((message: string) => {
    setNotice(message)
  }, [])

  const {
    meta,
    doc,
    blocks,
    setBlocks,
    patchAnchors,
    applyExternalDocument,
    saveNow,
    reset,
    lastSaved,
    isDirty,
    ready,
    externalRevision,
    externalBlocks,
  } = usePhaseDocument(phaseId, { onReplaced: handleDraftReplaced })

  const tableBorder = useMemo(
    () => parseTableBorder(doc.anchors?.[tableBorderAnchorKey()]),
    [doc.anchors],
  )
  const tableBorderStyle = useMemo(() => tableBorderCssVars(tableBorder), [tableBorder])
  const handleTableBorderChange = useCallback(
    (next: TableBorderStyle) => {
      patchAnchors({ [tableBorderAnchorKey()]: serializeTableBorder(next) })
    },
    [patchAnchors],
  )

  /** Survives tab switches — stamped on the draft when Create custom opens it. */
  const isAuthoringTemplate =
    authoringTemplate || doc.anchors?.templateAuthoring === '1'

  const [editor, setEditor] = useState<CanvasEditor | null>(null)
  const [toolsCollapsed, setToolsCollapsed] = useState(false)
  // Bumped when the doc is renamed from the header strip.
  const [titleRev, setTitleRev] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  // Keep masthead / sidebar title in sync after header rename.
  const displayTitle = useMemo(() => {
    void titleRev
    return getDocumentType(phaseId)?.title ?? meta.title
  }, [phaseId, meta.title, titleRev])

  // One-shot: open a marketplace template into this newly created document.
  const seededRef = useRef(false)
  useEffect(() => {
    if (!ready || !seedFromMarketplaceId || seededRef.current) return
    const market = getMarketplaceTemplate(seedFromMarketplaceId)
    if (!market) return
    seededRef.current = true
    applyExternalDocument(
      {
        version: 1,
        kind: 'blocknote',
        blocks: market.build(),
        anchors: { templateId: market.id },
      },
      { persistToDisk: true },
    )
    onNavigate({ page: phaseId })
  }, [ready, seedFromMarketplaceId, applyExternalDocument, onNavigate, phaseId])

  const handleEditorReady = useCallback((next: CanvasEditor | null) => {
    setEditor(next)
  }, [])

  const handleExport = () => {
    saveNow()
    const source = editor?.document?.length
      ? (editor.document as unknown as typeof blocks)
      : blocks
    const docForExport = {
      version: 1 as const,
      kind: 'blocknote' as const,
      blocks: source,
      anchors: {},
    }
    if (!documentHasContent(docForExport)) {
      setNotice('Add some content to this document before exporting.')
      return
    }
    getVscodeApi()?.postMessage({
      type: 'exportMarkdown',
      phase: phaseId,
      markdown: canvasToMarkdown(docForExport),
      suggestedName: displayTitle,
    })
  }

  const handleContinueToTemplate = () => {
    saveNow()
    const source = editor?.document?.length
      ? (editor.document as unknown as typeof blocks)
      : blocks
    const extracted = extractManifestFromBlocks(source)
    const docMeta = getDocumentType(phaseId)
    onNavigate({
      page: 'template-builder',
      templateBuilderPrefill: {
        source: 'canvas',
        name: extracted.suggestedTitle || displayTitle,
        icon: docMeta?.icon || 'edit_note',
        sections: extracted.sections,
        hadHeadings: extracted.hadHeadings && extracted.sections.length > 0,
        returnPhaseId: phaseId,
        returnAuthoringTemplate: true,
      },
    })
  }

  const saveLabel = isDirty
    ? 'Saving…'
    : lastSaved
      ? `Saved ${lastSaved.toLocaleTimeString()}`
      : 'Save Draft'

  const phasePad = String(meta.number).padStart(2, '0')
  const showPhaseMasthead = useMemo(() => !documentHasOwnHeading(blocks), [blocks])

  return (
    <div className="charter-canvas-page flex flex-col h-screen overflow-hidden">
      {notice ? (
        <div
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 border-2 border-on-background bg-secondary-container px-4 py-2 text-sm font-bold text-on-background"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {notice}
        </div>
      ) : null}
      {isAuthoringTemplate ? (
        <div className="tmpl-author-bar" role="region" aria-label="Save custom template">
          <div className="tmpl-author-bar-copy">
            <p className="tmpl-author-bar-title">Custom template draft</p>
            <p className="tmpl-author-bar-hint">
              Write headings, diagrams, and sections like a normal doc. When you&apos;re ready, review
              the outline and save it to the gallery — Save Draft only keeps this working copy.
            </p>
          </div>
          <button
            type="button"
            className="tmpl-author-bar-cta outset-button border-2 border-on-background bg-primary text-on-primary font-bold px-4 py-2 text-sm shrink-0"
            style={{ fontFamily: 'var(--font-label)' }}
            onClick={handleContinueToTemplate}
          >
            Review & save template →
          </button>
        </div>
      ) : null}
      <PipelineHeader
        onHome={goHome}
        onExport={handleExport}
        onSave={saveNow}
        onSaveAsTemplate={isAuthoringTemplate ? handleContinueToTemplate : undefined}
        saveAsTemplateLabel="Review & save template"
        saveLabel={saveLabel}
        currentPhaseId={phaseId}
        onNavigate={onNavigate}
        onDocRenamed={() => setTitleRev((n) => n + 1)}
      />

      <div className="charter-canvas-workspace">
        <CanvasToolsSidebar
          editor={editor}
          phaseTitle={displayTitle}
          collapsed={toolsCollapsed}
          onToggleCollapsed={() => setToolsCollapsed((v) => !v)}
          tableBorder={tableBorder}
          onTableBorderChange={handleTableBorderChange}
        />

        <div className="charter-canvas-main">
          <div ref={scrollRef} className="charter-canvas-scroll flex-1 min-h-0 overflow-y-auto">
            <div className="charter-canvas-sheet">
              {showPhaseMasthead ? (
                <header className="charter-canvas-masthead">
                  <p className="charter-canvas-kicker">{meta.kicker || `Phase ${phasePad}`}</p>
                  <h1 className="charter-canvas-title">{displayTitle}</h1>
                  <p className="charter-canvas-subtitle">{meta.subtitle}</p>
                </header>
              ) : null}

              {!ready ? (
                <LoadingSplash message="Loading canvas…" />
              ) : (
                <CanvasErrorBoundary onReset={reset}>
                  <DocumentCanvas
                    initialBlocks={blocks}
                    onChange={setBlocks}
                    externalRevision={externalRevision}
                    externalBlocks={externalBlocks}
                    editorKey={phaseId}
                    onEditorReady={handleEditorReady}
                    tableBorderStyle={tableBorderStyle}
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

          <CanvasNavRail editor={editor} blocks={blocks} scrollRef={scrollRef} />
        </div>
      </div>
    </div>
  )
}
