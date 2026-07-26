import { useMemo, useState } from 'react'
import type { View } from '../hooks/useViewState'
import { PHASES } from '../data/phases'
import { BrandMark } from '../components/BrandMark'
import {
  CANVAS_PHASES,
  type CanvasPhaseId,
} from '../data/canvasPhases'
import {
  documentHasContent,
  toCanvasDocument,
  type CanvasDocument,
} from '../types/document'
import { useCodeIndex } from '../hooks/useCodeIndex'
import { loadProfile, profileInitials } from '../utils/profile'

interface HomePageProps {
  onNavigate: (view: View) => void
}

const PHASE_TILES: {
  phaseId: CanvasPhaseId
  icon: string
  label: string
  tagline: string
}[] = [
  { phaseId: 'project-charter', icon: 'bar_chart', label: 'Charter', tagline: 'Initiation' },
  { phaseId: 'prd', icon: 'description', label: 'PRD Creation', tagline: 'Requirements' },
  { phaseId: 'system-design', icon: 'account_tree', label: 'System Design', tagline: 'Blueprinting' },
  { phaseId: 'dev', icon: 'terminal', label: 'Development', tagline: 'Core Build' },
  { phaseId: 'qa', icon: 'biotech', label: 'QA', tagline: 'Verification' },
  { phaseId: 'post-dev', icon: 'rocket_launch', label: 'Post Dev', tagline: 'Deployment' },
]

function loadSavedDoc(phaseId: CanvasPhaseId): { doc: CanvasDocument | null; hasDraft: boolean } {
  try {
    const meta = CANVAS_PHASES[phaseId]
    const raw =
      localStorage.getItem(meta.storageKey) ??
      (meta.legacyStorageKey ? localStorage.getItem(meta.legacyStorageKey) : null)
    if (!raw) return { doc: null, hasDraft: false }
    const doc = toCanvasDocument(JSON.parse(raw))
    return { doc, hasDraft: documentHasContent(doc) }
  } catch {
    return { doc: null, hasDraft: false }
  }
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { hasDraft } = useMemo(() => loadSavedDoc('project-charter'), [])
  const { state, startIndexing, loadIndex, reset } = useCodeIndex()
  const [profile] = useState(() => loadProfile())

  return (
    <div className="home-desktop h-screen w-full overflow-hidden flex flex-col dither-bg">
      <div className="home-mac-window flex-1 min-h-0 m-2 md:m-3 border-2 border-on-background bg-white mac-window-shadow flex flex-col">
        <div className="flex items-center gap-2 border-b-2 border-on-background bg-secondary-container px-2 py-1 shrink-0">
          <div className="mac-striped-header flex-1 min-w-0" aria-hidden />
          <span className="px-1">
            <BrandMark size="sm" />
          </span>
          <div className="mac-striped-header flex-1 min-w-0" aria-hidden />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 md:p-6 border-b-2 border-on-background">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <BrandMark size="lg" className="mb-3" />
                <p className="text-sm text-on-surface-variant mb-4 max-w-md">
                  Select a pipeline stage below or resume your active project.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'project-charter' })}
                  className="border-2 border-on-background bg-primary text-on-primary font-bold px-6 py-2 text-sm outset-button hover:opacity-90"
                  style={{ fontFamily: 'var(--font-label)' }}
                >
                  {hasDraft ? 'Resume Charter' : 'Launch New Pipeline'}
                </button>
              </div>

              <button
                type="button"
                className="home-profile-panel border-2 border-on-background bg-surface-container-low inset-field p-3 min-w-[200px] text-left"
                onClick={() => onNavigate({ page: 'profile' })}
                title="Open profile"
              >
                <div
                  className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2"
                  style={{ fontFamily: 'var(--font-label)' }}
                >
                  Profile
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 border-2 border-on-background bg-primary text-on-primary flex items-center justify-center text-xs font-bold mac-window-shadow shrink-0"
                    style={{ fontFamily: 'var(--font-label)' }}
                    aria-hidden
                  >
                    {profileInitials(profile.name)}
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block font-bold text-sm text-on-background truncate"
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
                      {profile.name}
                    </span>
                    <span
                      className="block text-[11px] text-on-surface-variant truncate"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      {profile.role}
                    </span>
                    <span
                      className="block text-[10px] text-primary mt-0.5 font-bold"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      Open profile…
                    </span>
                  </span>
                </div>
              </button>
            </div>
          </div>

          {hasDraft && (
            <div className="border-b-2 border-on-background bg-surface-container-low px-4 md:px-6 py-2 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-on-surface-variant" style={{ fontFamily: 'var(--font-label)' }}>
                Active draft on disk
              </span>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'project-charter' })}
                className="border-2 border-on-background bg-primary text-on-primary font-bold px-4 py-1 text-xs outset-button"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Open Charter
              </button>
            </div>
          )}

          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-bold tracking-widest text-on-surface-variant uppercase"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Pipeline Phases
              </span>
              <div className="flex-1 h-px bg-on-background/30" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border-2 border-on-background">
              {PHASE_TILES.map((tile) => {
                const phase = PHASES.find((p) => p.id === tile.phaseId)
                if (!phase) return null
                return (
                  <button
                    key={tile.phaseId}
                    type="button"
                    onClick={() => onNavigate({ page: tile.phaseId })}
                    className="border border-on-background p-4 bg-white hover:bg-surface-container-low transition-colors group min-h-[110px] flex flex-col text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-on-background group-hover:text-primary mb-3">
                      {tile.icon}
                    </span>
                    <h3 className="font-bold text-sm text-on-background mb-0.5" style={{ fontFamily: 'var(--font-headline)' }}>
                      {tile.label}
                    </h3>
                    <p className="text-[11px] font-semibold text-on-background/75" style={{ fontFamily: 'var(--font-label)' }}>
                      {tile.tagline}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="px-4 md:px-6 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-bold tracking-widest text-on-surface-variant uppercase"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Codebase Index
              </span>
              <div className="flex-1 h-px bg-on-background/30" />
            </div>
            <div className="border-2 border-on-background bg-surface-container-low p-3 inset-field">
              {state.status === 'idle' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={startIndexing}
                    className="border-2 border-on-background bg-primary text-on-primary font-bold px-4 py-1 text-xs outset-button"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Index Codebase
                  </button>
                  <button
                    type="button"
                    onClick={loadIndex}
                    className="border-2 border-on-background bg-white text-on-background font-bold px-4 py-1 text-xs outset-button"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Load Cached
                  </button>
                </div>
              )}

              {state.status === 'indexing' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase" style={{ fontFamily: 'var(--font-label)' }}>
                      {state.phase.replace(/-/g, ' ')}
                    </span>
                    <span className="text-xs text-on-surface-variant" style={{ fontFamily: 'var(--font-label)' }}>
                      {Math.round(state.percent)}%
                    </span>
                  </div>
                  <div className="w-full h-4 border-2 border-on-background inset-field p-[2px] bg-white">
                    <div className="h-full bg-primary" style={{ width: `${state.percent}%` }} />
                  </div>
                </div>
              )}

              {state.status === 'done' && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-on-surface-variant mr-auto" style={{ fontFamily: 'var(--font-label)' }}>
                    {state.summary.totalFiles} files · {state.summary.totalTypes} types
                  </span>
                  <button
                    type="button"
                    onClick={startIndexing}
                    className="border-2 border-on-background bg-primary text-on-primary font-bold px-3 py-0.5 text-xs outset-button"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Re-index
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="border-2 border-on-background bg-white font-bold px-3 py-0.5 text-xs outset-button"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {state.status === 'error' && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-red-700 font-bold mr-auto" style={{ fontFamily: 'var(--font-label)' }}>
                    {state.message}
                  </span>
                  <button
                    type="button"
                    onClick={reset}
                    className="border-2 border-on-background bg-white font-bold px-3 py-0.5 text-xs outset-button"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
