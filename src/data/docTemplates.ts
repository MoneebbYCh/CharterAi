import type { BlockNoteBlock } from '../types/document'
import {
  CHARTER_TEMPLATES,
  CUSTOM_CHARTER_TEMPLATE,
  type CharterTemplate,
} from './charterTemplates'

/**
 * Template registry keyed by document type. Built-in curated templates exist
 * only for the project charter today; every other type (built-in or custom)
 * starts from the blank option plus any templates the user saves. User
 * templates are stored per type and shared across versions — like reusable
 * assets rather than per-project content.
 */

export { CUSTOM_CHARTER_TEMPLATE }
export type { CharterTemplate }

interface StoredUserTemplate {
  id: string
  name: string
  description?: string
  blocks: BlockNoteBlock[]
  createdAt: number
}

function userKey(typeId: string): string {
  return `charter-ai-user-templates-${typeId}-v1`
}

function curatedFor(typeId: string): CharterTemplate[] {
  return typeId === 'project-charter' ? CHARTER_TEMPLATES : []
}

function readUserStored(typeId: string): StoredUserTemplate[] {
  try {
    const raw = localStorage.getItem(userKey(typeId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (t): t is StoredUserTemplate =>
        t && typeof t === 'object' && typeof t.id === 'string' && Array.isArray(t.blocks),
    )
  } catch {
    return []
  }
}

function writeUserStored(typeId: string, list: StoredUserTemplate[]): void {
  try {
    localStorage.setItem(userKey(typeId), JSON.stringify(list))
  } catch {
    /* ignore storage errors */
  }
}

function toTemplate(stored: StoredUserTemplate): CharterTemplate {
  return {
    id: stored.id,
    name: stored.name,
    category: 'Saved',
    tagline: 'A template you saved from an earlier draft.',
    description:
      stored.description ||
      'Your saved starting point. Applying it replaces the current document with this content.',
    // Deep-copy so applying never mutates the stored blocks.
    build: () => JSON.parse(JSON.stringify(stored.blocks)) as BlockNoteBlock[],
  }
}

/** Curated + user-saved templates for a document type (excludes the blank option). */
export function templatesForType(typeId: string): CharterTemplate[] {
  return [...curatedFor(typeId), ...readUserStored(typeId).map(toTemplate)]
}

/** All selectable options including the blank "Build from scratch" template. */
export function templateOptionsForType(typeId: string): CharterTemplate[] {
  return [...templatesForType(typeId), CUSTOM_CHARTER_TEMPLATE]
}

export function resolveTemplate(typeId: string, id: string | undefined): CharterTemplate | undefined {
  if (!id) return undefined
  return templateOptionsForType(typeId).find((t) => t.id === id)
}

/** Save the current document blocks as a reusable template for this type. */
export function saveUserTemplate(typeId: string, name: string, blocks: BlockNoteBlock[]): CharterTemplate {
  const trimmed = name.trim() || 'Saved template'
  const stored: StoredUserTemplate = {
    id: `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: trimmed,
    blocks: JSON.parse(JSON.stringify(blocks)) as BlockNoteBlock[],
    createdAt: Date.now(),
  }
  writeUserStored(typeId, [...readUserStored(typeId), stored])
  return toTemplate(stored)
}

export function deleteUserTemplate(typeId: string, id: string): void {
  writeUserStored(
    typeId,
    readUserStored(typeId).filter((t) => t.id !== id),
  )
}

export function isUserTemplate(typeId: string, id: string): boolean {
  return readUserStored(typeId).some((t) => t.id === id)
}
