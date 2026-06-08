import { useState, useCallback, useMemo } from 'react'
import { PHASES } from '../data/phases'

export type View =
  | { page: 'home' }
  | { page: 'project-charter'; section: 'overview' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }
  | { page: 'prd'; section: 'overview' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }
  | { page: 'placeholder'; phaseId: string }

export function useViewState() {
  const [view, setView] = useState<View>({ page: 'home' })

  const navigate = useCallback((v: View) => {
    setView(v)
  }, [])

  const phaseInfo = useMemo(() => {
    if (view.page === 'home') return null
    if (view.page === 'placeholder') {
      const phase = PHASES.find(p => p.id === view.phaseId)
      return phase ?? null
    }
    const phase = PHASES.find(p => p.path === `/${view.page}`)
    return phase ?? null
  }, [view])

  const goHome = useCallback(() => {
    setView({ page: 'home' })
  }, [])

  return { view, navigate, goHome, phaseInfo }
}

export type ViewState = ReturnType<typeof useViewState>
