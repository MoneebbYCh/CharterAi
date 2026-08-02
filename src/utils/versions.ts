import { CANVAS_PHASES } from '../data/canvasPhases'
import { listDocumentTypes } from '../data/documentTypes'
import { getVscodeApi } from './vscodeApi'
import { hasWorkspaceScope, workspaceScopedKey } from './workspaceScope'

/**
 * A "Version" is an independent set of pipeline documents living inside the
 * same workspace/codebase. Content is isolated per version *and* per folder
 * (via workspaceScopedKey). Disk + RAG live under that folder's `.charter-ai/`.
 * Only the API key stays global (VS Code SecretStorage).
 */
export interface DocVersion {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

const REGISTRY_KEY = 'charter-ai-versions-v1'
const ACTIVE_KEY = 'charter-ai-active-version-v1'

/** The pre-existing single-project data maps to this id (root `.charter-ai/` files). */
export const DEFAULT_VERSION_ID = 'default'

/** localStorage base key for the templates tutorial (namespaced per version). */
export const TEMPLATE_TUTORIAL_BASE_KEY = 'charter-ai-template-tutorial-seen-v1'

function readRegistry(): DocVersion[] {
  try {
    const raw = localStorage.getItem(workspaceScopedKey(REGISTRY_KEY))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (v): v is DocVersion =>
        v && typeof v === 'object' && typeof v.id === 'string' && typeof v.name === 'string',
    )
  } catch {
    return []
  }
}

function writeRegistry(versions: DocVersion[]): void {
  try {
    localStorage.setItem(workspaceScopedKey(REGISTRY_KEY), JSON.stringify(versions))
  } catch {
    /* ignore storage errors */
  }
}

/** Ensure at least the default version exists (migrates the legacy single project). */
export function ensureRegistry(): DocVersion[] {
  let versions = readRegistry()
  if (versions.length === 0) {
    const now = Date.now()
    versions = [{ id: DEFAULT_VERSION_ID, name: 'Version 1', createdAt: now, updatedAt: now }]
    writeRegistry(versions)
  }
  return versions
}

export function listVersions(): DocVersion[] {
  return ensureRegistry()
}

export function getActiveVersionId(): string {
  const versions = ensureRegistry()
  let active: string | null = null
  try {
    active = localStorage.getItem(workspaceScopedKey(ACTIVE_KEY))
  } catch {
    active = null
  }
  if (active && versions.some((v) => v.id === active)) return active
  const fallback = versions[0]?.id ?? DEFAULT_VERSION_ID
  writeActive(fallback)
  return fallback
}

function writeActive(id: string): void {
  try {
    localStorage.setItem(workspaceScopedKey(ACTIVE_KEY), id)
  } catch {
    /* ignore */
  }
  // Keep the extension host in sync so disk + AI chat target this version.
  getVscodeApi()?.postMessage({ type: 'setActiveVersion', version: id })
}

export function setActiveVersionId(id: string): void {
  writeActive(id)
}

export function getActiveVersion(): DocVersion {
  const id = getActiveVersionId()
  const versions = ensureRegistry()
  return versions.find((v) => v.id === id) ?? versions[0]
}

function nextVersionName(versions: DocVersion[]): string {
  let n = versions.length + 1
  const names = new Set(versions.map((v) => v.name))
  while (names.has(`Version ${n}`)) n += 1
  return `Version ${n}`
}

export function createVersion(name?: string): DocVersion {
  const versions = ensureRegistry()
  const now = Date.now()
  const version: DocVersion = {
    id: `v-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: (name && name.trim()) || nextVersionName(versions),
    createdAt: now,
    updatedAt: now,
  }
  writeRegistry([...versions, version])
  return version
}

export function renameVersion(id: string, name: string): void {
  const trimmed = name.trim()
  if (!trimmed) return
  writeRegistry(
    ensureRegistry().map((v) => (v.id === id ? { ...v, name: trimmed, updatedAt: Date.now() } : v)),
  )
}

export function touchVersion(id: string): void {
  writeRegistry(
    ensureRegistry().map((v) => (v.id === id ? { ...v, updatedAt: Date.now() } : v)),
  )
}

/** Remove a version from the registry and wipe its local + on-disk documents. */
export function deleteVersion(id: string): DocVersion[] {
  const versions = ensureRegistry()
  if (versions.length <= 1) return versions // never delete the last one
  clearVersionStorage(id)
  getVscodeApi()?.postMessage({ type: 'deleteVersion', version: id })
  const next = versions.filter((v) => v.id !== id)
  writeRegistry(next)
  if (getActiveVersionId() === id) {
    setActiveVersionId(next[0].id)
  }
  return next
}

/**
 * localStorage key for a doc/tutorial: workspace-scoped, then version-scoped.
 * Default version omits the version suffix for readability within a workspace.
 */
export function storageKeyFor(baseKey: string, versionId: string): string {
  const withVersion = versionId === DEFAULT_VERSION_ID ? baseKey : `${baseKey}::${versionId}`
  return workspaceScopedKey(withVersion)
}

function docBaseKeys(): string[] {
  // Covers built-in phases and any user-defined custom document types.
  return listDocumentTypes().map((meta) => meta.storageKey)
}

/** Clear every isolated localStorage key (phase docs + tutorial) for a version. */
export function clearVersionStorage(versionId: string): void {
  const bases = [...docBaseKeys(), TEMPLATE_TUTORIAL_BASE_KEY]
  for (const base of bases) {
    try {
      localStorage.removeItem(storageKeyFor(base, versionId))
    } catch {
      /* ignore */
    }
  }
  // Only touch unscoped legacy keys when we're not in a workspace folder —
  // otherwise we'd risk wiping another project's old cache.
  if (versionId === DEFAULT_VERSION_ID && !hasWorkspaceScope()) {
    for (const meta of Object.values(CANVAS_PHASES)) {
      try {
        if (meta.legacyStorageKey) localStorage.removeItem(meta.legacyStorageKey)
      } catch {
        /* ignore */
      }
    }
  }
}
