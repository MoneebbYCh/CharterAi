import { useCallback, useEffect, useState } from 'react'
import { createInitialFormData, STORAGE_KEY } from '../data/formDefaults'
import type { FormData } from '../types/form'

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
      setLastSaved(new Date())
      setIsDirty(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [data, isDirty])

  const update = useCallback((updater: (prev: FormData) => FormData) => {
    setData((prev) => {
      const next = updater(prev)
      return next
    })
    setIsDirty(true)
  }, [])

  const reset = useCallback(() => {
    const fresh = createInitialFormData()
    setData(fresh)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    setLastSaved(new Date())
    setIsDirty(false)
  }, [])

  const saveNow = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setLastSaved(new Date())
    setIsDirty(false)
  }, [data])

  return { data, update, reset, saveNow, lastSaved, isDirty }
}
