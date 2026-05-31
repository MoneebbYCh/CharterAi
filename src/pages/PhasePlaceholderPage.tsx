import { Link } from 'react-router-dom'
import { STORAGE_KEY } from '../data/formDefaults'
import type { FormData } from '../types/form'
import type { Phase } from '../data/phases'
import { isPreSystemDesignComplete } from '../utils/validation'

interface Props {
  phase: Phase
}

function loadFormData(): FormData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as FormData
  } catch {
    return null
  }
}

export function PhasePlaceholderPage({ phase }: Props) {
  const data = loadFormData()
  const preSystemComplete = data ? isPreSystemDesignComplete(data) : false
  const isPrdUnlocked = phase.id === 'prd' && preSystemComplete

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
          <Link to="/" className="back-link">← All Phases</Link>
          <div className="placeholder-icon">🚧</div>
          <h1>{phase.title}</h1>
          <p className="placeholder-subtitle">{phase.subtitle}</p>
          <p className="placeholder-desc">{phase.description}</p>
          <div className="coming-soon-badge mac-inset">
            {isPrdUnlocked ? 'Unlocked — Form Coming Soon' : 'Coming Soon'}
          </div>
          <p className="placeholder-note">
            {isPrdUnlocked
              ? 'Gate review passed. PRD Creation is the next phase — the full form is not built yet, but you have unlocked this stage.'
              : 'This phase is not built yet. Complete Phase 1 (Pre-System Design) and approve the gate review first.'}
          </p>
          <Link to="/pre-system-design" className="btn-primary placeholder-cta">
            {isPrdUnlocked ? '← Back to Charter' : 'Go to Pre-System Design →'}
          </Link>
        </div>
      </div>
    </div>
  )
}
