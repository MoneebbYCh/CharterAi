import { useState } from 'react'
import type { View } from '../hooks/useViewState'
import { Section1, Section2, Section3 } from '../components/sections/Section1-3'
import { Section4, Section5, Section6, Section7, Section8 } from '../components/sections/Section4-8'
import { PipelineFooter, PipelineHeader } from '../components/layout/PipelineChrome'
import { PhaseOverview } from '../components/project-charter/PhaseOverview'
import { PhaseSidebar, type ProjectCharterView } from '../components/project-charter/PhaseSidebar'
import { ValidationContext } from '../context/ValidationContext'
import { useFormState } from '../hooks/useFormState'
import { exportToPdf } from '../utils/pdfExport'
import { getGateStatus, getIncompleteSections1to7, getSectionValidator, isGateApproved, validateSections1to7 } from '../utils/validation'

interface ProjectCharterPageProps {
  onNavigate: (view: View) => void
  goHome: () => void
}

export function ProjectCharterPage({ onNavigate, goHome }: ProjectCharterPageProps) {
  const { data, update, saveNow, lastSaved, isDirty } = useFormState()
  const [activeView, setActiveView] = useState<ProjectCharterView>('overview')
  const [showValidation, setShowValidation] = useState(false)
  const gateLocked = !validateSections1to7(data)
  const gateStatus = getGateStatus(data)
  const gateApproved = isGateApproved(data)
  const incompleteUpstream = getIncompleteSections1to7(data)

  const navigateTo = (view: ProjectCharterView, highlightMissing = false) => {
    setActiveView(view)
    setShowValidation(highlightMissing)
  }

  const activeSection = activeView === 'overview' ? 0 : activeView
  const currentValidation =
    activeSection > 0 ? getSectionValidator(activeSection)(data) : null

  const handleExport = () => {
    saveNow()
    exportToPdf(data)
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
      const validation = getSectionValidator(activeView)(data)
      if (!validation.complete) {
        setShowValidation(true)
        return
      }
      if (activeView === 8) {
        if (gateApproved) {
          saveNow()
          onNavigate({ page: 'prd', section: 'overview' })
        } else {
          setShowValidation(true)
        }
        return
      }
      setShowValidation(false)
      setActiveView(activeView + 1)
    }
  }

  const isOnGatePage = activeView === 8
  const nextLabel = isOnGatePage
    ? gateApproved
      ? 'Proceed to PRD →'
      : 'Complete Gate Review'
    : 'Next →'

  const goPrev = () => {
    setShowValidation(false)
    if (activeView === 1) setActiveView('overview')
    else if (typeof activeView === 'number' && activeView > 1) setActiveView(activeView - 1)
  }

  return (
    <div className="min-h-screen bg-surface-dim">
      <PipelineHeader
        onHome={goHome}
        onExport={handleExport}
        onSave={saveNow}
        saveLabel={isDirty ? 'Saving…' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Save Draft'}
        formData={data}
      />

      <div className="flex items-start">
      <PhaseSidebar data={data} activeView={activeView} onNavigate={navigateTo} />

      <main className="flex-1 px-4 md:px-8 py-6 min-w-0">
        <div className="w-full max-w-6xl mx-auto">
        {activeView === 'overview' ? (
          <PhaseOverview data={data} onNavigate={navigateTo} onProceedToPrd={() => { saveNow(); onNavigate({ page: 'prd', section: 'overview' }) }} />
        ) : (
          <div className="w-full">
            <div className="border-2 border-on-background bg-white mac-window-shadow mb-4">
              <div className="mac-striped-header border-b border-on-background" />
              <div className="flex justify-between items-center px-4 py-2 bg-surface-container border-b-2 border-on-background">
                <span className="font-bold text-xs" style={{ fontFamily: 'var(--font-label)' }}>
                  SECTION {String(activeView).padStart(2, '0')} — CHARTER FORM
                </span>
                <span className="text-xs text-on-surface-variant" style={{ fontFamily: 'var(--font-label)' }}>
                  {activeView} of 8
                </span>
              </div>
            </div>

            {showValidation && isOnGatePage && currentValidation?.complete && !gateApproved && (
              <div className="mb-4 p-3 border-2 border-red-600 bg-red-50 text-sm validation-banner">
                <strong>To unlock the next phase:</strong> set Gate Decision to{' '}
                <strong>✅ APPROVED</strong> and ensure all checklist items and signatures are complete.
              </div>
            )}

            {showValidation && currentValidation && !currentValidation.complete && currentValidation.missing.length > 0 && (
              <div className="mb-4 p-3 border-2 border-red-600 bg-red-50 text-sm validation-banner">
                <strong>Missing required fields:</strong> {currentValidation.missing.join(', ')}
              </div>
            )}

            <div className="border-2 border-on-background bg-white mac-window-shadow p-6 md:p-8 lg:px-10 charter-form">
              <ValidationContext.Provider value={showValidation}>
              {activeView === 1 && <Section1 data={data} update={update} />}
              {activeView === 2 && <Section2 data={data} update={update} />}
              {activeView === 3 && <Section3 data={data} update={update} />}
              {activeView === 4 && <Section4 data={data} update={update} />}
              {activeView === 5 && <Section5 data={data} update={update} />}
              {activeView === 6 && <Section6 data={data} update={update} />}
              {activeView === 7 && <Section7 data={data} update={update} />}
              {activeView === 8 && (
                <Section8
                  data={data}
                  update={update}
                  upstreamIncomplete={gateLocked}
                  incompleteSections={incompleteUpstream}
                  onGoToSection={(id) => navigateTo(id, true)}
                  onProceedToPrd={() => { saveNow(); onNavigate({ page: 'prd', section: 'overview' }) }}
                />
              )}
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
                {nextLabel}
              </button>
            </div>
          </div>
        )}
        </div>
      </main>
      </div>

      <PipelineFooter gateStatus={gateStatus} onExportPdf={handleExport} onSignOff={handleSignOff} onNavigate={onNavigate} />
    </div>
  )
}
