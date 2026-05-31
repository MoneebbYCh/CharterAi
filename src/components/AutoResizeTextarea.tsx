import { useLayoutEffect, useRef } from 'react'
import { useShowValidation } from '../context/ValidationContext'

interface AutoResizeTextareaProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minRows?: number
  maxHeight?: number
  className?: string
  required?: boolean
}

const LINE_HEIGHT = 20
const VERTICAL_PADDING = 12

export function AutoResizeTextarea({
  id,
  value,
  onChange,
  placeholder,
  minRows = 3,
  maxHeight = 320,
  className = '',
  required,
}: AutoResizeTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const showValidation = useShowValidation()
  const invalid = Boolean(required && showValidation && !value.trim())
  const minHeight = minRows * LINE_HEIGHT + VERTICAL_PADDING

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = `${minHeight}px`
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minHeight), maxHeight)}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [value, minHeight, maxHeight])

  return (
    <textarea
      ref={ref}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={minRows}
      aria-invalid={invalid}
      className={`auto-resize-textarea ${invalid ? 'input-invalid' : ''} ${className}`.trim()}
      style={{ minHeight, maxHeight }}
    />
  )
}
