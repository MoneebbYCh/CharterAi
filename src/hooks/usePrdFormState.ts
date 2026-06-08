import { useCallback, useEffect, useState } from 'react'
import { createInitialPrdFormData, PRD_STORAGE_KEY } from '../data/prdFormDefaults'
import type { FormData } from '../types/form'
import type { PrdFormData } from '../types/prdForm'
import { STORAGE_KEY } from '../data/formDefaults'
import { getVscodeApi } from '../utils/vscodeApi'

const vscode = getVscodeApi()

function loadFromStorage(): PrdFormData {
  try {
    const raw = localStorage.getItem(PRD_STORAGE_KEY)
    if (!raw) return createInitialPrdFormData()
    const parsed = JSON.parse(raw) as PrdFormData
    return { ...createInitialPrdFormData(), ...parsed }
  } catch {
    return createInitialPrdFormData()
  }
}

function loadCharterData(): FormData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as FormData
  } catch {
    return null
  }
}

export function usePrdFormState() {
  const [data, setData] = useState<PrdFormData>(loadFromStorage)
  const [charterData, setCharterData] = useState<FormData | null>(loadCharterData)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (!isDirty) return
    const timer = setTimeout(() => {
      localStorage.setItem(PRD_STORAGE_KEY, JSON.stringify(data))
      if (vscode) {
        vscode.postMessage({ type: 'savePrd', data })
      }
      setLastSaved(new Date())
      setIsDirty(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [data, isDirty])

  const update = useCallback((updater: (prev: PrdFormData) => PrdFormData) => {
    setData((prev) => updater(prev))
    setIsDirty(true)
  }, [])

  const reset = useCallback(() => {
    const fresh = createInitialPrdFormData()
    setData(fresh)
    localStorage.setItem(PRD_STORAGE_KEY, JSON.stringify(fresh))
    if (vscode) {
      vscode.postMessage({ type: 'savePrd', data: fresh })
    }
    setLastSaved(new Date())
    setIsDirty(false)
  }, [])

  const saveNow = useCallback(() => {
    localStorage.setItem(PRD_STORAGE_KEY, JSON.stringify(data))
    if (vscode) {
      vscode.postMessage({ type: 'savePrd', data })
    }
    setLastSaved(new Date())
    setIsDirty(false)
  }, [data])

  useEffect(() => {
    if (!vscode) return
    const handler = (event: MessageEvent) => {
      const msg = event.data
      if (msg.type === 'loadPrd') {
        if (msg.data) setData((prev) => ({ ...prev, ...msg.data }))
        if (msg.charterData) setCharterData(msg.charterData)
      }
    }
    window.addEventListener('message', handler)
    vscode.postMessage({ type: 'loadPrd' })
    return () => window.removeEventListener('message', handler)
  }, [])

  return { data, charterData, update, reset, saveNow, lastSaved, isDirty }
}
