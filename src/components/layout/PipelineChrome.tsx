import type { View } from '../../hooks/useViewState'
import { PHASES } from '../../data/phases'
import type { GateStatus } from '../../utils/validation'
import { isPhaseUnlocked } from '../../utils/validation'

interface PipelineHeaderProps {
  onHome: () => void
  onExport: () => void
  onSave: () => void
  saveLabel?: string
  /** Legacy form data for phase unlock; optional for canvas phases. */
  formData?: unknown
}

export function PipelineHeader({ onHome, onExport, onSave, saveLabel = 'Save Draft', formData }: PipelineHeaderProps) {
  return (
    <header className="sticky top-0 w-full z-50 flex flex-col border-b-2 border-on-background bg-secondary-container">
      <div className="flex justify-between items-center px-6 py-2">
        <button
          type="button"
          onClick={onHome}
          className="font-bold text-lg tracking-tighter text-on-background hover:text-primary transition-colors"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          Project Pipeline
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
        {PHASES.map((phase) => {
          const unlocked = isPhaseUnlocked(phase.id, formData ?? null)
          if (!unlocked) {
            return (
              <span
                key={phase.id}
                title="Complete and approve the gate review first"
                className="flex-1 min-w-[140px] px-4 py-2 flex items-center justify-between border-r border-on-background bg-secondary-container text-on-secondary-container opacity-50 cursor-not-allowed"
              >
                <span className="text-xs font-bold truncate" style={{ fontFamily: 'var(--font-label)' }}>
                  {phase.title}
                </span>
                <span className="material-symbols-outlined text-[16px]">lock</span>
              </span>
            )
          }

          return (
            <span
              key={phase.id}
              className="flex-1 min-w-[140px] px-4 py-2 flex items-center justify-between border-r border-on-background bg-secondary-container text-on-secondary-container transition-colors"
            >
              <span className="text-xs font-bold truncate" style={{ fontFamily: 'var(--font-label)' }}>
                {phase.title}
              </span>
              <span className="material-symbols-outlined text-[16px]">radio_button_unchecked</span>
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
            onClick={() => onNavigate({ page: 'prd', section: 'overview' })}
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
