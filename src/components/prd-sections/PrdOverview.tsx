import type { FormData } from '../../types/form'
import { PRD_SECTION_LABELS } from '../../types/prdForm'
import type { PrdFormData } from '../../types/prdForm'
import {
  getPrdGateStatus,
  getPrdOverallProgress,
  getPrdSectionValidator,
  isPrdApproved,
  validatePrdSections1to7,
} from '../../utils/prdValidation'
import type { PrdView } from './PrdSidebar'

interface PrdOverviewProps {
  data: PrdFormData
  onNavigate: (view: PrdView) => void
  charterData?: FormData | null
  onProceedToSystemDesign?: () => void
}

export function PrdOverview({ data, onNavigate, charterData, onProceedToSystemDesign }: PrdOverviewProps) {
  const cd = charterData ?? null
  const { percent } = getPrdOverallProgress(data, cd)
  const prdStatus = getPrdGateStatus(data)
  const prdLocked = !validatePrdSections1to7(data, cd)
  const prdApproved = isPrdApproved(data)
  const sectionValidator = (id: number) => getPrdSectionValidator(id, cd)

  const gateStatusLabel =
    prdStatus === 'approved'
      ? 'APPROVED'
      : prdStatus === 'draft'
        ? 'DRAFT'
        : prdStatus === 'in-review'
          ? 'IN REVIEW'
          : prdStatus === 'needs-revision'
            ? 'REVISION'
            : 'DRAFT'

  const gateStatusClass =
    prdStatus === 'approved'
      ? 'text-green-700'
      : prdStatus === 'in-review'
        ? 'text-primary'
        : 'text-error'

  const firstIncomplete = PRD_SECTION_LABELS.find((s) => !sectionValidator(s.id)(data).complete)?.id ?? 8

  const tasks = [
    {
      id: 3,
      title: 'Define User Personas',
      subtitle: sectionValidator(3)(data).complete ? 'Section 3 complete' : 'Section 3 — User personas',
      done: sectionValidator(3)(data).complete,
      section: 3 as PrdView,
    },
    {
      id: 4,
      title: 'Write Functional Requirements',
      subtitle: sectionValidator(4)(data).complete ? 'Section 4 complete' : 'Section 4 — Features & stories',
      done: sectionValidator(4)(data).complete,
      section: 4 as PrdView,
    },
    {
      id: firstIncomplete,
      title: 'PRD Creation',
      subtitle: `IN PROGRESS — ${PRD_SECTION_LABELS.find((s) => s.id === firstIncomplete)?.title ?? 'Review & Sign-off'}`,
      done: false,
      active: true,
      section: firstIncomplete as PrdView,
    },
    {
      id: 8,
      title: 'Review & Sign-off',
      subtitle: prdApproved
        ? 'PRD approved — proceed to System Design'
        : prdLocked
          ? 'Draft available — complete Sections 1–7 for sign-off'
          : 'Ready for review',
      done: prdApproved,
      section: 8 as PrdView,
    },
  ]

  return (
    <div className="grid grid-cols-12 gap-6 pb-12">
      {/* Active Phase Hero Window */}
      <div className="col-span-12 lg:col-span-8 border-2 border-on-background bg-white mac-window-shadow">
        <div className="flex flex-col border-b-2 border-on-background">
          <div className="mac-striped-header border-b border-on-background" />
          <div className="flex justify-between items-center px-4 py-2 bg-surface-container">
            <span className="font-bold text-xs flex items-center gap-2" style={{ fontFamily: 'var(--font-label)' }}>
              <span className="w-3 h-3 bg-primary animate-pulse" />
              ACTIVE PHASE: PRD CREATION
            </span>
            <div className="flex gap-1">
              <div className="w-4 h-4 border border-on-background bg-white" />
              <div className="w-4 h-4 border border-on-background bg-white" />
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-on-background mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
                Phase Overview
              </h1>
              <p className="text-base text-on-surface-variant max-w-xl">
                Transforming the approved project charter into a detailed product requirements document with
                user stories, acceptance criteria, and technical specifications.
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-primary font-bold mb-1" style={{ fontFamily: 'var(--font-label)' }}>
                COMPLETION: {percent}%
              </span>
              <div className="w-48 h-6 border-2 border-on-background inset-field p-[2px] bg-white">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onNavigate(task.section)}
                className={`text-left border p-4 flex gap-4 transition-all ${
                  task.active
                    ? 'border-2 border-on-background bg-white mac-window-shadow cursor-pointer hover:bg-surface-container-low'
                    : task.done
                      ? 'border border-on-background bg-surface-container-lowest cursor-pointer hover:bg-surface-container-high'
                      : 'border border-on-background bg-surface-container-lowest cursor-pointer hover:bg-surface-container-high'
                }`}
              >
                <div className="flex-shrink-0">
                  <div
                    className={`w-6 h-6 border-2 border-on-background flex items-center justify-center font-bold text-xs ${
                      task.done ? 'bg-primary text-on-primary' : 'bg-white'
                    }`}
                  >
                    {task.done ? '✓' : ''}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs" style={{ fontFamily: 'var(--font-label)' }}>
                    {task.title}
                  </h4>
                  <p
                    className={`text-[11px] ${task.active ? 'text-primary animate-pulse' : 'text-on-surface-variant'}`}
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    {task.subtitle}
                  </p>
                </div>
                {task.active && (
                  <span className="material-symbols-outlined text-primary self-center">arrow_forward</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <div className="border-2 border-on-background bg-white mac-window-shadow flex flex-col">
          <div className="border-b-2 border-on-background">
            <div className="mac-striped-header border-b border-on-background" />
            <div className="px-4 py-2 bg-secondary-container font-bold text-xs" style={{ fontFamily: 'var(--font-label)' }}>
              SECTION STATUS
            </div>
          </div>
          <div className="p-4 dither-bg max-h-48 overflow-y-auto">
            <ul className="space-y-2">
              {PRD_SECTION_LABELS.map((section) => {
                const v = sectionValidator(section.id)(data)
                return (
                  <li key={section.id} className="flex gap-2 text-[11px]" style={{ fontFamily: 'var(--font-label)' }}>
                    <span className="text-on-secondary-container w-6">{String(section.id).padStart(2, '0')}</span>
                    <span className="font-bold flex-1 truncate">{section.title}</span>
                    <span className={v.complete ? 'text-green-700' : 'text-on-surface-variant'}>
                      {v.complete ? 'DONE' : `${v.filled}/${v.total}`}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="border-2 border-on-background bg-white mac-window-shadow flex flex-col">
          <div className="border-b-2 border-on-background">
            <div className="mac-striped-header border-b border-on-background" />
            <div className="px-4 py-2 bg-secondary-container font-bold text-xs" style={{ fontFamily: 'var(--font-label)' }}>
              PRD STATUS
            </div>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="border border-on-background p-3 text-center">
              <p className="text-[11px] text-on-surface-variant uppercase" style={{ fontFamily: 'var(--font-label)' }}>
                Sections
              </p>
              <p className="text-lg font-bold">{PRD_SECTION_LABELS.filter((s) => sectionValidator(s.id)(data).complete).length}/8</p>
            </div>
            <div className="border border-on-background p-3 text-center">
              <p className="text-[11px] text-on-surface-variant uppercase" style={{ fontFamily: 'var(--font-label)' }}>
                Status
              </p>
              <p className={`text-lg font-bold ${gateStatusClass}`}>{gateStatusLabel}</p>
            </div>
            <div className="col-span-2">
              <div className="w-full h-2 border border-on-background bg-white inset-field">
                <div className="h-full bg-on-background transition-all" style={{ width: `${percent}%` }} />
              </div>
              <p className="text-center mt-2 text-[11px]" style={{ fontFamily: 'var(--font-label)' }}>
                PRD COMPLETION
              </p>
              {prdApproved && (
                <button
                  type="button"
                  onClick={onProceedToSystemDesign}
                  className="mt-4 block w-full text-center border-2 border-on-background bg-primary text-on-primary font-bold py-2 text-xs outset-button"
                  style={{ fontFamily: 'var(--font-label)' }}
                >
                  Proceed to System Design →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Workflow Map */}
      <section className="col-span-12 mt-4">
        <div className="border-2 border-on-background bg-white mac-window-shadow">
          <div className="border-b-2 border-on-background bg-secondary-container">
            <div className="mac-striped-header border-b border-on-background" />
            <div className="px-4 py-2 font-bold text-xs uppercase" style={{ fontFamily: 'var(--font-label)' }}>
              Visual Workflow Map
            </div>
          </div>
          <div className="relative h-48 w-full bg-[#eee] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container via-primary/5 to-surface-container opacity-60" />
            <div className="absolute inset-0 flex items-center justify-around p-8 md:p-12">
              {PRD_SECTION_LABELS.slice(0, 4).map((section, i) => {
                const complete = sectionValidator(section.id)(data).complete
                const isActive = section.id === firstIncomplete
                return (
                  <div key={section.id} className="contents">
                    {i > 0 && (
                      <div className={`w-8 md:w-16 h-1 bg-on-background ${complete ? '' : 'opacity-20'}`} />
                    )}
                    <div className={`flex flex-col items-center gap-2 ${!complete && !isActive ? 'opacity-30' : ''}`}>
                      <div
                        className={`border-2 border-on-background flex items-center justify-center font-bold mac-window-shadow ${
                          isActive
                            ? 'w-14 h-14 md:w-16 md:h-16 border-4 bg-white text-primary text-xl md:text-2xl relative'
                            : complete
                              ? 'w-10 h-10 md:w-12 md:h-12 bg-primary text-white text-base md:text-xl'
                              : 'w-10 h-10 md:w-12 md:h-12 bg-white text-on-background text-base md:text-xl'
                        }`}
                      >
                        {String(section.id).padStart(2, '0')}
                        {isActive && (
                          <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary animate-ping rounded-full" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] md:text-[11px] font-bold px-2 border border-on-background ${
                          isActive
                            ? 'bg-on-background text-white'
                            : complete
                              ? 'bg-white'
                              : 'bg-white'
                        }`}
                        style={{ fontFamily: 'var(--font-label)' }}
                      >
                        {isActive ? 'ACTIVE' : complete ? 'DONE' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
