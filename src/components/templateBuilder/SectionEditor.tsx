import { SeedEditor } from './SeedEditor'
import {
  defaultSeedForKind,
  SEED_KIND_OPTIONS,
  type BuilderSectionDraft,
  type BuilderSeedKind,
} from './types'

interface SectionEditorProps {
  section: BuilderSectionDraft
  index: number
  total: number
  onChange: (next: BuilderSectionDraft) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}

export function SectionEditor({
  section,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: SectionEditorProps) {
  const setSeedKind = (seedKind: BuilderSeedKind) => {
    onChange({
      ...section,
      seedKind,
      seed: defaultSeedForKind(seedKind),
      // Changing the primary kind keeps any extra extracted seeds.
      additionalSeeds: section.additionalSeeds,
    })
  }

  return (
    <article className="tb-section">
      <header className="tb-section-head">
        <span className="tb-section-index">§{index + 1}</span>
        <div className="tb-section-actions">
          <button
            type="button"
            className="tb-icon-btn"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label="Move section up"
          >
            ↑
          </button>
          <button
            type="button"
            className="tb-icon-btn"
            disabled={index >= total - 1}
            onClick={() => onMove(1)}
            aria-label="Move section down"
          >
            ↓
          </button>
          <button
            type="button"
            className="tb-icon-btn"
            disabled={total <= 1}
            onClick={onRemove}
            aria-label="Remove section"
          >
            ×
          </button>
        </div>
      </header>

      <div className="tb-field-row">
        <label className="tb-field tb-field--grow">
          <span className="tb-field-label">Heading</span>
          <input
            type="text"
            className="tb-input"
            value={section.heading}
            onChange={(e) => onChange({ ...section, heading: e.target.value })}
            placeholder="Section heading"
          />
        </label>
        <label className="tb-field">
          <span className="tb-field-label">Level</span>
          <select
            className="tb-input"
            value={section.headingLevel}
            onChange={(e) =>
              onChange({
                ...section,
                headingLevel: Number(e.target.value) === 3 ? 3 : 2,
              })
            }
          >
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
        </label>
      </div>

      <label className="tb-field">
        <span className="tb-field-label">Guidance (one bullet per line)</span>
        <textarea
          className="tb-textarea"
          rows={3}
          value={section.guidanceText}
          onChange={(e) => onChange({ ...section, guidanceText: e.target.value })}
          placeholder="What should authors cover in this section?"
        />
      </label>

      <label className="tb-check">
        <input
          type="checkbox"
          checked={section.repeatable}
          onChange={(e) => onChange({ ...section, repeatable: e.target.checked })}
        />
        <span>Repeatable section</span>
      </label>

      <label className="tb-field">
        <span className="tb-field-label">Starter structure</span>
        <select
          className="tb-input"
          value={section.seedKind}
          onChange={(e) => setSeedKind(e.target.value as BuilderSeedKind)}
        >
          {SEED_KIND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <SeedEditor
        seedKind={section.seedKind}
        seed={section.seed}
        onChange={(seed) => onChange({ ...section, seed })}
      />
      {section.additionalSeeds.length > 0 ? (
        <p className="tb-hint">
          +{section.additionalSeeds.length} more starter block
          {section.additionalSeeds.length === 1 ? '' : 's'} from the canvas (
          {section.additionalSeeds.map((s) => s.kind).join(', ')}) will be kept when you save.
        </p>
      ) : null}
    </article>
  )
}
