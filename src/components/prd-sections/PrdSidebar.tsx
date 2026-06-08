import type { FormData } from '../../types/form'
import { PRD_SECTION_LABELS } from '../../types/prdForm'
import type { PrdFormData } from '../../types/prdForm'
import { getPrdSectionValidator } from '../../utils/prdValidation'

export type PrdView = 'overview' | number

interface PrdSidebarProps {
  data: PrdFormData
  activeView: PrdView
  onNavigate: (view: PrdView) => void
  charterData?: FormData | null
}

const SECTION_ICONS: Record<number, string> = {
  1: 'summarize',
  2: 'track_changes',
  3: 'group',
  4: 'featured_play_list',
  5: 'settings_suggest',
  6: 'storage',
  7: 'rocket_launch',
  8: 'verified',
}

export function PrdSidebar({ data, activeView, onNavigate, charterData }: PrdSidebarProps) {
  return (
    <aside className="sticky top-0 w-64 border-r-2 border-on-background bg-surface-container flex flex-col pt-4 z-40 shrink-0 self-start">
      <div className="px-4 mb-6">
        <h2 className="text-base font-bold text-on-background truncate" style={{ fontFamily: 'var(--font-headline)' }}>
          PRD Creation
        </h2>
        <p className="text-[11px] text-on-surface-variant opacity-70 truncate" style={{ fontFamily: 'var(--font-label)' }}>
          Product Requirements Document
        </p>
      </div>

      <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className={`text-left p-2 m-2 flex items-center gap-3 border-2 transition-all ${
            activeView === 'overview'
              ? 'border-on-background bg-surface text-primary font-bold mac-window-shadow'
              : 'border-transparent text-on-surface-variant hover:border-on-background hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-label)' }}>
            Overview
          </span>
        </button>

        {PRD_SECTION_LABELS.map((section) => {
          const validation = getPrdSectionValidator(section.id, charterData ?? null)(data)
          const isActive = activeView === section.id

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onNavigate(section.id)}
              className={`text-left p-2 m-2 flex items-center gap-3 border-2 transition-all ${
                isActive
                  ? 'border-on-background bg-surface text-primary font-bold mac-window-shadow'
                  : 'border-transparent text-on-surface-variant hover:border-on-background hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined">{SECTION_ICONS[section.id] ?? 'description'}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-bold truncate" style={{ fontFamily: 'var(--font-label)' }}>
                  {String(section.id).padStart(2, '0')} {section.title}
                </span>
                <span className="block text-[10px] opacity-70 truncate">{section.subtitle}</span>
              </span>
              <span className="text-[10px] font-bold">{validation.complete ? '✓' : `${validation.filled}/${validation.total}`}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
