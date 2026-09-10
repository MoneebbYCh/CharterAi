import type { MouseEvent } from 'react'
import {
  TABLE_BORDER_PRESETS,
  matchTableBorderPreset,
  type TableBorderLine,
  type TableBorderStyle,
} from './tableBorderStyle'

interface TableBorderControlsProps {
  value: TableBorderStyle
  onChange: (next: TableBorderStyle) => void
  disabled?: boolean
}

function keepSelection(e: MouseEvent) {
  e.preventDefault()
}

export function TableBorderControls({ value, onChange, disabled }: TableBorderControlsProps) {
  const preset = matchTableBorderPreset(value)

  return (
    <div className={`table-border-controls${disabled ? ' is-disabled' : ''}`}>
      <p className="canvas-tools-section-hint">Border look for tables in this document.</p>

      <div className="table-border-presets" role="group" aria-label="Border presets">
        {TABLE_BORDER_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`table-border-preset${preset === item.id ? ' is-active' : ''}`}
            disabled={disabled}
            onMouseDown={keepSelection}
            onClick={() => onChange({ ...item.style })}
            title={item.label}
          >
            <span
              className="table-border-preset-swatch"
              data-line={item.style.line}
              style={{
                borderWidth: item.style.width === 0 ? 0 : Math.max(1, item.style.width),
                borderStyle: item.style.line === 'none' ? 'solid' : item.style.line,
                borderColor: item.style.width === 0 ? 'transparent' : item.style.color,
                opacity: item.style.width === 0 ? 0.45 : 1,
              }}
              aria-hidden
            />
            <span className="table-border-preset-label">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="table-border-custom">
        <label className="table-border-field">
          <span className="canvas-fmt-label">Thickness</span>
          <div className="table-border-thickness">
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={value.width}
              disabled={disabled}
              onMouseDown={keepSelection}
              onChange={(e) =>
                onChange({
                  ...value,
                  width: Number(e.target.value),
                  line: Number(e.target.value) === 0 ? 'none' : value.line === 'none' ? 'solid' : value.line,
                })
              }
              aria-label="Border thickness"
            />
            <span className="table-border-thickness-value">{value.width}px</span>
          </div>
        </label>

        <label className="table-border-field">
          <span className="canvas-fmt-label">Style</span>
          <select
            className="table-border-select"
            value={value.line}
            disabled={disabled || value.width === 0}
            onMouseDown={keepSelection}
            onChange={(e) => onChange({ ...value, line: e.target.value as TableBorderLine })}
            aria-label="Border style"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="none">None</option>
          </select>
        </label>

        <label className="table-border-field table-border-field--color">
          <span className="canvas-fmt-label">Color</span>
          <input
            type="color"
            className="table-border-color"
            value={value.color.startsWith('#') ? value.color : '#000000'}
            disabled={disabled || value.width === 0 || value.line === 'none'}
            onMouseDown={keepSelection}
            onChange={(e) => onChange({ ...value, color: e.target.value })}
            aria-label="Border color"
          />
        </label>
      </div>
    </div>
  )
}
