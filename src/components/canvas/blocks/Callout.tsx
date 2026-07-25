import { createReactBlockSpec } from '@blocknote/react'

const VARIANT_META: Record<string, { label: string; tone: string }> = {
  info: { label: 'NOTE', tone: 'neutral' },
  warn: { label: 'CAUTION', tone: 'caution' },
  success: { label: 'CONFIRMED', tone: 'positive' },
  error: { label: 'CRITICAL', tone: 'critical' },
}

export const createCallout = createReactBlockSpec(
  {
    type: 'callout',
    propSchema: {
      variant: {
        default: 'info',
        values: ['info', 'warn', 'success', 'error'] as const,
      },
      title: {
        default: '',
      },
    },
    content: 'inline',
  },
  {
    render: (props) => {
      const variant = String(props.block.props.variant || 'info')
      const meta = VARIANT_META[variant] ?? VARIANT_META.info
      const title = String(props.block.props.title || '')

      return (
        <aside className={`rg-callout rg-callout--${meta.tone}`}>
          <div className="rg-callout-rail" aria-hidden />
          <div className="rg-callout-content">
            <div className="rg-callout-meta">
              <span className="rg-callout-label">{meta.label}</span>
              {title ? <span className="rg-callout-title">{title}</span> : null}
            </div>
            <div className="rg-callout-body" ref={props.contentRef} />
          </div>
        </aside>
      )
    },
  },
)
