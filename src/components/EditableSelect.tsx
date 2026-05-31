import { useState } from 'react'
import { useShowValidation } from '../context/ValidationContext'
import { useStringOptions, type StringOptionKey } from '../hooks/useCustomOptions'

interface EditableSelectProps {
  value: string
  onChange: (value: string) => void
  optionKey: StringOptionKey
  placeholder?: string
  compact?: boolean
  required?: boolean
}

export function EditableSelect({
  value,
  onChange,
  optionKey,
  placeholder = 'Select…',
  compact = false,
  required,
}: EditableSelectProps) {
  const showValidation = useShowValidation()
  const invalid = Boolean(required && showValidation && !value.trim())
  const { options, addOption, removeOption, resetOptions } = useStringOptions(optionKey)
  const [editing, setEditing] = useState(false)
  const [newOption, setNewOption] = useState('')
  const [customMode, setCustomMode] = useState(false)

  const allOptions = value && !options.includes(value) ? [...options, value] : options

  return (
    <div className={`editable-select ${compact ? 'compact' : ''}`}>
      <div className="editable-select-row">
        {customMode ? (
          <input
            type="text"
            className={`editable-select-input ${invalid ? 'input-invalid' : ''}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type custom value…"
            autoFocus
            aria-invalid={invalid}
          />
        ) : (
          <select
            className={`editable-select-input ${invalid ? 'input-invalid' : ''}`}
            value={value}
            aria-invalid={invalid}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setCustomMode(true)
                onChange('')
              } else {
                onChange(e.target.value)
              }
            }}
          >
            <option value="">{placeholder}</option>
            {allOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            <option value="__custom__">✎ Type custom…</option>
          </select>
        )}
        <button
          type="button"
          className="btn-edit-options"
          onClick={() => setEditing((e) => !e)}
          title="Edit dropdown options"
        >
          ⚙
        </button>
      </div>

      {customMode && (
        <button type="button" className="btn-link" onClick={() => setCustomMode(false)}>
          ← Back to list
        </button>
      )}

      {editing && (
        <div className="options-editor mac-inset">
          <p className="options-editor-title">Edit options</p>
          <ul className="options-list">
            {options.map((opt) => (
              <li key={opt}>
                <span>{opt}</span>
                <button type="button" className="btn-icon-sm" onClick={() => removeOption(opt)} title="Remove">
                  −
                </button>
              </li>
            ))}
          </ul>
          <div className="options-add-row">
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="New option…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addOption(newOption)
                  setNewOption('')
                }
              }}
            />
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                addOption(newOption)
                setNewOption('')
              }}
            >
              Add
            </button>
          </div>
          <button type="button" className="btn-link" onClick={resetOptions}>
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  )
}
