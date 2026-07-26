import { useState, useCallback, useMemo } from 'react'
import { PHASES } from '../data/phases'
import { isCanvasPhaseId, type CanvasPhaseId } from '../data/canvasPhases'

export type View = { page: 'home' } | { page: 'profile' } | { page: CanvasPhaseId }

export function useViewState() {
  const [view, setView] = useState<View>({ page: 'home' })

  const navigate = useCallback((v: View) => {
    setView(v)
  }, [])

  const phaseInfo = useMemo(() => {
    if (view.page === 'home' || view.page === 'profile') return null
    if (!isCanvasPhaseId(view.page)) return null
    return PHASES.find((p) => p.id === view.page) ?? null
  }, [view])

  const goHome = useCallback(() => {
    setView({ page: 'home' })
  }, [])

  return { view, navigate, goHome, phaseInfo }
}

export type ViewState = ReturnType<typeof useViewState>
