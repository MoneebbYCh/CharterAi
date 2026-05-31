import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { PHASES } from '../data/phases'
import { STORAGE_KEY } from '../data/formDefaults'
import { getGateStatus, getOverallProgress, isPhaseUnlocked, isPreSystemDesignComplete } from '../utils/validation'
import type { FormData } from '../types/form'

const PHASE_TILES = [
  { phaseId: 'pre-system-design', icon: 'bar_chart', label: 'Pre-System', tagline: 'Discovery Phase', activeCount: 1, accent: 'error' as const },
  { phaseId: 'prd', icon: 'description', label: 'PRD Creation', tagline: 'Requirements', activeCount: 0, accent: 'muted' as const },
  { phaseId: 'system-design', icon: 'account_tree', label: 'System Design', tagline: 'Blueprinting', activeCount: 0, accent: 'primary' as const },
  { phaseId: 'dev', icon: 'terminal', label: 'Development', tagline: 'Core Build', activeCount: 0, accent: 'error' as const },
  { phaseId: 'qa', icon: 'biotech', label: 'QA', tagline: 'Verification', activeCount: 0, accent: 'primary' as const },
  { phaseId: 'post-dev', icon: 'rocket_launch', label: 'Post Dev', tagline: 'Deployment', activeCount: 0, accent: 'muted' as const },
]

const ACTIVITY_FEED = [
  { time: '2M AGO', user: '@m_chen', action: 'updated charter section 04', alert: false },
  { time: '14M AGO', user: 'System', action: 'auto-saved draft to local storage', alert: false },
  { time: '1H AGO', user: '@dev_bot', action: 'completed gate review checklist', alert: false },
  { time: '3H AGO', user: 'System', action: 'Critical Alert: Storage threshold exceeded', alert: true },
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

function accentClass(accent: 'error' | 'primary' | 'muted') {
  if (accent === 'error') return 'text-error'
  if (accent === 'primary') return 'text-primary'
  return 'text-on-surface-variant'
}

export function HomePage() {
  const { data, percent } = useMemo(() => loadSavedProject(), [])

  const projectName = data?.section1.projectName.trim() || 'Untitled Project'
  const projectCode = data?.section1.projectCode.trim() || 'No ID'
  const hasDraft = Boolean(data?.section1.projectName || data?.section1.submittedBy)
  const gateStatus = data ? getGateStatus(data) : 'draft'
  const phase1Complete = data ? isPreSystemDesignComplete(data) : false

  return (
    <div className="min-h-screen bg-surface-dim pb-10">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="border-2 border-on-background bg-white mac-window-shadow">
          {/* System Welcome header */}
          <div className="border-b-2 border-on-background">
            <div className="mac-striped-header border-b border-on-background" />
            <div
              className="px-4 py-1 text-[11px] font-bold tracking-widest text-on-surface-variant"
              style={{ fontFamily: 'var(--font-label)' }}
            >
              SYSTEM WELCOME
            </div>
          </div>

          <div className="grid grid-cols-12 gap-0">
            {/* Main column */}
            <div className="col-span-12 lg:col-span-8 border-r-0 lg:border-r-2 border-on-background">
              {/* Hero */}
              <div className="p-6 md:p-8 border-b-2 border-on-background grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <h1
                    className="text-3xl md:text-4xl font-extrabold text-on-background mb-3 leading-tight"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    Welcome to Project Pipeline
                  </h1>
                  <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                    System status: <strong className="text-on-background">OPTIMAL</strong>. Select a pipeline stage
                    below or resume your active project. All phases gate sequentially — complete each before
                    advancing.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to="/pre-system-design"
                      className="border-2 border-on-background bg-primary text-on-primary font-bold px-6 py-2 text-sm outset-button hover:opacity-90 transition-opacity"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      Launch New Pipeline
                    </Link>
                    <button
                      type="button"
                      className="border-2 border-on-background bg-white text-on-background font-bold px-6 py-2 text-sm outset-button"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      View Archive
                    </button>
                  </div>
                </div>
                <div className="hidden md:flex justify-center">
                  <div className="border-2 border-on-background bg-surface-container p-3 mac-window-shadow w-full max-w-[220px]">
                    <div className="mac-striped-header border border-on-background mb-2" />
                    <div className="border-2 border-on-background bg-[#1a1a1a] aspect-[4/3] flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-30 dither-bg" />
                      <div className="text-green-400 text-[10px] font-mono p-2 leading-tight z-10" style={{ fontFamily: 'var(--font-label)' }}>
                        &gt; pipeline.init()<br />
                        &gt; status: READY<br />
                        &gt; phases: 6<br />
                        &gt; gate: ARMED
                      </div>
                    </div>
                    <div className="mt-2 h-3 border border-on-background bg-surface-container-highest" />
                  </div>
                </div>
              </div>

              {/* Resume Active Project */}
              <div className="border-b-2 border-on-background">
                <div className="mac-striped-header border-b border-on-background" />
                <div
                  className="px-4 py-1 text-[11px] font-bold tracking-widest text-on-surface-variant border-b border-on-background"
                  style={{ fontFamily: 'var(--font-label)' }}
                >
                  RESUME ACTIVE PROJECT
                </div>
                <div className="p-6">
                  {hasDraft ? (
                    <div className="border-2 border-on-background p-5 flex flex-col md:flex-row gap-5 items-start md:items-center">
                      <div className="w-16 h-16 border-2 border-on-background bg-primary/10 flex items-center justify-center flex-shrink-0 mac-window-shadow">
                        <span className="material-symbols-outlined text-primary text-3xl">settings_suggest</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h2 className="text-lg font-bold truncate" style={{ fontFamily: 'var(--font-headline)' }}>
                            {projectName}
                          </h2>
                          <span
                            className="text-[10px] font-bold border border-on-background px-2 py-0.5 bg-surface-container"
                            style={{ fontFamily: 'var(--font-label)' }}
                          >
                            PHASE: PRE-SYSTEM DESIGN
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mb-3" style={{ fontFamily: 'var(--font-label)' }}>
                          {projectCode} · {percent}% complete · Saved in browser
                        </p>
                        <div className="w-full max-w-md h-4 border-2 border-on-background inset-field p-[2px] bg-white mb-4">
                          <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
                        </div>
                        <Link
                          to="/pre-system-design"
                          className="inline-block border-2 border-on-background bg-primary text-on-primary font-bold px-5 py-1.5 text-xs outset-button"
                          style={{ fontFamily: 'var(--font-label)' }}
                        >
                          JUMP TO CHARTER
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-on-background border-dashed p-8 text-center bg-surface-container-low">
                      <p className="text-sm text-on-surface-variant mb-4">No active project in browser storage.</p>
                      <Link
                        to="/pre-system-design"
                        className="inline-block border-2 border-on-background bg-primary text-on-primary font-bold px-5 py-1.5 text-xs outset-button"
                        style={{ fontFamily: 'var(--font-label)' }}
                      >
                        Launch New Pipeline
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Phase grid */}
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border-2 border-on-background">
                  {PHASE_TILES.map((tile) => {
                    const phase = PHASES.find((p) => p.id === tile.phaseId)!
                    const unlocked = isPhaseUnlocked(tile.phaseId, data)
                    const count =
                      tile.phaseId === 'pre-system-design' && hasDraft
                        ? 1
                        : tile.phaseId === 'prd' && phase1Complete
                          ? 1
                          : tile.activeCount

                    const inner = (
                      <>
                        <div className="flex justify-between items-start mb-3">
                          <span className="material-symbols-outlined text-on-background group-hover:text-primary transition-colors">
                            {tile.icon}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${unlocked ? accentClass(tile.accent) : 'text-on-surface-variant'}`}
                            style={{ fontFamily: 'var(--font-label)' }}
                          >
                            {unlocked ? (count > 0 ? `${count} ACTIVE` : 'UNLOCKED') : 'LOCKED'}
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
                          title="Complete and approve the gate review in Pre-System Design first"
                          className="border border-on-background p-4 bg-surface-container-low opacity-60 min-h-[120px] flex flex-col cursor-not-allowed"
                        >
                          {inner}
                        </div>
                      )
                    }

                    return (
                      <Link
                        key={tile.phaseId}
                        to={phase.path}
                        className="border border-on-background p-4 bg-white hover:bg-surface-container-low transition-colors group min-h-[120px] flex flex-col no-underline text-inherit"
                      >
                        {inner}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-span-12 lg:col-span-4 flex flex-col">
              {/* System Status */}
              <div className="border-b-2 border-on-background flex-1">
                <div className="mac-striped-header border-b border-on-background" />
                <div
                  className="px-4 py-1 text-[11px] font-bold tracking-widest text-on-surface-variant border-b border-on-background"
                  style={{ fontFamily: 'var(--font-label)' }}
                >
                  SYSTEM STATUS
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-label)' }}>
                      Server Core
                    </span>
                    <span
                      className="text-[10px] font-bold bg-green-100 border border-green-800 text-green-800 px-2 py-0.5"
                      style={{ fontFamily: 'var(--font-label)' }}
                    >
                      ONLINE
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs" style={{ fontFamily: 'var(--font-label)' }}>
                    <span className="font-bold">Latency</span>
                    <span>24ms</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1" style={{ fontFamily: 'var(--font-label)' }}>
                      <span className="font-bold">CPU LOAD</span>
                      <span>44%</span>
                    </div>
                    <div className="h-3 border border-on-background inset-field bg-white p-[1px]">
                      <div className="h-full bg-primary" style={{ width: '44%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1" style={{ fontFamily: 'var(--font-label)' }}>
                      <span className="font-bold">STORAGE</span>
                      <span className="text-error font-bold">88%</span>
                    </div>
                    <div className="h-3 border border-on-background inset-field bg-white p-[1px]">
                      <div className="h-full bg-error" style={{ width: '88%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="flex-1 flex flex-col min-h-[280px]">
                <div className="mac-striped-header border-b border-on-background" />
                <div
                  className="px-4 py-1 text-[11px] font-bold tracking-widest text-on-surface-variant border-b border-on-background"
                  style={{ fontFamily: 'var(--font-label)' }}
                >
                  ACTIVITY FEED
                </div>
                <div className="p-4 flex-1 dither-bg overflow-y-auto">
                  <ul className="space-y-3">
                    {ACTIVITY_FEED.map((item, i) => (
                      <li
                        key={i}
                        className={`text-[11px] leading-snug ${item.alert ? 'border-l-2 border-error pl-2' : ''}`}
                        style={{ fontFamily: 'var(--font-label)' }}
                      >
                        <span className="text-on-secondary-container">{item.time}</span>{' '}
                        <span className="font-bold">{item.user}</span>{' '}
                        <span className={item.alert ? 'text-error font-bold' : ''}>{item.action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 border-t border-on-background bg-surface-container">
                  <button
                    type="button"
                    className="text-[11px] text-primary font-bold underline bg-transparent border-0 cursor-pointer"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    View Full Log
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t-2 border-on-background bg-surface-container-highest flex flex-wrap justify-between items-center px-6 py-2 gap-2">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                gateStatus === 'approved'
                  ? 'text-green-700'
                  : gateStatus === 'open'
                    ? 'text-primary'
                    : 'text-error'
              }`}
              style={{ fontFamily: 'var(--font-label)' }}
            >
              {gateStatus === 'approved'
                ? 'Phase 1 Complete'
                : gateStatus === 'open'
                  ? 'Gate Open — Sign-off Required'
                  : 'Review Required'}
            </span>
            <div className="flex gap-4 items-center">
              {phase1Complete && (
                <Link
                  to="/prd"
                  className="text-[11px] text-on-primary bg-primary border-2 border-on-background font-bold px-3 py-0.5 no-underline"
                  style={{ fontFamily: 'var(--font-label)' }}
                >
                  Proceed to PRD →
                </Link>
              )}
              <button
                type="button"
                className="text-[11px] text-on-surface-variant hover:text-primary bg-transparent border-0 cursor-pointer"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Export JSON
              </button>
              <Link
                to="/pre-system-design"
                className="text-[11px] text-on-surface-variant hover:text-primary no-underline"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Generate PDF
              </Link>
              <Link
                to="/pre-system-design"
                className="text-[11px] text-on-surface-variant hover:text-primary font-bold underline"
                style={{ fontFamily: 'var(--font-label)' }}
              >
                Sign-off
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
