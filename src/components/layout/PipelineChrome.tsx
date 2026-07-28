import type { View } from '../../hooks/useViewState'
import type { GateStatus } from '../../utils/validation'
import { listDocumentTypes } from '../../data/documentTypes'
import { BrandMark } from '../BrandMark'

interface PipelineHeaderProps {
  onHome: () => void
  onExport: () => void
  onSave: () => void
  saveLabel?: string
  /** Current phase — highlights the active tab. */
  currentPhaseId?: string
  /** Jump between phases from the header strip. */
  onNavigate?: (view: View) => void
  /** @deprecated Unused — phases are no longer gated. */
  formData?: unknown
}

export function PipelineHeader({
  onHome,
  onExport,
  onSave,
  saveLabel = 'Save Draft',
  currentPhaseId,
  onNavigate,
}: PipelineHeaderProps) {
  return (
    <header className="sticky top-0 w-full z-50 flex flex-col border-b-2 border-on-background bg-secondary-container">
      <div className="flex justify-between items-center px-6 py-2">
        <button
          type="button"
          onClick={onHome}
          className="hover:opacity-80 transition-opacity"
          aria-label="Home"
        >
          <BrandMark size="sm" />
        </button>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onExport}
            className="outset-button border-2 border-on-background bg-white text-primary font-bold px-4 py-1 text-xs"
            style={{ fontFamily: 'var(--font-label)' }}
          >
            Export
          </button>
          <button
            type="button"
            onClick={onSave}
            className="outset-button border-2 border-on-background bg-secondary-container text-on-background px-4 py-1 text-xs font-bold"
            style={{ fontFamily: 'var(--font-label)' }}
          >
            {saveLabel}
          </button>
        </div>
      </div>
      <nav className="flex w-full overflow-x-auto">
        {listDocumentTypes().map((phase) => {
          const active = phase.id === currentPhaseId
          const canNavigate = Boolean(onNavigate)
          const className = [
            'flex-1 min-w-[140px] px-4 py-2 flex items-center justify-between border-r border-on-background transition-colors text-left',
            active
              ? 'bg-white text-on-background'
              : 'bg-secondary-container text-on-background hover:bg-surface-container-low',
            canNavigate ? 'cursor-pointer' : 'cursor-default',
          ].join(' ')

          const inner = (
            <>
              <span className="text-xs font-bold truncate" style={{ fontFamily: 'var(--font-label)' }}>
                {phase.title}
              </span>
              <span className="material-symbols-outlined text-[16px]">
                {active ? 'radio_button_checked' : 'radio_button_unchecked'}
              </span>
            </>
          )

          if (canNavigate) {
            return (
              <button
                key={phase.id}
                type="button"
                className={className}
                onClick={() => onNavigate?.({ page: phase.id })}
              >
                {inner}
              </button>
            )
          }

          return (
            <span key={phase.id} className={className}>
              {inner}
            </span>
          )
        })}
      </nav>
    </header>
  )
}

interface PipelineFooterProps {
  gateStatus: GateStatus
  onExportPdf: () => void
  onSignOff: () => void
  onNavigate?: (view: View) => void
}

function gateFooterLabel(status: GateStatus): { text: string; className: string } {
  switch (status) {
    case 'approved':
      return { text: 'Gate Approved — Phase 1 Complete', className: 'text-green-700' }
    case 'open':
      return { text: 'Gate Open — Complete Section 8 Sign-off', className: 'text-primary' }
    case 'needs-revision':
      return { text: 'Gate — Needs Revision', className: 'text-error' }
    case 'rejected':
      return { text: 'Gate — Rejected', className: 'text-error' }
    default:
      return { text: 'Gate Review Required', className: 'text-error' }
  }
}

export function PipelineFooter({ gateStatus, onExportPdf, onSignOff, onNavigate }: PipelineFooterProps) {
  const gateLabel = gateFooterLabel(gateStatus)

  return (
    <footer className="sticky bottom-0 w-full z-50 bg-surface-container-highest border-t-2 border-on-background flex justify-between items-center px-6 py-1">
      <div className="flex items-center gap-4">
        <span
          className="text-[11px] text-on-background font-bold uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-label)' }}
        >
          Internal Engineering Tool
        </span>
        <span className="text-on-surface-variant text-[11px]">|</span>
        <span
          className={`text-[11px] font-bold ${gateLabel.className}`}
          style={{ fontFamily: 'var(--font-label)' }}
        >
          {gateLabel.text}
        </span>
      </div>
      <div className="flex gap-6 items-center">
        {gateStatus === 'approved' && onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate({ page: 'prd' })}
            className="text-[11px] text-on-primary bg-primary border-2 border-on-background font-bold px-3 py-0.5 outset-button"
            style={{ fontFamily: 'var(--font-label)' }}
          >
            Proceed to PRD →
          </button>
        )}
        <button
          type="button"
          onClick={onExportPdf}
          className="text-[11px] text-on-surface-variant hover:text-primary transition-colors bg-transparent border-0 cursor-pointer"
          style={{ fontFamily: 'var(--font-label)' }}
        >
          Generate PDF
        </button>
        <button
          type="button"
          onClick={onSignOff}
          className="text-[11px] text-on-surface-variant hover:text-primary transition-colors font-bold underline bg-transparent border-0 cursor-pointer"
          style={{ fontFamily: 'var(--font-label)' }}
        >
          Sign-off
        </button>
        <div className="flex items-center gap-2 border-l border-on-background pl-4">
          <span className="w-2 h-2 rounded-full bg-green-600" />
          <span className="text-[11px] text-on-background" style={{ fontFamily: 'var(--font-label)' }}>
            SYS_READY
          </span>
        </div>
      </div>
    </footer>
  )
}
