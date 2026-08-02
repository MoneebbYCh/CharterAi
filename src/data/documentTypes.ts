import {
  CANVAS_PHASES,
  CANVAS_PHASE_IDS,
  type CanvasPhaseId,
} from './canvasPhases'
import { getVscodeApi } from '../utils/vscodeApi'
import { workspaceScopedKey } from '../utils/workspaceScope'

/**
 * Unified registry of pipeline document types.
 *
 * Built-in types are the six fixed pipeline phases (charter, prd, …). Custom
 * types are user-defined documents that live in the same workspace; they are
 * appended after the built-ins and can be reordered/deleted. The custom-type
 * definitions are shared across every version (like the code index and API
 * key), while each version stores its own *content* for them.
 */

export interface DocumentTypeMeta {
  id: string
  number: number
  title: string
  kicker: string
  subtitle: string
  icon: string
  /** localStorage base key (namespaced per version at read/write time). */
  storageKey: string
  /** Pre-rebrand localStorage key (built-ins only). */
  legacyStorageKey?: string
  /** Filename under .charter-ai/ (or versions/<id>/). */
  fileName: string
  builtin: boolean
  /** Sort order across the whole pipeline. */
  order: number
  next?: { page: string; label: string }
}

/** Persisted shape of a user-defined document type. */
export interface CustomDocType {
  id: string
  name: string
  icon: string
  createdAt: number
  order: number
}

const CUSTOM_KEY = 'charter-ai-doc-types-v1'

const BUILTIN_ICONS: Record<CanvasPhaseId, string> = {
  'project-charter': 'bar_chart',
  prd: 'description',
  'system-design': 'account_tree',
  dev: 'terminal',
  qa: 'biotech',
  'post-dev': 'rocket_launch',
}

/** Material-symbol names offered when creating a custom document. */
export const CUSTOM_DOC_ICONS = [
  'article',
  'draft',
  'checklist',
  'lightbulb',
  'flag',
  'campaign',
  'science',
  'handshake',
  'insights',
  'menu_book',
  'schema',
  'inventory_2',
]

// --- custom-type storage ---------------------------------------------------

function customTypesKey(): string {
  return workspaceScopedKey(CUSTOM_KEY)
}

function readCustomTypes(): CustomDocType[] {
  try {
    const raw = localStorage.getItem(customTypesKey())
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (v): v is CustomDocType =>
          v && typeof v === 'object' && typeof v.id === 'string' && typeof v.name === 'string',
      )
      .map((v, i) => ({
        id: v.id,
        name: v.name,
        icon: typeof v.icon === 'string' && v.icon ? v.icon : 'article',
        createdAt: typeof v.createdAt === 'number' ? v.createdAt : Date.now(),
        order: typeof v.order === 'number' ? v.order : i,
      }))
      .sort((a, b) => a.order - b.order)
  } catch {
    return []
  }
}

function writeCustomTypes(list: CustomDocType[]): void {
  const normalized = list.map((v, i) => ({ ...v, order: i }))
  try {
    localStorage.setItem(customTypesKey(), JSON.stringify(normalized))
  } catch {
    /* ignore storage errors */
  }
  // Mirror to disk so the AI agent (extension host) can resolve custom labels.
  getVscodeApi()?.postMessage({ type: 'saveDocTypes', data: normalized })
}

/** Merge disk-sourced custom types into local storage (adds ones we don't have). */
export function hydrateCustomTypesFromDisk(data: unknown): boolean {
  if (!Array.isArray(data)) return false
  const local = readCustomTypes()
  const known = new Set(local.map((v) => v.id))
  const incoming = data
    .filter(
      (v): v is CustomDocType =>
        v && typeof v === 'object' && typeof v.id === 'string' && typeof v.name === 'string',
    )
    .filter((v) => !known.has(v.id))
  if (incoming.length === 0) return false
  const merged = [...local, ...incoming].map((v, i) => ({
    id: v.id,
    name: v.name,
    icon: typeof v.icon === 'string' && v.icon ? v.icon : 'article',
    createdAt: typeof v.createdAt === 'number' ? v.createdAt : Date.now(),
    order: i,
  }))
  try {
    localStorage.setItem(customTypesKey(), JSON.stringify(merged))
  } catch {
    /* ignore */
  }
  return true
}

// --- meta derivation -------------------------------------------------------

function builtinMeta(id: CanvasPhaseId): DocumentTypeMeta {
  const p = CANVAS_PHASES[id]
  return {
    id: p.id,
    number: p.number,
    title: p.title,
    kicker: p.kicker,
    subtitle: p.subtitle,
    icon: BUILTIN_ICONS[id],
    storageKey: p.storageKey,
    legacyStorageKey: p.legacyStorageKey,
    fileName: p.fileName,
    builtin: true,
    order: p.number,
    next: p.next,
  }
}

function customMeta(c: CustomDocType, index: number): DocumentTypeMeta {
  return {
    id: c.id,
    number: CANVAS_PHASE_IDS.length + index + 1,
    title: c.name,
    kicker: 'Custom document',
    subtitle: 'A document you added to this pipeline. Draft it in the canvas or with the AI chat.',
    icon: c.icon || 'article',
    // id already carries the `doc-` prefix, so keys/files stay unique + readable.
    storageKey: `charter-ai-${c.id}-v1`,
    fileName: `${c.id}.json`,
    builtin: false,
    order: 100 + index,
  }
}

const BUILTIN_METAS: DocumentTypeMeta[] = CANVAS_PHASE_IDS.map(builtinMeta)

/** All document types (built-ins first, then custom), sorted by pipeline order. */
export function listDocumentTypes(): DocumentTypeMeta[] {
  const customs = readCustomTypes().map(customMeta)
  return [...BUILTIN_METAS, ...customs]
}

export function listCustomDocTypes(): CustomDocType[] {
  return readCustomTypes()
}

export function getDocumentType(id: string): DocumentTypeMeta | undefined {
  return listDocumentTypes().find((t) => t.id === id)
}

export function isDocumentTypeId(id: string): boolean {
  return listDocumentTypes().some((t) => t.id === id)
}

export function isBuiltinDocTypeId(id: string): boolean {
  return id in CANVAS_PHASES
}

// --- mutations -------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

/** Build a collision-free, `doc-` prefixed id for a new custom document. */
function makeUniqueId(name: string, existing: CustomDocType[]): string {
  const base = `doc-${slugify(name) || 'document'}`
  const taken = new Set([...existing.map((v) => v.id), ...CANVAS_PHASE_IDS])
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

export function createDocType(name: string, icon = 'article'): DocumentTypeMeta {
  const trimmed = name.trim() || 'Untitled Document'
  const existing = readCustomTypes()
  const now = Date.now()
  const created: CustomDocType = {
    id: makeUniqueId(trimmed, existing),
    name: trimmed,
    icon,
    createdAt: now,
    order: existing.length,
  }
  writeCustomTypes([...existing, created])
  return customMeta(created, existing.length)
}

export function renameDocType(id: string, name: string): void {
  const trimmed = name.trim()
  if (!trimmed) return
  writeCustomTypes(readCustomTypes().map((v) => (v.id === id ? { ...v, name: trimmed } : v)))
}

export function deleteDocType(id: string): void {
  writeCustomTypes(readCustomTypes().filter((v) => v.id !== id))
}

/** Move a custom document up/down in the ordering. */
export function moveDocType(id: string, direction: -1 | 1): void {
  const list = readCustomTypes()
  const i = list.findIndex((v) => v.id === id)
  if (i === -1) return
  const j = i + direction
  if (j < 0 || j >= list.length) return
  const next = [...list]
  ;[next[i], next[j]] = [next[j], next[i]]
  writeCustomTypes(next)
}
