import { useCallback, useEffect, useState } from 'react'
import { createInitialFormData, STORAGE_KEY } from '../data/formDefaults'
import type { FormData } from '../types/form'
import { getVscodeApi } from '../utils/vscodeApi'

const vscode = getVscodeApi()

let savedCounter = 0

function loadFromStorage(): FormData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialFormData()
    const parsed = JSON.parse(raw) as FormData
    return { ...createInitialFormData(), ...parsed }
  } catch {
    return createInitialFormData()
  }
}

export function useFormState() {
  const [data, setData] = useState<FormData>(loadFromStorage)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (!isDirty) return
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      if (vscode) {
        vscode.postMessage({ type: 'saveCharter', data })
      }
      setLastSaved(new Date())
      setIsDirty(false)
      savedCounter++
    }, 500)
    return () => clearTimeout(timer)
  }, [data, isDirty])

  const update = useCallback((updater: (prev: FormData) => FormData) => {
    setData((prev) => updater(prev))
    setIsDirty(true)
  }, [])

  const reset = useCallback(() => {
    const fresh = createInitialFormData()
    setData(fresh)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    if (vscode) {
      vscode.postMessage({ type: 'saveCharter', data: fresh })
    }
    setLastSaved(new Date())
    setIsDirty(false)
  }, [])

  const saveNow = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    if (vscode) {
      vscode.postMessage({ type: 'saveCharter', data })
    }
    setLastSaved(new Date())
    setIsDirty(false)
  }, [data])

  useEffect(() => {
    if (!vscode) return
    const handler = (event: MessageEvent) => {
      const msg = event.data
      if (msg.type === 'loadCharter' && msg.data) {
        setData((prev) => ({ ...prev, ...msg.data }))
      }
    }
    window.addEventListener('message', handler)
    vscode.postMessage({ type: 'loadCharter' })
    return () => window.removeEventListener('message', handler)
  }, [])

  return { data, update, reset, saveNow, lastSaved, isDirty }
}
