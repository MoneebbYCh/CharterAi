import { useMemo } from 'react'
import type { View } from '../hooks/useViewState'
import { PHASES } from '../data/phases'
import { STORAGE_KEY } from '../data/formDefaults'
import { getGateStatus, getOverallProgress, isPhaseUnlocked, isProjectCharterComplete } from '../utils/validation'
import type { FormData } from '../types/form'
import { useCodeIndex } from '../hooks/useCodeIndex'

interface HomePageProps {
  onNavigate: (view: View) => void
}

const PHASE_TILES = [
  { phaseId: 'project-charter', icon: 'bar_chart', label: 'Charter', tagline: 'Initiation' },
  { phaseId: 'prd', icon: 'description', label: 'PRD Creation', tagline: 'Requirements' },
  { phaseId: 'system-design', icon: 'account_tree', label: 'System Design', tagline: 'Blueprinting' },
  { phaseId: 'dev', icon: 'terminal', label: 'Development', tagline: 'Core Build' },
  { phaseId: 'qa', icon: 'biotech', label: 'QA', tagline: 'Verification' },
  { phaseId: 'post-dev', icon: 'rocket_launch', label: 'Post Dev', tagline: 'Deployment' },
]

function loadSavedProject(): { data: FormData | null; percent: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { data: null, percent: 0 }
    const data = JSON.parse(raw) as FormData
    return { data, percent: getOverallProgress(data).percent }
  } catch {
    return { data: null, percent: 0 }
  }
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { data, percent } = useMemo(() => loadSavedProject(), [])
  const { state, startIndexing, loadIndex, reset } = useCodeIndex()

  const projectName = data?.section1.projectName.trim() || 'Untitled Project'
  const projectCode = data?.section1.projectCode.trim() || 'No ID'
  const hasDraft = Boolean(data?.section1.projectName || data?.section1.submittedBy)
  const gateStatus = data ? getGateStatus(data) : 'draft'
  const phase1Complete = data ? isProjectCharterComplete(data) : false

  return (
    <div className="min-h-full bg-surface-dim pb-10">
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="border-2 border-on-background bg-white mac-window-shadow">
          <div className="p-6 md:p-8 border-b-2 border-on-background">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h1
                  className="text-3xl md:text-4xl font-extrabold text-on-background mb-3 leading-tight"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  Project Pipeline
                </h1>
                <p className="text-sm text-on-surface-variant mb-6">
                  Select a pipeline stage below or resume your active project.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate({ page: 'project-charter', section: 'overview' })}
                    className="border-2 border-on-background bg-primary text-on-primary font-bold px-6 py-2 text-sm outset-button hover:opacity-90 transition-opacity"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Launch New Pipeline
                  </button>
                </div>
              </div>
              {hasDraft && (
                <div className="hidden sm:flex flex-col items-end gap-1">
                  <span className="text-xs text-primary font-bold" style={{ fontFamily: 'var(--font-label)' }}>
                    {projectName}
                  </span>
                  <span className="text-xs text-on-surface-variant" style={{ fontFamily: 'var(--font-label)' }}>
                    {projectCode} · {percent}% complete
                  </span>
                  <div className="w-36 h-4 border-2 border-on-background inset-field p-[2px] bg-white mt-1">
                    <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {hasDraft && (
            <div className="border-b-2 border-on-background bg-surface-container-low px-6 py-3 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-on-surface-variant" style={{ fontFamily: 'var(--font-label)' }}>
                Active project: <strong className="text-on-background">{projectName}</strong> ({projectCode})
              </span>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'project-charter', section: 'overview' })}
                className="border-2 border-on-background bg-primary text-on-primary font-bold px-4 py-1 text-xs outset-button"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Resume Charter
              </button>
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-xs font-bold tracking-widest text-on-surface-variant uppercase"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Pipeline Phases
              </span>
              <div className="flex-1 h-px bg-on-background/20" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border-2 border-on-background">
              {PHASE_TILES.map((tile) => {
                const phase = PHASES.find((p) => p.id === tile.phaseId)
                if (!phase) return null
                const unlocked = isPhaseUnlocked(tile.phaseId, data)

                const inner = (
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <span className="material-symbols-outlined text-on-background group-hover:text-primary transition-colors">
                        {tile.icon}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${unlocked ? 'text-primary' : 'text-on-surface-variant'}`}
                        style={{ fontFamily: 'var(--font-label)' }}
                      >
                        {unlocked ? 'READY' : 'LOCKED'}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mb-0.5" style={{ fontFamily: 'var(--font-headline)' }}>
                      {tile.label}
                    </h3>
                    <p className="text-[11px] text-on-surface-variant" style={{ fontFamily: 'var(--font-label)' }}>
                      {tile.tagline}
                    </p>
                  </>
                )

                if (!unlocked) {
                  return (
                    <div
                      key={tile.phaseId}
                      title="Complete and approve the gate review first"
                      className="border border-on-background p-4 bg-surface-container-low opacity-60 min-h-[120px] flex flex-col cursor-not-allowed"
                    >
                      {inner}
                    </div>
                  )
                }

                return (
                  <button
                    key={tile.phaseId}
                    type="button"
                    onClick={() => {
                      if (tile.phaseId === 'project-charter') onNavigate({ page: 'project-charter', section: 'overview' })
                      else if (tile.phaseId === 'prd') onNavigate({ page: 'prd', section: 'overview' })
                      else if (tile.phaseId === 'system-design') onNavigate({ page: 'system-design', section: 'overview' })
                      else onNavigate({ page: 'placeholder', phaseId: tile.phaseId })
                    }}
                    className="border border-on-background p-4 bg-white hover:bg-surface-container-low transition-colors group min-h-[120px] flex flex-col text-left cursor-pointer"
                  >
                    {inner}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-xs font-bold tracking-widest text-on-surface-variant uppercase"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Knowledge Graph
              </span>
              <div className="flex-1 h-px bg-on-background/20" />
            </div>
            <div className="border-2 border-on-background bg-surface-container-low p-4">
              {state.status === 'idle' && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={startIndexing}
                    className="border-2 border-on-background bg-primary text-on-primary font-bold px-5 py-1.5 text-sm outset-button hover:opacity-90 transition-opacity"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Index Codebase
                  </button>
                  <button
                    type="button"
                    onClick={loadIndex}
                    className="border-2 border-on-background bg-white text-on-background font-bold px-4 py-1.5 text-sm outset-button hover:bg-surface-container-low transition-colors"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Load Cached
                  </button>
                  <span className="text-[11px] text-on-surface-variant" style={{ fontFamily: 'var(--font-label)' }}>
                    Scan workspace with madar + TypeScript AST
                  </span>
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
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${state.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {state.status === 'done' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatBox label="Files" value={state.summary.totalFiles} />
                    <StatBox label="Types" value={state.summary.totalTypes} />
                    <StatBox label="Components" value={state.summary.totalComponents} />
                    <StatBox label="Hooks" value={state.summary.totalHooks} />
                    {state.graph && (
                      <>
                        <StatBox label="Graph Nodes" value={state.graph.nodes} />
                        <StatBox label="Graph Edges" value={state.graph.edges} />
                        <StatBox label="Communities" value={state.graph.communities} />
                      </>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={startIndexing}
                      className="border-2 border-on-background bg-primary text-on-primary font-bold px-4 py-1 text-xs outset-button hover:opacity-90 transition-opacity"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      Re-index
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className="border-2 border-on-background bg-white text-on-background font-bold px-4 py-1 text-xs outset-button hover:bg-surface-container-low transition-colors"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {state.status === 'error' && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-red-700 font-bold" style={{ fontFamily: 'var(--font-label)' }}>
                    {state.message}
                  </span>
                  <button
                    type="button"
                    onClick={reset}
                    className="border-2 border-on-background bg-white text-on-background font-bold px-4 py-1 text-xs outset-button hover:bg-surface-container-low transition-colors"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>

          {hasDraft && (
            <footer className="border-t-2 border-on-background bg-surface-container-highest flex flex-wrap justify-between items-center px-6 py-2 gap-2">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  gateStatus === 'approved' ? 'text-green-700' : gateStatus === 'open' ? 'text-primary' : 'text-on-surface-variant'
                }`}
                style={{ fontFamily: 'var(--font-label)' }}
              >
                {gateStatus === 'approved'
                  ? 'Phase 1 Complete'
                  : gateStatus === 'open'
                    ? 'Gate Open — Sign-off Required'
                    : 'Draft'}
              </span>
              <div className="flex gap-4 items-center">
                {phase1Complete && (
                  <button
                    type="button"
                    onClick={() => onNavigate({ page: 'prd', section: 'overview' })}
                    className="text-[11px] text-on-primary bg-primary border-2 border-on-background font-bold px-3 py-0.5"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Proceed to PRD →
                  </button>
                )}
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-2 border-on-background bg-white p-2 text-center">
      <div className="text-lg font-extrabold text-primary leading-none mb-0.5" style={{ fontFamily: 'var(--font-headline)' }}>
        {value}
      </div>
      <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: 'var(--font-label)' }}>
        {label}
      </div>
    </div>
  )
}
