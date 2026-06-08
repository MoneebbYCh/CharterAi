import type { View } from '../hooks/useViewState'
import type { Phase } from '../data/phases'

interface Props {
  phase: Phase
  onNavigate: (view: View) => void
}

export function PhasePlaceholderPage({ phase, onNavigate }: Props) {
  return (
    <div className="placeholder-layout">
      <div className="placeholder-window mac-window">
        <div className="mac-titlebar">
          <span className="mac-titlebar-text">
            Phase {phase.number} — {phase.title}
          </span>
          <div className="mac-titlebar-stripes" />
        </div>
        <div className="placeholder-content">
          <button
            type="button"
            onClick={() => onNavigate({ page: 'home' })}
            className="back-link"
          >
            ← All Phases
          </button>
          <div className="placeholder-icon">🚧</div>
          <h1>{phase.title}</h1>
          <p className="placeholder-subtitle">{phase.subtitle}</p>
          <p className="placeholder-desc">{phase.description}</p>
          <div className="coming-soon-badge mac-inset">
            Coming Soon
          </div>
          <p className="placeholder-note">
            This phase is not built yet. Complete Phase 1 (Project Charter) and approve the gate review first.
          </p>
          <button
            type="button"
            onClick={() => onNavigate({ page: 'project-charter', section: 'overview' })}
            className="btn-primary placeholder-cta"
          >
            Go to Project Charter →
          </button>
        </div>
      </div>
    </div>
  )
}
