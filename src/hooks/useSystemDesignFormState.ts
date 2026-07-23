import { useCallback, useEffect, useState } from 'react'
import {
  createInitialSystemDesignFormData,
  SYSTEM_DESIGN_STORAGE_KEY,
} from '../data/systemDesignDefaults'
import type { SystemDesignFormData } from '../types/systemDesignForm'
import { getVscodeApi } from '../utils/vscodeApi'

const vscode = getVscodeApi()
const PHASE = 'system-design'

function loadFromStorage(): SystemDesignFormData {
  try {
    const raw = localStorage.getItem(SYSTEM_DESIGN_STORAGE_KEY)
    if (!raw) return createInitialSystemDesignFormData()
    const parsed = JSON.parse(raw) as SystemDesignFormData
    return { ...createInitialSystemDesignFormData(), ...parsed }
  } catch {
    return createInitialSystemDesignFormData()
  }
}

export function useSystemDesignFormState() {
  const [data, setData] = useState<SystemDesignFormData>(loadFromStorage)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (!isDirty) return
    const timer = setTimeout(() => {
      localStorage.setItem(SYSTEM_DESIGN_STORAGE_KEY, JSON.stringify(data))
      if (vscode) {
        vscode.postMessage({ type: 'saveForm', phase: PHASE, data })
      }
      setLastSaved(new Date())
      setIsDirty(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [data, isDirty])

  const update = useCallback((updater: (prev: SystemDesignFormData) => SystemDesignFormData) => {
    setData((prev) => updater(prev))
    setIsDirty(true)
  }, [])

  const reset = useCallback(() => {
    const fresh = createInitialSystemDesignFormData()
    setData(fresh)
    localStorage.setItem(SYSTEM_DESIGN_STORAGE_KEY, JSON.stringify(fresh))
    if (vscode) {
      vscode.postMessage({ type: 'saveForm', phase: PHASE, data: fresh })
    }
    setLastSaved(new Date())
    setIsDirty(false)
  }, [])

  const saveNow = useCallback(() => {
    localStorage.setItem(SYSTEM_DESIGN_STORAGE_KEY, JSON.stringify(data))
    if (vscode) {
      vscode.postMessage({ type: 'saveForm', phase: PHASE, data })
    }
    setLastSaved(new Date())
    setIsDirty(false)
  }, [data])

  useEffect(() => {
    if (!vscode) return
    const handler = (event: MessageEvent) => {
      const msg = event.data
      if (msg.type === 'loadForm' && msg.phase === PHASE && msg.data) {
        setData((prev) => ({ ...prev, ...msg.data }))
      }
    }
    window.addEventListener('message', handler)
    vscode.postMessage({ type: 'loadForm', phase: PHASE })
    return () => window.removeEventListener('message', handler)
  }, [])

  return { data, update, reset, saveNow, lastSaved, isDirty }
}
