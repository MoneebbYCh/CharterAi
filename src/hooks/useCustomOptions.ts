import { useCallback, useEffect, useState } from 'react'
import { getDefaultChoiceOptions, getDefaultStringOptions } from '../data/optionDefaults'
import { getVscodeApi } from '../utils/vscodeApi'

const VSCode = getVscodeApi()
const STORAGE_KEY = 'ascen-charter-custom-options-v1'

type StringOptionKey = 'hml' | 'raci' | 'assumptionClass' | 'questionStatus'
type ChoiceOptionKey = 'projectType' | 'priority' | 'roadmapStatus' | 'appetite' | 'gateDecision' | 'prdStatus'

type Store = {
  strings: Partial<Record<StringOptionKey, string[]>>
  choices: Partial<Record<ChoiceOptionKey, { value: string; label: string }[]>>
}

function loadStore(): Store {
  try {
    if (VSCode) return { strings: {}, choices: {} }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { strings: {}, choices: {} }
    return JSON.parse(raw) as Store
  } catch {
    return { strings: {}, choices: {} }
  }
}

function saveStoreToLocal(store: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

let store = loadStore()

export function useStringOptions(key: StringOptionKey) {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (!VSCode) return
    const handler = (event: MessageEvent) => {
      const msg = event.data
      if (msg.type === 'loadCustomOptions' && msg.data) {
        store = msg.data
        forceUpdate((v) => v + 1)
      }
    }
    window.addEventListener('message', handler)
    VSCode.postMessage({ type: 'loadCustomOptions' })
    return () => window.removeEventListener('message', handler)
  }, [])

  const commit = useCallback((next: Store) => {
    store = next
    saveStoreToLocal(next)
    if (VSCode) VSCode.postMessage({ type: 'saveCustomOptions', data: next })
    forceUpdate((v) => v + 1)
  }, [])

  const options = store.strings[key] ?? getDefaultStringOptions(key)

  const addOption = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) return
      const next = [...(store.strings[key] ?? getDefaultStringOptions(key))]
      if (!next.includes(trimmed)) next.push(trimmed)
      commit({ ...store, strings: { ...store.strings, [key]: next } })
    },
    [key, commit],
  )

  const removeOption = useCallback(
    (value: string) => {
      const next = (store.strings[key] ?? getDefaultStringOptions(key)).filter((o) => o !== value)
      commit({ ...store, strings: { ...store.strings, [key]: next.length ? next : getDefaultStringOptions(key) } })
    },
    [key, commit],
  )

  const resetOptions = useCallback(() => {
    const { [key]: _, ...rest } = store.strings
    commit({ ...store, strings: rest })
  }, [key, commit])

  return { options, addOption, removeOption, resetOptions }
}

export function useChoiceOptions(key: ChoiceOptionKey) {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (!VSCode) return
    const handler = (event: MessageEvent) => {
      const msg = event.data
      if (msg.type === 'loadCustomOptions' && msg.data) {
        store = msg.data
        forceUpdate((v) => v + 1)
      }
    }
    window.addEventListener('message', handler)
    VSCode.postMessage({ type: 'loadCustomOptions' })
    return () => window.removeEventListener('message', handler)
  }, [])

  const commit = useCallback((next: Store) => {
    store = next
    saveStoreToLocal(next)
    if (VSCode) VSCode.postMessage({ type: 'saveCustomOptions', data: next })
    forceUpdate((v) => v + 1)
  }, [])

  const options = store.choices[key] ?? getDefaultChoiceOptions(key)

  const addOption = useCallback(
    (value: string, label: string) => {
      const v = value.trim()
      const l = label.trim()
      if (!v || !l) return
      const next = [...(store.choices[key] ?? getDefaultChoiceOptions(key))]
      if (!next.some((o) => o.value === v)) next.push({ value: v, label: l })
      commit({ ...store, choices: { ...store.choices, [key]: next } })
    },
    [key, commit],
  )

  const removeOption = useCallback(
    (value: string) => {
      const next = (store.choices[key] ?? getDefaultChoiceOptions(key)).filter((o) => o.value !== value)
      commit({ ...store, choices: { ...store.choices, [key]: next.length ? next : getDefaultChoiceOptions(key) } })
    },
    [key, commit],
  )

  const updateOption = useCallback(
    (value: string, label: string) => {
      const next = (store.choices[key] ?? getDefaultChoiceOptions(key)).map((o) =>
        o.value === value ? { ...o, label: label.trim() || o.label } : o,
      )
      commit({ ...store, choices: { ...store.choices, [key]: next } })
    },
    [key, commit],
  )

  const resetOptions = useCallback(() => {
    const { [key]: _, ...rest } = store.choices
    commit({ ...store, choices: rest })
  }, [key, commit])

  return { options, addOption, removeOption, updateOption, resetOptions }
}

export type { StringOptionKey, ChoiceOptionKey }
