import { useMemo, useState } from 'react'
import type { BlockNoteBlock } from '../../types/document'
import {
  CANVAS_INSERT_ITEMS,
  focusCanvasBlock,
  removeCanvasBlockById,
  type CanvasEditor,
} from './canvasInsert'
import { buildCanvasOutline, outlineTypeBadge } from './canvasOutline'

interface CanvasToolsSidebarProps {
  editor: CanvasEditor | null
  blocks: BlockNoteBlock[]
  phaseTitle: string
  collapsed: boolean
  onToggleCollapsed: () => void
}

export function CanvasToolsSidebar({
  editor,
  blocks,
  phaseTitle,
  collapsed,
  onToggleCollapsed,
}: CanvasToolsSidebarProps) {
  const [tab, setTab] = useState<'insert' | 'outline'>('insert')

  // Prefer the live editor document (always has block ids) over persisted JSON.
  const outlineSource = useMemo(() => {
    if (editor?.document?.length) {
      return editor.document as unknown as BlockNoteBlock[]
    }
    return blocks
  }, [editor, blocks])

  const outline = useMemo(() => buildCanvasOutline(outlineSource), [outlineSource])

  const shapes = CANVAS_INSERT_ITEMS.filter((i) => i.group === 'Shapes')
  const textItems = CANVAS_INSERT_ITEMS.filter((i) => i.group === 'Text')

  if (collapsed) {
    return (
      <aside className="canvas-tools canvas-tools--collapsed" aria-label="Document tools">
        <button
          type="button"
          className="canvas-tools-expand"
          onClick={onToggleCollapsed}
          title="Show document tools"
        >
          Tools
        </button>
      </aside>
    )
  }

  return (
    <aside className="canvas-tools" aria-label="Document tools">
      <header className="canvas-tools-header">
        <div>
          <p className="canvas-tools-kicker">Document tools</p>
          <h2 className="canvas-tools-title">{phaseTitle}</h2>
        </div>
        <button
          type="button"
          className="canvas-tools-collapse"
          onClick={onToggleCollapsed}
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          ‹
        </button>
      </header>

      <div className="canvas-tools-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'insert'}
          className={`canvas-tools-tab${tab === 'insert' ? ' is-active' : ''}`}
          onClick={() => setTab('insert')}
        >
          Insert
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'outline'}
          className={`canvas-tools-tab${tab === 'outline' ? ' is-active' : ''}`}
          onClick={() => setTab('outline')}
        >
          Outline
        </button>
      </div>

      <div className="canvas-tools-body">
        {tab === 'insert' ? (
          <>
            <section className="canvas-tools-section">
              <h3 className="canvas-tools-section-title">Shapes</h3>
              <p className="canvas-tools-section-hint">
                Insert at the cursor — same as typing <kbd>/</kbd> in the page.
              </p>
              <div className="canvas-tools-grid">
                {shapes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="canvas-tools-insert"
                    disabled={!editor}
                    title={item.description}
                    onClick={() => editor && item.insert(editor)}
                  >
                    <span className="canvas-tools-insert-title">{item.title}</span>
                    <span className="canvas-tools-insert-desc">{item.description}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="canvas-tools-section">
              <h3 className="canvas-tools-section-title">Text</h3>
              <div className="canvas-tools-grid canvas-tools-grid--compact">
                {textItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="canvas-tools-insert canvas-tools-insert--compact"
                    disabled={!editor}
                    title={item.description}
                    onClick={() => editor && item.insert(editor)}
                  >
                    <span className="canvas-tools-insert-title">{item.title}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="canvas-tools-section">
            <h3 className="canvas-tools-section-title">On this page</h3>
            <p className="canvas-tools-section-hint">
              Jump to a block, or remove shapes from the document.
            </p>
            {outline.length === 0 ? (
              <p className="canvas-tools-empty">Nothing in the outline yet — start writing or insert a shape.</p>
            ) : (
              <ul className="canvas-tools-outline">
                {outline.map((entry) => (
                  <li key={entry.id} className={`canvas-tools-outline-item kind-${entry.kind}`}>
                    <button
                      type="button"
                      className="canvas-tools-outline-jump"
                      disabled={!editor}
                      onClick={() => editor && focusCanvasBlock(editor, entry.id)}
                      title="Jump to block"
                    >
                      <span className="canvas-tools-outline-badge">{outlineTypeBadge(entry.type)}</span>
                      <span className="canvas-tools-outline-label">{entry.label}</span>
                    </button>
                    {entry.kind === 'shape' ? (
                      <button
                        type="button"
                        className="canvas-tools-outline-delete"
                        disabled={!editor}
                        title="Delete block"
                        onClick={() => editor && removeCanvasBlockById(editor, entry.id)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </aside>
  )
}
