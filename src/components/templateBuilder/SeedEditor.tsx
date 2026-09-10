import type { SeedSpec } from '../../data/types/templateManifest'
import type { BuilderSeedKind } from './types'

interface SeedEditorProps {
  seedKind: BuilderSeedKind
  seed: SeedSpec | null
  onChange: (seed: SeedSpec | null) => void
}

function LineListEditor({
  label,
  values,
  onChange,
  addLabel,
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
  addLabel: string
}) {
  return (
    <div className="tb-seed-group">
      <p className="tb-field-label">{label}</p>
      <div className="tb-line-list">
        {values.map((value, index) => (
          <div key={index} className="tb-line-row">
            <input
              type="text"
              className="tb-input"
              value={value}
              onChange={(e) => {
                const next = [...values]
                next[index] = e.target.value
                onChange(next)
              }}
              aria-label={`${label} ${index + 1}`}
            />
            <button
              type="button"
              className="tb-icon-btn"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              aria-label={`Remove ${label} ${index + 1}`}
              disabled={values.length <= 1}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="tb-text-btn"
        onClick={() => onChange([...values, ''])}
      >
        + {addLabel}
      </button>
    </div>
  )
}

export function SeedEditor({ seedKind, seed, onChange }: SeedEditorProps) {
  if (seedKind === 'none' || !seed) {
    return (
      <p className="tb-hint">No starter structure — heading and guidance only.</p>
    )
  }

  if (seed.kind === 'paragraph') {
    return (
      <label className="tb-field">
        <span className="tb-field-label">Starter paragraph</span>
        <textarea
          className="tb-textarea"
          rows={2}
          value={seed.content}
          onChange={(e) => onChange({ kind: 'paragraph', content: e.target.value })}
          placeholder="Optional starter text"
        />
      </label>
    )
  }

  if (seed.kind === 'bulletList') {
    return (
      <LineListEditor
        label="Bullet items"
        values={seed.content}
        onChange={(content) => onChange({ kind: 'bulletList', content })}
        addLabel="bullet"
      />
    )
  }

  if (seed.kind === 'table') {
    const { header, rows } = seed.content
    return (
      <div className="tb-seed-stack">
        <LineListEditor
          label="Column headers"
          values={header}
          onChange={(nextHeader) => {
            const width = nextHeader.length
            const nextRows = rows.map((row) => {
              const resized = row.slice(0, width)
              while (resized.length < width) resized.push('')
              return resized
            })
            onChange({
              kind: 'table',
              content: {
                header: nextHeader.length > 0 ? nextHeader : ['Column'],
                rows: nextRows.length > 0 ? nextRows : [nextHeader.map(() => '')],
              },
            })
          }}
          addLabel="column"
        />
        <p className="tb-hint">One empty data row is included for authors to fill in.</p>
      </div>
    )
  }

  if (seed.kind === 'diagram') {
    return (
      <div className="tb-seed-stack">
        <label className="tb-field">
          <span className="tb-field-label">Diagram title</span>
          <input
            type="text"
            className="tb-input"
            value={seed.content.title ?? ''}
            onChange={(e) =>
              onChange({
                kind: 'diagram',
                content: { ...seed.content, title: e.target.value },
              })
            }
            placeholder="Optional title"
          />
        </label>
        <label className="tb-field">
          <span className="tb-field-label">Mermaid source</span>
          <textarea
            className="tb-textarea"
            rows={6}
            value={seed.content.code}
            onChange={(e) =>
              onChange({
                kind: 'diagram',
                content: { ...seed.content, code: e.target.value },
              })
            }
            spellCheck={false}
          />
        </label>
      </div>
    )
  }

  if (seed.kind === 'codeBlock') {
    return (
      <div className="tb-seed-stack">
        <label className="tb-field">
          <span className="tb-field-label">Language</span>
          <input
            type="text"
            className="tb-input"
            value={seed.content.language}
            onChange={(e) =>
              onChange({
                kind: 'codeBlock',
                content: { ...seed.content, language: e.target.value },
              })
            }
          />
        </label>
        <label className="tb-field">
          <span className="tb-field-label">Code</span>
          <textarea
            className="tb-textarea"
            rows={5}
            value={seed.content.code}
            onChange={(e) =>
              onChange({
                kind: 'codeBlock',
                content: { ...seed.content, code: e.target.value },
              })
            }
            spellCheck={false}
          />
        </label>
      </div>
    )
  }

  return null
}
