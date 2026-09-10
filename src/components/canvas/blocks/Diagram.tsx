import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createReactBlockSpec } from '@blocknote/react'
import { MermaidRenderer } from '../MermaidRenderer'
import { BlockActions, deleteCanvasBlock } from '../BlockActions'
import { MermaidEditorDialog } from '../MermaidEditorDialog'
import { DiagramFullscreen } from '../DiagramFullscreen'

const DEFAULT_CODE = `graph TD
  A[Start] --> B[Decision]
  B -->|Yes| C[Done]
  B -->|No| A`

const DEFAULT_FRAME_HEIGHT = 360
const MIN_FRAME_HEIGHT = 160
const MAX_FRAME_HEIGHT = 900
const MIN_FRAME_WIDTH_PCT = 40
const MAX_FRAME_WIDTH_PCT = 100

export type DiagramAlign = 'left' | 'center' | 'right'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function readFrameHeight(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_FRAME_HEIGHT
  return clamp(Math.round(n), MIN_FRAME_HEIGHT, MAX_FRAME_HEIGHT)
}

function readFrameWidthPct(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n <= 0) return MAX_FRAME_WIDTH_PCT
  return clamp(Math.round(n), MIN_FRAME_WIDTH_PCT, MAX_FRAME_WIDTH_PCT)
}

function readAlign(raw: unknown): DiagramAlign {
  if (raw === 'left' || raw === 'right' || raw === 'center') return raw
  return 'center'
}

function DiagramView(props: {
  block: { props: Record<string, unknown>; id?: string }
  editor: {
    updateBlock: (block: unknown, update: unknown) => void
    removeBlocks: (blocks: unknown[]) => void
  }
}) {
  const code = String(props.block.props.code || DEFAULT_CODE)
  const title = String(props.block.props.title || '').trim()
  const source = String(props.block.props.source || 'llm')
  const align = readAlign(props.block.props.align)
  const savedHeight = readFrameHeight(props.block.props.frameHeight)
  const savedWidthPct = readFrameWidthPct(props.block.props.frameWidthPct)

  const [editing, setEditing] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [frameHeight, setFrameHeight] = useState(savedHeight)
  const [frameWidthPct, setFrameWidthPct] = useState(savedWidthPct)
  const [resizing, setResizing] = useState(false)

  const shellRef = useRef<HTMLDivElement>(null)
  const latestFrame = useRef({ height: savedHeight, widthPct: savedWidthPct })
  const dragRef = useRef<{
    startX: number
    startY: number
    startW: number
    startH: number
    parentW: number
  } | null>(null)

  useEffect(() => {
    if (resizing) return
    setFrameHeight(savedHeight)
    setFrameWidthPct(savedWidthPct)
    latestFrame.current = { height: savedHeight, widthPct: savedWidthPct }
  }, [savedHeight, savedWidthPct, resizing])

  const persistFrame = useCallback(
    (height: number, widthPct: number) => {
      props.editor.updateBlock(props.block, {
        props: {
          frameHeight: height,
          frameWidthPct: widthPct,
        },
      })
    },
    [props.block, props.editor],
  )

  const save = (next: { code: string; title: string }) => {
    const { height, widthPct } = latestFrame.current
    props.editor.updateBlock(props.block, {
      props: {
        code: next.code,
        title: next.title,
        source: source === 'code-index' ? 'code-index' : 'llm',
        frameHeight: height,
        frameWidthPct: widthPct,
        align,
      },
    })
  }

  const onResizePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const shell = shellRef.current
    if (!shell) return
    const parentW = shell.parentElement?.clientWidth || shell.clientWidth
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: shell.clientWidth,
      startH: shell.clientHeight,
      parentW: Math.max(1, parentW),
    }
    setResizing(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onResizePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const nextH = clamp(
      Math.round(drag.startH + (e.clientY - drag.startY)),
      MIN_FRAME_HEIGHT,
      MAX_FRAME_HEIGHT,
    )
    const nextWpx = drag.startW + (e.clientX - drag.startX)
    const nextPct = clamp(
      Math.round((nextWpx / drag.parentW) * 100),
      MIN_FRAME_WIDTH_PCT,
      MAX_FRAME_WIDTH_PCT,
    )
    latestFrame.current = { height: nextH, widthPct: nextPct }
    setFrameHeight(nextH)
    setFrameWidthPct(nextPct)
  }

  const onResizePointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    setResizing(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    const { height, widthPct } = latestFrame.current
    persistFrame(height, widthPct)
  }

  return (
    <div
      className={`rg-diagram${resizing ? ' is-resizing' : ''}`}
      contentEditable={false}
      data-source={source}
      data-align={align}
      style={{ width: `${frameWidthPct}%` }}
    >
      <div className="rg-block-caption">
        <span className="rg-diagram-title">{title || 'Untitled diagram'}</span>
        {source === 'code-index' ? (
          <span className="rg-anchor-id">from code index</span>
        ) : null}
        <BlockActions
          actions={[
            { label: 'Expand', onClick: () => setFullscreen(true), tone: 'accent' },
            { label: 'Edit', onClick: () => setEditing(true) },
            {
              label: 'Reset size',
              onClick: () => {
                latestFrame.current = {
                  height: DEFAULT_FRAME_HEIGHT,
                  widthPct: MAX_FRAME_WIDTH_PCT,
                }
                setFrameHeight(DEFAULT_FRAME_HEIGHT)
                setFrameWidthPct(MAX_FRAME_WIDTH_PCT)
                persistFrame(DEFAULT_FRAME_HEIGHT, MAX_FRAME_WIDTH_PCT)
              },
            },
            {
              label: 'Delete',
              tone: 'danger',
              onClick: () => deleteCanvasBlock(props.editor, props.block),
            },
          ]}
        />
      </div>

      <div ref={shellRef} className="rg-diagram-frame" style={{ height: frameHeight }}>
        <button
          type="button"
          className="rg-diagram-preview"
          onClick={() => setFullscreen(true)}
          title="Open fullscreen"
        >
          <MermaidRenderer code={code} fit="contain" />
        </button>
        <button
          type="button"
          className="rg-diagram-resize"
          aria-label="Resize diagram"
          title="Drag to resize"
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          onPointerCancel={onResizePointerUp}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <details className="rg-diagram-source">
        <summary>Source</summary>
        <pre>{code}</pre>
      </details>

      <MermaidEditorDialog
        open={editing}
        dialogTitle="Edit Mermaid diagram"
        initialCode={code}
        initialTitle={title}
        onClose={() => setEditing(false)}
        onSave={(next) => {
          save(next)
          setEditing(false)
        }}
      />

      <DiagramFullscreen
        open={fullscreen}
        code={code}
        title={title}
        onClose={() => setFullscreen(false)}
        onSave={(next) => save(next)}
      />
    </div>
  )
}

export const createDiagram = createReactBlockSpec(
  {
    type: 'diagram',
    propSchema: {
      code: {
        default: DEFAULT_CODE,
      },
      title: {
        default: '',
      },
      /** "llm" | "code-index" — how the diagram was produced */
      source: {
        default: 'llm',
      },
      /** Preview frame height in px */
      frameHeight: {
        default: DEFAULT_FRAME_HEIGHT,
      },
      /** Preview frame width as % of the content column */
      frameWidthPct: {
        default: MAX_FRAME_WIDTH_PCT,
      },
      /** Block alignment within the page column */
      align: {
        default: 'center' satisfies DiagramAlign,
      },
    },
    content: 'none',
  },
  {
    render: (props) => <DiagramView block={props.block} editor={props.editor as never} />,
  },
)

export { DEFAULT_CODE as DEFAULT_DIAGRAM_CODE }
