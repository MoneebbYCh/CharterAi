import { SYSTEM_DESIGN_SECTION_LABELS } from '../../types/systemDesignForm'
import type { SystemDesignFormData } from '../../types/systemDesignForm'
import {
  getGateStatus,
  getOverallProgress,
  getSectionValidator,
  isDesignApproved,
  validateSections1to5,
} from '../../utils/systemDesignValidation'
import type { SystemDesignView } from './SystemDesignSidebar'

interface Props {
  data: SystemDesignFormData
  onNavigate: (view: SystemDesignView, highlightMissing?: boolean) => void
  onProceedToDev?: () => void
}

export function SystemDesignOverview({ data, onNavigate, onProceedToDev }: Props) {
  const { percent } = getOverallProgress(data)
  const status = getGateStatus(data)
  const locked = !validateSections1to5(data)
  const approved = isDesignApproved(data)

  const statusLabel =
    status === 'approved'
      ? 'APPROVED'
      : status === 'in-review'
        ? 'IN REVIEW'
        : status === 'needs-revision'
          ? 'REVISION'
          : 'DRAFT'

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="border-2 border-on-background bg-white mac-window-shadow mb-4">
        <div className="mac-striped-header border-b border-on-background" />
        <div className="flex justify-between items-center px-4 py-2 bg-surface-container border-b-2 border-on-background">
          <span className="font-bold text-xs" style={{ fontFamily: 'var(--font-label)' }}>
            SYSTEM DESIGN — OVERVIEW
          </span>
          <span className="text-xs font-bold px-2 py-0.5 border border-on-background">{statusLabel}</span>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <div className="flex justify-between text-xs font-bold mb-1" style={{ fontFamily: 'var(--font-label)' }}>
              <span>Completion</span>
              <span>{percent}%</span>
            </div>
            <div className="h-3 border-2 border-on-background bg-surface-container">
              <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SYSTEM_DESIGN_SECTION_LABELS.map((section) => {
              const v = getSectionValidator(section.id)(data)
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onNavigate(section.id, !v.complete)}
                  className="text-left border-2 border-on-background bg-white p-3 hover:bg-surface-container transition-all"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-label)' }}>
                      {String(section.id).padStart(2, '0')} {section.title}
                    </span>
                    <span className="text-[10px] font-bold">
                      {v.complete ? '✓ Complete' : `${v.filled}/${v.total}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant opacity-70 mt-1">{section.subtitle}</p>
                </button>
              )
            })}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onNavigate(1)}
              className="outset-button border-2 border-on-background bg-primary text-on-primary px-4 py-2 text-xs font-bold"
              style={{ fontFamily: 'var(--font-label)' }}
            >
              {percent > 0 ? 'Continue Editing →' : 'Start System Design →'}
            </button>
            {approved && onProceedToDev && (
              <button
                type="button"
                onClick={onProceedToDev}
                className="outset-button border-2 border-on-background bg-white px-4 py-2 text-xs font-bold"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Proceed to Development →
              </button>
            )}
            {locked && (
              <p className="text-[11px] text-on-surface-variant opacity-70 text-center">
                Complete sections 1–5 to unlock sign-off.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
