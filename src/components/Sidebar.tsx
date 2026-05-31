import { SECTION_LABELS } from '../data/formDefaults'
import { getSectionValidator, getOverallProgress, validateSections1to7 } from '../utils/validation'
import type { FormData } from '../types/form'

interface SidebarProps {
  activeSection: number
  onNavigate: (section: number) => void
  data: FormData
}

export function Sidebar({ activeSection, onNavigate, data }: SidebarProps) {
  const { percent } = getOverallProgress(data)
  const gateLocked = !validateSections1to7(data)

  return (
    <>
      <div className="sidebar-brand">
        <span className="brand-name">Project Charter</span>
        <p className="brand-tagline">Pre-System Design</p>
      </div>

      <div className="progress-block">
        <div className="progress-label">
          <span>Overall Progress</span>
          <span>{percent}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <nav className="section-nav">
        {SECTION_LABELS.map((section) => {
          const validation = getSectionValidator(section.id)(data)
          const isGate = section.id === 8
          const locked = isGate && gateLocked

          return (
            <button
              key={section.id}
              type="button"
              className={`nav-item ${activeSection === section.id ? 'active' : ''} ${validation.complete ? 'complete' : ''} ${locked ? 'locked' : ''}`}
              onClick={() => !locked && onNavigate(section.id)}
              disabled={locked}
              title={locked ? 'Complete Sections 1–7 first' : undefined}
            >
              <span className="nav-number">{String(section.id).padStart(2, '0')}</span>
              <span className="nav-text">
                <strong>{section.title}</strong>
                <small>{section.subtitle}</small>
              </span>
              <span className="nav-status">
                {locked ? '🔒' : validation.complete ? '✓' : `${validation.filled}/${validation.total}`}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
