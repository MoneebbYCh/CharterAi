import type { ReactNode } from 'react'
import { fieldClass, isRequiredInvalid, useShowValidation } from '../context/ValidationContext'
import { AutoResizeTextarea } from './AutoResizeTextarea'
import { EditableSelect } from './EditableSelect'
import type { StringOptionKey } from '../hooks/useCustomOptions'

interface FieldHintProps {
  children: ReactNode
}

export function FieldHint({ children }: FieldHintProps) {
  return <p className="field-hint">{children}</p>
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  hint?: string
  multiline?: boolean
  rows?: number
  type?: 'text' | 'date' | 'email'
  placeholder?: string
}

export function TextField({
  label,
  value,
  onChange,
  required,
  hint,
  multiline,
  rows = 3,
  type = 'text',
  placeholder,
}: TextFieldProps) {
  const showValidation = useShowValidation()
  const invalid = isRequiredInvalid(required, value, showValidation)
  const id = label.replace(/\s+/g, '-').toLowerCase()

  return (
    <div className={fieldClass(invalid)}>
      <label htmlFor={id}>
        {label}
        {required && <span className="required-mark"> *</span>}
      </label>
      {hint && <FieldHint>{hint}</FieldHint>}
      {multiline ? (
        <AutoResizeTextarea
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minRows={rows}
          required={required}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={invalid}
          className={invalid ? 'input-invalid' : undefined}
        />
      )}
    </div>
  )
}

interface RadioGroupProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  required?: boolean
  hint?: string
}

export function RadioGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  required,
  hint,
}: RadioGroupProps<T>) {
  const showValidation = useShowValidation()
  const invalid = Boolean(required && showValidation && !value)

  return (
    <div className={fieldClass(invalid)}>
      <span className="field-label">
        {label}
        {required && <span className="required-mark"> *</span>}
      </span>
      {hint && <FieldHint>{hint}</FieldHint>}
      <div className="radio-group">
        {options.map((opt) => (
          <label key={opt.value} className="radio-option">
            <input
              type="radio"
              name={label}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

interface CheckboxGroupProps {
  label: string
  hint?: string
  items: { key: string; label: string; checked: boolean }[]
  onChange: (key: string, checked: boolean) => void
  required?: boolean
  minChecked?: number
}

export function CheckboxGroup({
  label,
  hint,
  items,
  onChange,
  required,
  minChecked,
}: CheckboxGroupProps) {
  const showValidation = useShowValidation()
  const checkedCount = items.filter((i) => i.checked).length
  const minimum = minChecked ?? (required ? 1 : 0)
  const invalid = Boolean(showValidation && minimum > 0 && checkedCount < minimum)

  return (
    <div className={fieldClass(invalid)}>
      <span className="field-label">
        {label}
        {required && <span className="required-mark"> *</span>}
      </span>
      {hint && <FieldHint>{hint}</FieldHint>}
      <div className="checkbox-group">
        {items.map((item) => (
          <label key={item.key} className="checkbox-option">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => onChange(item.key, e.target.checked)}
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

interface SectionHeaderProps {
  number: string
  title: string
  subtitle?: string
  callout?: string
}

export function SectionHeader({ number, title, subtitle, callout }: SectionHeaderProps) {
  return (
    <header className="section-header">
      <div className="section-number">{number}</div>
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
        {callout && <div className="callout">{callout}</div>}
      </div>
    </header>
  )
}

interface SubSectionProps {
  title: string
  note?: string
  children: ReactNode
}

export function SubSection({ title, note, children }: SubSectionProps) {
  return (
    <div className="subsection">
      <h3>{title}</h3>
      {note && <div className="note-banner">{note}</div>}
      {children}
    </div>
  )
}

export type TableColumn =
  | { key: string; label: string; type?: 'text'; width?: string; multiline?: boolean; required?: boolean }
  | { key: string; label: string; type: 'select'; optionKey: StringOptionKey; width?: string; required?: boolean }

interface DynamicTableProps<T extends object> {
  columns: TableColumn[]
  rows: T[]
  onChange: (rowIndex: number, key: string, value: string) => void
  onAddRow: () => void
  onRemoveRow: (index: number) => void
  minRows?: number
  requireCompleteRow?: boolean
}

export function DynamicTable<T extends object>({
  columns,
  rows,
  onChange,
  onAddRow,
  onRemoveRow,
  minRows = 1,
  requireCompleteRow,
}: DynamicTableProps<T>) {
  const showValidation = useShowValidation()
  const requiredCols = columns.filter((c) => c.required).map((c) => c.key)

  const hasCompleteRow =
    !requireCompleteRow ||
    rows.some((row) => {
      const r = row as Record<string, string>
      return requiredCols.every((key) => (r[key] ?? '').trim().length > 0)
    })

  const tableInvalid = Boolean(showValidation && requireCompleteRow && !hasCompleteRow)

  return (
    <div className={`dynamic-table-wrap ${tableInvalid ? 'field-invalid' : ''}`}>
      <table className="dynamic-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.label}
                {'required' in col && col.required && <span className="required-mark"> *</span>}
              </th>
            ))}
            <th className="actions-col" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col) => {
                const cellValue = String((row as Record<string, string>)[col.key] ?? '')
                const cellInvalid = Boolean(
                  showValidation && col.required && cellValue.trim().length === 0,
                )

                return (
                  <td key={col.key} className={cellInvalid ? 'field-invalid-cell' : undefined}>
                    {col.type === 'select' ? (
                      <EditableSelect
                        compact
                        required={col.required}
                        optionKey={col.optionKey}
                        value={cellValue}
                        onChange={(v) => onChange(rowIndex, col.key, v)}
                      />
                    ) : col.multiline ? (
                      <AutoResizeTextarea
                        value={cellValue}
                        onChange={(v) => onChange(rowIndex, col.key, v)}
                        minRows={2}
                        maxHeight={160}
                        className="table-textarea"
                        required={col.required}
                      />
                    ) : (
                      <input
                        type="text"
                        value={cellValue}
                        onChange={(e) => onChange(rowIndex, col.key, e.target.value)}
                        aria-invalid={cellInvalid}
                        className={cellInvalid ? 'input-invalid' : undefined}
                      />
                    )}
                  </td>
                )
              })}
              <td className="actions-col">
                {rows.length > minRows && (
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => onRemoveRow(rowIndex)}
                    title="Remove row"
                  >
                    ×
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn-secondary btn-sm" onClick={onAddRow}>
        + Add Row
      </button>
    </div>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  required?: boolean
}

export function SelectField({ label, value, onChange, options, required }: SelectFieldProps) {
  const showValidation = useShowValidation()
  const invalid = isRequiredInvalid(required, value, showValidation)
  const id = label.replace(/\s+/g, '-').toLowerCase()

  return (
    <div className={fieldClass(invalid)}>
      <label htmlFor={id}>
        {label}
        {required && <span className="required-mark"> *</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        className={invalid ? 'input-invalid' : undefined}
      >
        <option value="">Select…</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface GateChecklistProps {
  title: string
  items: readonly { id: string; label: string }[]
  values: Record<string, boolean>
  onChange: (id: string, checked: boolean) => void
  disabled?: boolean
  required?: boolean
}

export function GateChecklist({ title, items, values, onChange, disabled, required = true }: GateChecklistProps) {
  const showValidation = useShowValidation()
  const allChecked = items.every((item) => values[item.id])
  const groupInvalid = Boolean(required && showValidation && !allChecked)

  return (
    <div className={`gate-checklist ${groupInvalid ? 'field-invalid' : ''}`}>
      <h4>{title}</h4>
      <ul>
        {items.map((item) => {
          const itemInvalid = Boolean(required && showValidation && !values[item.id])
          return (
            <li key={item.id} className={itemInvalid ? 'checklist-item-invalid' : undefined}>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={values[item.id] ?? false}
                  onChange={(e) => onChange(item.id, e.target.checked)}
                  disabled={disabled}
                />
                <span>{item.label}</span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
