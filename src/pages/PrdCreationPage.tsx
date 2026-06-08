import { useState } from 'react'
import type { View } from '../hooks/useViewState'
import { PrdSection1, PrdSection2, PrdSection3, PrdSection4 } from '../components/prd-sections/PrdSection1-4'
import { PrdSection5, PrdSection6, PrdSection7, PrdSection8 } from '../components/prd-sections/PrdSection5-8'
import { PipelineFooter, PipelineHeader } from '../components/layout/PipelineChrome'
import { PrdOverview } from '../components/prd-sections/PrdOverview'
import { PrdSidebar, type PrdView } from '../components/prd-sections/PrdSidebar'
import { ValidationContext } from '../context/ValidationContext'
import { usePrdFormState } from '../hooks/usePrdFormState'

interface PrdCreationPageProps {
  onNavigate: (view: View) => void
  goHome: () => void
}

export function PrdCreationPage({ onNavigate, goHome }: PrdCreationPageProps) {
  const { data, charterData, update, saveNow, lastSaved, isDirty } = usePrdFormState()
  const [activeView, setActiveView] = useState<PrdView>('overview')
  const [showValidation, setShowValidation] = useState(false)
  const cd = charterData ?? null

  const navigateTo = (view: PrdView, highlightMissing = false) => {
    setActiveView(view)
    setShowValidation(highlightMissing)
  }

  const handleExport = () => {
    saveNow()
    // TODO: implement prdPdfExport
  }

  const handleSignOff = () => {
    setActiveView(8)
  }

  const goNext = () => {
    if (activeView === 'overview') {
      setShowValidation(false)
      setActiveView(1)
      return
    }
    if (typeof activeView === 'number') {
      if (activeView === 8) {
        saveNow()
        onNavigate({ page: 'placeholder', phaseId: 'system-design' })
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
      <PipelineHeader formData={cd ?? undefined} onExport={handleExport} onSave={saveNow} onHome={goHome} saveLabel={isDirty ? 'Saving…' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Save Draft'} />

      <div className="flex items-start">
      <PrdSidebar data={data} activeView={activeView} onNavigate={navigateTo} charterData={cd} />

      <main className="flex-1 px-4 md:px-8 py-6 min-w-0">
        <div className="w-full max-w-6xl mx-auto">
        {activeView === 'overview' ? (
          <PrdOverview data={data} onNavigate={navigateTo} charterData={cd} onProceedToSystemDesign={() => onNavigate({ page: 'placeholder', phaseId: 'system-design' })} />
        ) : (
          <div className="w-full">
            <div className="border-2 border-on-background bg-white mac-window-shadow mb-4">
              <div className="mac-striped-header border-b border-on-background" />
              <div className="flex justify-between items-center px-4 py-2 bg-surface-container border-b-2 border-on-background">
                <span className="font-bold text-xs" style={{ fontFamily: 'var(--font-label)' }}>
                  SECTION {String(activeView).padStart(2, '0')} — PRD FORM
                </span>
                <span className="text-xs text-on-surface-variant" style={{ fontFamily: 'var(--font-label)' }}>
                  {activeView} of 8
                </span>
              </div>
            </div>

            <div className="border-2 border-on-background bg-white mac-window-shadow p-6 md:p-8 lg:px-10 charter-form">
              <ValidationContext.Provider value={showValidation}>
              {activeView === 1 && <PrdSection1 data={data} update={update} />}
              {activeView === 2 && <PrdSection2 data={data} update={update} />}
              {activeView === 3 && <PrdSection3 data={data} update={update} />}
              {activeView === 4 && <PrdSection4 data={data} update={update} />}
              {activeView === 5 && <PrdSection5 data={data} update={update} charterData={cd} />}
              {activeView === 6 && <PrdSection6 data={data} update={update} charterData={cd} />}
              {activeView === 7 && <PrdSection7 data={data} update={update} />}
              {activeView === 8 && <PrdSection8 data={data} update={update} charterData={cd} onProceedToSystemDesign={() => onNavigate({ page: 'placeholder', phaseId: 'system-design' })} />}
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
