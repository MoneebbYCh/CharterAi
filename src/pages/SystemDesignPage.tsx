import { useState } from 'react'
import type { View } from '../hooks/useViewState'
import { PipelineFooter, PipelineHeader } from '../components/layout/PipelineChrome'
import { SystemDesignOverview } from '../components/system-design-sections/SystemDesignOverview'
import { SystemDesignSidebar, type SystemDesignView } from '../components/system-design-sections/SystemDesignSidebar'
import {
  SystemDesignSection1,
  SystemDesignSection2,
  SystemDesignSection3,
} from '../components/system-design-sections/SystemDesignSections1-3'
import {
  SystemDesignSection4,
  SystemDesignSection5,
  SystemDesignSection6,
} from '../components/system-design-sections/SystemDesignSections4-6'
import { ValidationContext } from '../context/ValidationContext'
import { useSystemDesignFormState } from '../hooks/useSystemDesignFormState'

interface SystemDesignPageProps {
  onNavigate: (view: View) => void
  goHome: () => void
}

const SECTION_COUNT = 6

export function SystemDesignPage({ onNavigate, goHome }: SystemDesignPageProps) {
  const { data, update, saveNow, lastSaved, isDirty } = useSystemDesignFormState()
  const [activeView, setActiveView] = useState<SystemDesignView>('overview')
  const [showValidation, setShowValidation] = useState(false)

  const navigateTo = (view: SystemDesignView, highlightMissing = false) => {
    setActiveView(view)
    setShowValidation(highlightMissing)
  }

  const handleExport = () => {
    saveNow()
  }

  const handleSignOff = () => {
    setActiveView(SECTION_COUNT)
    setShowValidation(false)
  }

  const goNext = () => {
    if (activeView === 'overview') {
      setShowValidation(false)
      setActiveView(1)
      return
    }
    if (typeof activeView === 'number') {
      if (activeView === SECTION_COUNT) {
        saveNow()
        onNavigate({ page: 'placeholder', phaseId: 'dev' })
        return
      }
      setShowValidation(false)
      setActiveView(activeView + 1)
    }
  }

  const goPrev = () => {
    setShowValidation(false)
    if (activeView === 1) setActiveView('overview')
    else if (typeof activeView === 'number' && activeView > 1) setActiveView(activeView - 1)
  }

  return (
    <div className="min-h-screen bg-surface-dim">
      <PipelineHeader
        onExport={handleExport}
        onSave={saveNow}
        onHome={goHome}
        saveLabel={isDirty ? 'Saving…' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Save Draft'}
      />

      <div className="flex items-start">
        <SystemDesignSidebar data={data} activeView={activeView} onNavigate={navigateTo} />

        <main className="flex-1 px-4 md:px-8 py-6 min-w-0">
          <div className="w-full max-w-6xl mx-auto">
            {activeView === 'overview' ? (
              <SystemDesignOverview
                data={data}
                onNavigate={navigateTo}
                onProceedToDev={() => onNavigate({ page: 'placeholder', phaseId: 'dev' })}
              />
            ) : (
              <div className="w-full">
                <div className="border-2 border-on-background bg-white mac-window-shadow mb-4">
                  <div className="mac-striped-header border-b border-on-background" />
                  <div className="flex justify-between items-center px-4 py-2 bg-surface-container border-b-2 border-on-background">
                    <span className="font-bold text-xs" style={{ fontFamily: 'var(--font-label)' }}>
                      SECTION {String(activeView).padStart(2, '0')} — SYSTEM DESIGN
                    </span>
                    <span className="text-xs text-on-surface-variant" style={{ fontFamily: 'var(--font-label)' }}>
                      {activeView} of {SECTION_COUNT}
                    </span>
                  </div>
                </div>

                <div className="border-2 border-on-background bg-white mac-window-shadow p-6 md:p-8 lg:px-10 charter-form">
                  <ValidationContext.Provider value={showValidation}>
                    {activeView === 1 && <SystemDesignSection1 data={data} update={update} />}
                    {activeView === 2 && <SystemDesignSection2 data={data} update={update} />}
                    {activeView === 3 && <SystemDesignSection3 data={data} update={update} />}
                    {activeView === 4 && <SystemDesignSection4 data={data} update={update} />}
                    {activeView === 5 && <SystemDesignSection5 data={data} update={update} />}
                    {activeView === 6 && <SystemDesignSection6 data={data} update={update} />}
                  </ValidationContext.Provider>
                </div>

                <div className="flex justify-between items-center mt-6 gap-4 max-w-md mx-auto w-full">
                  <button
                    type="button"
                    onClick={goPrev}
                    className="outset-button border-2 border-on-background bg-white px-4 py-1 text-xs font-bold"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="outset-button border-2 border-on-background bg-primary text-on-primary px-4 py-1 text-xs font-bold"
                    style={{ fontFamily: 'var(--font-label)' }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <PipelineFooter gateStatus="open" onExportPdf={handleExport} onSignOff={handleSignOff} onNavigate={onNavigate} />
    </div>
  )
}
