import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { useActiveStyles, useSelectedBlocks } from '@blocknote/react'
import {
  CANVAS_INSERT_ITEMS,
  insertDiagram,
  type CanvasEditor,
} from './canvasInsert'
import { TableSizePicker } from './TableSizePicker'
import { TableBorderControls } from './TableBorderControls'
import type { TableBorderStyle } from './tableBorderStyle'
import { DEFAULT_DIAGRAM_CODE } from './blocks/Diagram'
import { MermaidEditorDialog } from './MermaidEditorDialog'
import {
  FONT_FAMILIES,
  FONT_SIZES,
  TEXT_COLOR_KEYS,
  colorSwatch,
} from './textStyles'

/** Tiny flowchart glyph so the insert control reads as Mermaid at a glance. */
function MermaidGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 32"
      width="40"
      height="32"
      aria-hidden
      focusable="false"
    >
      <rect x="1" y="1" width="14" height="9" rx="2" fill="#f4f4f5" stroke="#141418" strokeWidth="1.5" />
      <rect x="25" y="1" width="14" height="9" rx="2" fill="#f4f4f5" stroke="#141418" strokeWidth="1.5" />
      <rect x="13" y="21" width="14" height="9" rx="2" fill="#141418" stroke="#141418" strokeWidth="1.5" />
      <path d="M8 10v5h12" fill="none" stroke="#141418" strokeWidth="1.5" />
      <path d="M32 10v5H20" fill="none" stroke="#141418" strokeWidth="1.5" />
      <path d="M20 15v6" fill="none" stroke="#141418" strokeWidth="1.5" />
      <path d="M20 21l-2.4-2.8M20 21l2.4-2.8" fill="none" stroke="#141418" strokeWidth="1.4" />
      <text
        x="20"
        y="27.2"
        textAnchor="middle"
        fill="#fff"
        fontSize="5.5"
        fontFamily="var(--font-label, system-ui)"
        fontWeight="700"
      >
        m
      </text>
    </svg>
  )
}

interface CanvasToolsSidebarProps {
  editor: CanvasEditor | null
  phaseTitle: string
  collapsed: boolean
  onToggleCollapsed: () => void
  tableBorder: TableBorderStyle
  onTableBorderChange: (next: TableBorderStyle) => void
}

type Align = 'left' | 'center' | 'right' | 'justify'
type OpenMenu = 'font' | 'size' | null

/** Keep editor selection when clicking toolbar controls (VS Code webview-safe). */
function keepSelection(e: MouseEvent) {
  e.preventDefault()
}

function FormatMenu({
  id,
  label,
  display,
  open,
  onToggle,
  children,
}: {
  id: string
  label: string
  display: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className={`canvas-fmt-menu${open ? ' is-open' : ''}`}>
      <button
        type="button"
        id={id}
        className="canvas-fmt-menu-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onMouseDown={keepSelection}
        onClick={onToggle}
      >
        <span className="canvas-fmt-menu-value">{display}</span>
        <span className="canvas-fmt-menu-caret" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div className="canvas-fmt-menu-panel" role="listbox" aria-label={label} onMouseDown={keepSelection}>
          {children}
        </div>
      ) : null}
    </div>
  )
}

function FormatPanel({ editor }: { editor: CanvasEditor }) {
  const styles = useActiveStyles(editor)
  const selectedBlocks = useSelectedBlocks(editor)
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)

  const alignment = useMemo((): Align => {
    const block = selectedBlocks[0]
    if (block?.type === 'diagram') {
      const value = (block.props as { align?: string } | undefined)?.align
      if (value === 'left' || value === 'center' || value === 'right') return value
      return 'center'
    }
    const value = (block?.props as { textAlignment?: string } | undefined)?.textAlignment
    if (value === 'center' || value === 'right' || value === 'justify') return value
    return 'left'
  }, [selectedBlocks])

  useEffect(() => {
    if (!openMenu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openMenu])

  const focusAfter = useCallback(() => {
    queueMicrotask(() => editor.focus())
  }, [editor])

  const toggle = useCallback(
    (key: 'bold' | 'italic' | 'underline' | 'strike' | 'code') => {
      editor.toggleStyles({ [key]: true })
      focusAfter()
    },
    [editor, focusAfter],
  )

  const setTextColor = useCallback(
    (color: string) => {
      if (color === 'default') {
        const current = styles.textColor
        if (current) editor.removeStyles({ textColor: current })
        else editor.removeStyles({ textColor: 'default' })
      } else {
        editor.addStyles({ textColor: color })
      }
      focusAfter()
    },
    [editor, focusAfter, styles.textColor],
  )

  const setHighlight = useCallback(
    (color: string) => {
      if (color === 'default') {
        const current = styles.backgroundColor
        if (current) editor.removeStyles({ backgroundColor: current })
        else editor.removeStyles({ backgroundColor: 'default' })
      } else {
        editor.addStyles({ backgroundColor: color })
      }
      focusAfter()
    },
    [editor, focusAfter, styles.backgroundColor],
  )

  const setFontFamily = useCallback(
    (value: string) => {
      const current = editor.getActiveStyles().fontFamily as string | undefined
      if (!value) {
        if (current) editor.removeStyles({ fontFamily: current })
      } else {
        editor.addStyles({ fontFamily: value })
      }
      setOpenMenu(null)
      focusAfter()
    },
    [editor, focusAfter],
  )

  const setFontSize = useCallback(
    (value: string) => {
      const current = editor.getActiveStyles().fontSize as string | undefined
      if (!value) {
        if (current) editor.removeStyles({ fontSize: current })
      } else {
        editor.addStyles({ fontSize: value })
      }
      setOpenMenu(null)
      focusAfter()
    },
    [editor, focusAfter],
  )

  const setAlign = useCallback(
    (textAlignment: Align) => {
      for (const block of selectedBlocks) {
        if (block.type === 'diagram') {
          const align = textAlignment === 'justify' ? 'center' : textAlignment
          editor.updateBlock(block, { props: { align } })
          continue
        }
        const props = block.props as Record<string, unknown> | undefined
        if (!props || !('textAlignment' in props)) continue
        editor.updateBlock(block, { props: { textAlignment } })
      }
      focusAfter()
    },
    [editor, focusAfter, selectedBlocks],
  )

  const insertLink = useCallback(() => {
    const url = window.prompt('Link URL', editor.getSelectedLinkUrl() || 'https://')
    if (url === null) return
    const trimmed = url.trim()
    if (!trimmed) {
      editor.deleteLink()
    } else {
      editor.createLink(trimmed)
    }
    focusAfter()
  }, [editor, focusAfter])

  const clearFormatting = useCallback(() => {
    const active = editor.getActiveStyles() as Record<string, unknown>
    for (const [key, value] of Object.entries(active)) {
      if (value === true) editor.removeStyles({ [key]: true } as never)
      else if (typeof value === 'string') editor.removeStyles({ [key]: value } as never)
    }
    focusAfter()
  }, [editor, focusAfter])

  const activeTextColor = (styles.textColor as string | undefined) || 'default'
  const activeHighlight = (styles.backgroundColor as string | undefined) || 'default'
  const activeFont = (styles.fontFamily as string | undefined) || ''
  const activeSize = (styles.fontSize as string | undefined) || ''
  const activeFontLabel =
    FONT_FAMILIES.find((f) => f.value === activeFont)?.label ?? (activeFont ? 'Custom' : 'Default')
  const activeSizeLabel = activeSize ? activeSize.replace('px', '') : 'Default'

  return (
    <section className="canvas-tools-section">
      <h3 className="canvas-tools-section-title">Format</h3>

      <div className="canvas-fmt-group">
        <span className="canvas-fmt-label">Style</span>
        <div className="canvas-fmt-row" onMouseDown={keepSelection}>
          <button
            type="button"
            className={`canvas-fmt-btn${styles.bold ? ' is-active' : ''}`}
            title="Bold"
            aria-pressed={!!styles.bold}
            onClick={() => toggle('bold')}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={`canvas-fmt-btn${styles.italic ? ' is-active' : ''}`}
            title="Italic"
            aria-pressed={!!styles.italic}
            onClick={() => toggle('italic')}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className={`canvas-fmt-btn${styles.underline ? ' is-active' : ''}`}
            title="Underline"
            aria-pressed={!!styles.underline}
            onClick={() => toggle('underline')}
          >
            <span className="canvas-fmt-u">U</span>
          </button>
          <button
            type="button"
            className={`canvas-fmt-btn${styles.strike ? ' is-active' : ''}`}
            title="Strikethrough"
            aria-pressed={!!styles.strike}
            onClick={() => toggle('strike')}
          >
            <span className="canvas-fmt-s">S</span>
          </button>
          <button
            type="button"
            className={`canvas-fmt-btn${styles.code ? ' is-active' : ''}`}
            title="Inline code"
            aria-pressed={!!styles.code}
            onClick={() => toggle('code')}
          >
            {'</>'}
          </button>
          <button type="button" className="canvas-fmt-btn" title="Insert link" onClick={insertLink}>
            Link
          </button>
        </div>
      </div>

      <div className="canvas-fmt-group">
        <span className="canvas-fmt-label">Align</span>
        <div className="canvas-fmt-row" onMouseDown={keepSelection}>
          {(
            [
              ['left', 'Left'],
              ['center', 'Center'],
              ['right', 'Right'],
              ['justify', 'Justify'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`canvas-fmt-btn canvas-fmt-btn--grow${alignment === value ? ' is-active' : ''}`}
              title={label}
              aria-pressed={alignment === value}
              onClick={() => setAlign(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="canvas-fmt-group">
        <span className="canvas-fmt-label">Font</span>
        <FormatMenu
          id="canvas-fmt-font"
          label="Font"
          display={activeFontLabel}
          open={openMenu === 'font'}
          onToggle={() => setOpenMenu((m) => (m === 'font' ? null : 'font'))}
        >
          {FONT_FAMILIES.map((f) => (
            <button
              key={f.label}
              type="button"
              role="option"
              aria-selected={activeFont === f.value}
              className={`canvas-fmt-menu-option${activeFont === f.value ? ' is-active' : ''}`}
              style={{ fontFamily: f.value || undefined }}
              onClick={() => setFontFamily(f.value)}
            >
              {f.label}
            </button>
          ))}
        </FormatMenu>
      </div>

      <div className="canvas-fmt-group">
        <span className="canvas-fmt-label">Size</span>
        <FormatMenu
          id="canvas-fmt-size"
          label="Size"
          display={activeSizeLabel}
          open={openMenu === 'size'}
          onToggle={() => setOpenMenu((m) => (m === 'size' ? null : 'size'))}
        >
          <button
            type="button"
            role="option"
            aria-selected={!activeSize}
            className={`canvas-fmt-menu-option${!activeSize ? ' is-active' : ''}`}
            onClick={() => setFontSize('')}
          >
            Default
          </button>
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              role="option"
              aria-selected={activeSize === size}
              className={`canvas-fmt-menu-option${activeSize === size ? ' is-active' : ''}`}
              onClick={() => setFontSize(size)}
            >
              {size.replace('px', '')}
            </button>
          ))}
        </FormatMenu>
      </div>

      <div className="canvas-fmt-group">
        <span className="canvas-fmt-label">Text color</span>
        <div className="canvas-fmt-swatches" onMouseDown={keepSelection}>
          {TEXT_COLOR_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`canvas-fmt-swatch${activeTextColor === key ? ' is-active' : ''}`}
              title={key}
              aria-label={`Text color ${key}`}
              style={{
                background: key === 'default' ? '#fff' : colorSwatch(key, 'text'),
                color: key === 'default' ? '#1a1a22' : '#fff',
              }}
              onClick={() => setTextColor(key)}
            >
              {key === 'default' ? 'A' : ''}
            </button>
          ))}
          <label className="canvas-fmt-swatch canvas-fmt-swatch--custom" title="Custom text color">
            <input
              type="color"
              aria-label="Custom text color"
              value={
                activeTextColor.startsWith('#')
                  ? activeTextColor
                  : colorSwatch(activeTextColor, 'text').startsWith('#')
                    ? colorSwatch(activeTextColor, 'text')
                    : '#1a1a22'
              }
              onChange={(e) => setTextColor(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="canvas-fmt-group">
        <span className="canvas-fmt-label">Highlight</span>
        <div className="canvas-fmt-swatches" onMouseDown={keepSelection}>
          {TEXT_COLOR_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`canvas-fmt-swatch${activeHighlight === key ? ' is-active' : ''}`}
              title={key}
              aria-label={`Highlight ${key}`}
              style={{
                background: key === 'default' ? '#fff' : colorSwatch(key, 'background'),
              }}
              onClick={() => setHighlight(key)}
            >
              {key === 'default' ? '×' : ''}
            </button>
          ))}
          <label className="canvas-fmt-swatch canvas-fmt-swatch--custom" title="Custom highlight">
            <input
              type="color"
              aria-label="Custom highlight color"
              value={
                activeHighlight.startsWith('#')
                  ? activeHighlight
                  : colorSwatch(activeHighlight, 'background').startsWith('#')
                    ? colorSwatch(activeHighlight, 'background')
                    : '#fbf3db'
              }
              onChange={(e) => setHighlight(e.target.value)}
            />
          </label>
        </div>
      </div>

      <button
        type="button"
        className="canvas-fmt-clear"
        onMouseDown={keepSelection}
        onClick={clearFormatting}
      >
        Clear formatting
      </button>
    </section>
  )
}

export function CanvasToolsSidebar({
  editor,
  phaseTitle,
  collapsed,
  onToggleCollapsed,
  tableBorder,
  onTableBorderChange,
}: CanvasToolsSidebarProps) {
  const textItems = CANVAS_INSERT_ITEMS.filter((i) => i.group === 'Text')
  const [mermaidOpen, setMermaidOpen] = useState(false)

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

      <div className="canvas-tools-body">
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

        <section className="canvas-tools-section">
          <h3 className="canvas-tools-section-title">Diagram</h3>
          <button
            type="button"
            className="canvas-tools-insert canvas-tools-mermaid-btn"
            disabled={!editor}
            onClick={() => setMermaidOpen(true)}
          >
            <MermaidGlyph className="canvas-tools-mermaid-glyph" />
            <span className="canvas-tools-mermaid-copy">
              <span className="canvas-tools-insert-title">Mermaid Diagram</span>
              <span className="canvas-tools-insert-desc">flowchart · sequence · more</span>
            </span>
          </button>
          <MermaidEditorDialog
            open={mermaidOpen && !!editor}
            dialogTitle="Insert Mermaid diagram"
            initialCode={DEFAULT_DIAGRAM_CODE}
            initialTitle="Diagram"
            saveLabel="Insert"
            onClose={() => setMermaidOpen(false)}
            onSave={(next) => {
              if (!editor) return
              insertDiagram(editor, next)
              setMermaidOpen(false)
            }}
          />
        </section>

        {editor ? (
          <FormatPanel editor={editor} />
        ) : (
          <section className="canvas-tools-section">
            <h3 className="canvas-tools-section-title">Format</h3>
            <p className="canvas-tools-empty">Open the canvas to format text.</p>
          </section>
        )}

        <section className="canvas-tools-section">
          <h3 className="canvas-tools-section-title">Table</h3>
          <TableSizePicker editor={editor} />
          <div className="table-border-divider" />
          <h4 className="canvas-tools-subsection-title">Borders</h4>
          <TableBorderControls
            value={tableBorder}
            onChange={onTableBorderChange}
            disabled={!editor}
          />
        </section>
      </div>
    </aside>
  )
}
