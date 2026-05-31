import { useCallback, useSyncExternalStore } from 'react'
import { getDefaultChoiceOptions, getDefaultStringOptions } from '../data/optionDefaults'

const STORAGE_KEY = 'ascen-charter-custom-options-v1'

type StringOptionKey = 'hml' | 'raci' | 'assumptionClass' | 'questionStatus'
type ChoiceOptionKey = 'projectType' | 'priority' | 'roadmapStatus' | 'appetite' | 'gateDecision'

type Store = {
  strings: Partial<Record<StringOptionKey, string[]>>
  choices: Partial<Record<ChoiceOptionKey, { value: string; label: string }[]>>
}

let store: Store = loadStore()
const listeners = new Set<() => void>()

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { strings: {}, choices: {} }
    return JSON.parse(raw) as Store
  } catch {
    return { strings: {}, choices: {} }
  }
}

function saveStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return store
}

export function useStringOptions(key: StringOptionKey): {
  options: string[]
  addOption: (value: string) => void
  removeOption: (value: string) => void
  resetOptions: () => void
} {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const options = current.strings[key] ?? getDefaultStringOptions(key)

  const addOption = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) return
      const next = [...(current.strings[key] ?? getDefaultStringOptions(key))]
      if (!next.includes(trimmed)) next.push(trimmed)
      store = { ...store, strings: { ...store.strings, [key]: next } }
      saveStore()
    },
    [current.strings, key],
  )

  const removeOption = useCallback(
    (value: string) => {
      const next = (current.strings[key] ?? getDefaultStringOptions(key)).filter((o) => o !== value)
      store = { ...store, strings: { ...store.strings, [key]: next.length ? next : getDefaultStringOptions(key) } }
      saveStore()
    },
    [current.strings, key],
  )

  const resetOptions = useCallback(() => {
    const { [key]: _, ...rest } = store.strings
    store = { ...store, strings: rest }
    saveStore()
  }, [key])

  return { options, addOption, removeOption, resetOptions }
}

export function useChoiceOptions(key: ChoiceOptionKey): {
  options: { value: string; label: string }[]
  addOption: (value: string, label: string) => void
  removeOption: (value: string) => void
  updateOption: (value: string, label: string) => void
  resetOptions: () => void
} {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const options = current.choices[key] ?? getDefaultChoiceOptions(key)

  const addOption = useCallback(
    (value: string, label: string) => {
      const v = value.trim()
      const l = label.trim()
      if (!v || !l) return
      const next = [...(current.choices[key] ?? getDefaultChoiceOptions(key))]
      if (!next.some((o) => o.value === v)) next.push({ value: v, label: l })
      store = { ...store, choices: { ...store.choices, [key]: next } }
      saveStore()
    },
    [current.choices, key],
  )

  const removeOption = useCallback(
    (value: string) => {
      const next = (current.choices[key] ?? getDefaultChoiceOptions(key)).filter((o) => o.value !== value)
      store = {
        ...store,
        choices: { ...store.choices, [key]: next.length ? next : getDefaultChoiceOptions(key) },
      }
      saveStore()
    },
    [current.choices, key],
  )

  const updateOption = useCallback(
    (value: string, label: string) => {
      const next = (current.choices[key] ?? getDefaultChoiceOptions(key)).map((o) =>
        o.value === value ? { ...o, label: label.trim() || o.label } : o,
      )
      store = { ...store, choices: { ...store.choices, [key]: next } }
      saveStore()
    },
    [current.choices, key],
  )

  const resetOptions = useCallback(() => {
    const { [key]: _, ...rest } = store.choices
    store = { ...store, choices: rest }
    saveStore()
  }, [key])

  return { options, addOption, removeOption, updateOption, resetOptions }
}

export type { StringOptionKey, ChoiceOptionKey }
