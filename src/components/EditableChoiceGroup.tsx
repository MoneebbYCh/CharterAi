import { useState } from 'react'
import { fieldClass, useShowValidation } from '../context/ValidationContext'
import { useChoiceOptions, type ChoiceOptionKey } from '../hooks/useCustomOptions'
import { FieldHint } from './FormFields'

interface EditableChoiceGroupProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  optionKey: ChoiceOptionKey
  required?: boolean
  hint?: string
  asDropdown?: boolean
}

export function EditableChoiceGroup<T extends string>({
  label,
  value,
  onChange,
  optionKey,
  required,
  hint,
  asDropdown = false,
}: EditableChoiceGroupProps<T>) {
  const { options, addOption, removeOption, updateOption, resetOptions } = useChoiceOptions(optionKey)
  const [editing, setEditing] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [editLabel, setEditLabel] = useState<{ value: string; label: string } | null>(null)

  const allOptions =
    value && !options.some((o) => o.value === value)
      ? [...options, { value, label: value }]
      : options

  const showValidation = useShowValidation()
  const invalid = Boolean(required && showValidation && !value)

  return (
    <div className={`${fieldClass(invalid)} editable-choice-group`}>
      <div className="choice-header">
        <span className="field-label">
          {label}
          {required && <span className="required-mark"> *</span>}
        </span>
        <button
          type="button"
          className="btn-edit-options"
          onClick={() => setEditing((e) => !e)}
          title="Edit choices"
        >
          ⚙ Edit choices
        </button>
      </div>
      {hint && <FieldHint>{hint}</FieldHint>}

      {asDropdown ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={`choice-dropdown ${invalid ? 'input-invalid' : ''}`}
          aria-invalid={invalid}
        >
          <option value="">Select…</option>
          {allOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="radio-group">
          {allOptions.map((opt) => (
            <label key={opt.value} className="radio-option">
              <input
                type="radio"
                name={label}
                checked={value === opt.value}
                onChange={() => onChange(opt.value as T)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      )}

      {editing && (
        <div className="options-editor mac-inset">
          <p className="options-editor-title">Manage choices</p>
          <ul className="options-list choice-options-list">
            {options.map((opt) => (
              <li key={opt.value}>
                {editLabel?.value === opt.value ? (
                  <div className="choice-edit-row">
                    <input
                      type="text"
                      value={editLabel.label}
                      onChange={(e) => setEditLabel({ ...editLabel, label: e.target.value })}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => {
                        updateOption(opt.value, editLabel.label)
                        setEditLabel(null)
                      }}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <>
                    <span>
                      <strong>{opt.value}</strong> — {opt.label}
                    </span>
                    <span className="choice-actions">
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => setEditLabel({ value: opt.value, label: opt.label })}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-icon-sm"
                        onClick={() => removeOption(opt.value)}
                        title="Remove"
                      >
                        −
                      </button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
          <div className="options-add-row choice-add-row">
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Value (e.g. P4)"
            />
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label"
            />
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                addOption(newValue, newLabel)
                setNewValue('')
                setNewLabel('')
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
