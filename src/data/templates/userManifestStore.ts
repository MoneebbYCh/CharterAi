import { workspaceScopedKey } from '../../utils/workspaceScope'
import type { TemplateManifest } from '../types/templateManifest'
import type { MarketplaceCategory } from './types'

const STORAGE_BASE = 'charter-ai-user-manifests-v1'

export interface StoredUserManifest {
  id: string
  name: string
  description?: string
  icon: string
  suggestedDocName: string
  category: Exclude<MarketplaceCategory, 'All' | 'Saved'>
  manifest: TemplateManifest
  createdAt: number
  updatedAt: number
}

export type UserManifestInput = Omit<StoredUserManifest, 'id' | 'createdAt' | 'updatedAt' | 'manifest'> & {
  manifest: Omit<TemplateManifest, 'id'> & { id?: string }
}

function storageKey(): string {
  return workspaceScopedKey(STORAGE_BASE)
}

function isStoredUserManifest(value: unknown): value is StoredUserManifest {
  if (!value || typeof value !== 'object') return false
  const t = value as Record<string, unknown>
  return (
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    typeof t.icon === 'string' &&
    typeof t.suggestedDocName === 'string' &&
    typeof t.category === 'string' &&
    typeof t.createdAt === 'number' &&
    typeof t.updatedAt === 'number' &&
    t.manifest != null &&
    typeof t.manifest === 'object' &&
    Array.isArray((t.manifest as TemplateManifest).sections)
  )
}

function readAll(): StoredUserManifest[] {
  try {
    const raw = localStorage.getItem(storageKey())
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isStoredUserManifest)
  } catch {
    return []
  }
}

function writeAll(list: StoredUserManifest[]): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(list))
  } catch {
    /* ignore quota / private mode */
  }
}

function newId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function listUserManifests(): StoredUserManifest[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getUserManifest(id: string): StoredUserManifest | undefined {
  return readAll().find((t) => t.id === id)
}

export function saveUserManifest(input: UserManifestInput): StoredUserManifest {
  const id = newId()
  const now = Date.now()
  const stored: StoredUserManifest = {
    id,
    name: input.name.trim() || 'Custom template',
    description: input.description?.trim() || undefined,
    icon: input.icon.trim() || 'edit_note',
    suggestedDocName: input.suggestedDocName.trim() || input.name.trim() || 'Custom Document',
    category: input.category,
    manifest: {
      ...input.manifest,
      id,
      sections: input.manifest.sections ?? [],
    },
    createdAt: now,
    updatedAt: now,
  }
  writeAll([...readAll(), stored])
  return stored
}

export function updateUserManifest(id: string, input: UserManifestInput): StoredUserManifest | undefined {
  const list = readAll()
  const index = list.findIndex((t) => t.id === id)
  if (index < 0) return undefined
  const prev = list[index]
  const updated: StoredUserManifest = {
    ...prev,
    name: input.name.trim() || prev.name,
    description: input.description?.trim() || undefined,
    icon: input.icon.trim() || prev.icon,
    suggestedDocName: input.suggestedDocName.trim() || prev.suggestedDocName,
    category: input.category,
    manifest: {
      ...input.manifest,
      id,
      sections: input.manifest.sections ?? [],
    },
    updatedAt: Date.now(),
  }
  const next = [...list]
  next[index] = updated
  writeAll(next)
  return updated
}

export function deleteUserManifest(id: string): boolean {
  const list = readAll()
  const next = list.filter((t) => t.id !== id)
  if (next.length === list.length) return false
  writeAll(next)
  return true
}

export function isUserManifestId(id: string): boolean {
  return readAll().some((t) => t.id === id)
}
