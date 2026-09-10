import { useCallback, useState } from 'react'
import type { CanvasEditor } from './canvasInsert'
import { insertTable } from './canvasInsert'

const MAX = 8

interface TableSizePickerProps {
  editor: CanvasEditor | null
}

/** Word-style hover grid to insert an inline-editable table. */
export function TableSizePicker({ editor }: TableSizePickerProps) {
  const [hover, setHover] = useState<{ rows: number; cols: number } | null>(null)
  const rows = hover?.rows ?? 0
  const cols = hover?.cols ?? 0

  const pick = useCallback(
    (r: number, c: number) => {
      if (!editor) return
      insertTable(editor, r, c)
      setHover(null)
    },
    [editor],
  )

  return (
    <div className="table-size-picker">
      <p className="canvas-tools-section-hint">
        Hover to choose size, click to insert — edit cells directly on the page.
      </p>
      <div
        className="table-size-picker-grid"
        onMouseLeave={() => setHover(null)}
        role="grid"
        aria-label="Table size"
      >
        {Array.from({ length: MAX }, (_, r) =>
          Array.from({ length: MAX }, (_, c) => {
            const rr = r + 1
            const cc = c + 1
            const active = hover !== null && rr <= hover.rows && cc <= hover.cols
            return (
              <button
                key={`${rr}x${cc}`}
                type="button"
                role="gridcell"
                className={`table-size-picker-cell${active ? ' table-size-picker-cell--active' : ''}`}
                disabled={!editor}
                aria-label={`${rr} by ${cc} table`}
                onMouseEnter={() => setHover({ rows: rr, cols: cc })}
                onClick={() => pick(rr, cc)}
              />
            )
          }),
        )}
      </div>
      <p className="table-size-picker-label">
        {rows > 0 && cols > 0 ? `${rows} × ${cols}` : 'Select size'}
      </p>
    </div>
  )
}
