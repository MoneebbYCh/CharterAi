import { SECTION_LABELS } from '../../data/formDefaults'
import { getSectionValidator } from '../../utils/validation'
import type { FormData } from '../../types/form'

export type PreSystemView = 'overview' | number

interface PhaseSidebarProps {
  data: FormData
  activeView: PreSystemView
  onNavigate: (view: PreSystemView) => void
}

const SECTION_ICONS: Record<number, string> = {
  1: 'badge',
  2: 'report',
  3: 'speed',
  4: 'groups',
  5: 'psychology',
  6: 'alt_route',
  7: 'warning',
  8: 'verified',
}

export function PhaseSidebar({ data, activeView, onNavigate }: PhaseSidebarProps) {
  const projectName = data.section1.projectName.trim() || 'Untitled Project'
  const projectCode = data.section1.projectCode.trim() || 'No ID assigned'

  return (
    <aside className="fixed left-0 top-24 h-[calc(100vh-6rem)] w-64 border-r-2 border-on-background bg-surface-container flex flex-col pt-4 z-40">
      <div className="px-4 mb-6">
        <h2 className="text-base font-bold text-on-background truncate" style={{ fontFamily: 'var(--font-headline)' }}>
          {projectName}
        </h2>
        <p className="text-[11px] text-on-surface-variant opacity-70 truncate" style={{ fontFamily: 'var(--font-label)' }}>
          {projectCode}
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

        {SECTION_LABELS.map((section) => {
          const validation = getSectionValidator(section.id)(data)
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
