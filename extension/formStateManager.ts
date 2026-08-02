import * as vscode from 'vscode'
import * as path from 'path'
import type { CustomOptionsStorage } from './protocol'
import { LEGACY_STATE_DIR, STATE_DIR } from './brand'

const CONFIG_FILE = 'config.json'
const CHARTER_FILE = 'charter.json'
const PRD_FILE = 'prd.json'
const CUSTOM_OPTIONS_FILE = 'custom-options.json'

const PHASE_FILES: Record<string, string> = {
  'project-charter': CHARTER_FILE,
  prd: PRD_FILE,
  'system-design': 'system-design.json',
  dev: 'dev.json',
  qa: 'qa.json',
  'post-dev': 'post-dev.json',
}

const DOC_TYPES_FILE = 'doc-types.json'

/** Resolve the on-disk filename for any phase, including custom document ids. */
function fileNameForPhase(phase: string): string | null {
  if (PHASE_FILES[phase]) return PHASE_FILES[phase]
  const safe = phase.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^-+|-+$/g, '')
  return safe ? `${safe}.json` : null
}

/** The pre-existing single-project data lives in the root state dir under this id. */
const DEFAULT_VERSION_ID = 'default'
const VERSIONS_SUBDIR = 'versions'

function isDefaultVersion(version?: string): boolean {
  return !version || version === DEFAULT_VERSION_ID
}

export interface LlmSettings {
  provider: string
  model: string | null
}

export interface EmbeddingSettings {
  provider: string
  model: string
}

export interface WorkspaceConfig {
  llm: LlmSettings
  embeddings?: EmbeddingSettings
}

export const DEFAULT_EMBEDDING_SETTINGS: EmbeddingSettings = {
  provider: 'ollama',
  model: 'nomic-embed-text',
}

function defaultConfig(): WorkspaceConfig {
  return {
    llm: { provider: 'deepseek', model: null },
    embeddings: { ...DEFAULT_EMBEDDING_SETTINGS },
  }
}

/** Embedding settings from config with defaults applied. */
export function resolveEmbeddingSettings(config: WorkspaceConfig): EmbeddingSettings {
  const e = config.embeddings
  return {
    provider: e?.provider || DEFAULT_EMBEDDING_SETTINGS.provider,
    model: e?.model || DEFAULT_EMBEDDING_SETTINGS.model,
  }
}

function primaryStateDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, STATE_DIR)
}

function legacyStateDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, LEGACY_STATE_DIR)
}

async function ensureDir(dir: string): Promise<void> {
  try {
    await vscode.workspace.fs.stat(vscode.Uri.file(dir))
  } catch {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(dir))
  }
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(vscode.Uri.file(target))
    return true
  } catch {
    return false
  }
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const uri = vscode.Uri.file(filePath)
    const bytes = await vscode.workspace.fs.readFile(uri)
    return JSON.parse(new TextDecoder().decode(bytes)) as T
  } catch {
    return null
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath))
  const uri = vscode.Uri.file(filePath)
  const bytes = new TextEncoder().encode(JSON.stringify(data, null, 2))
  await vscode.workspace.fs.writeFile(uri, bytes)
}

/** Prefer `.charter-ai/`; fall back to legacy `.req-gath-sys/` for reads. */
async function readStateJson<T>(workspaceRoot: string, filename: string): Promise<T | null> {
  const primary = await readJson<T>(path.join(primaryStateDir(workspaceRoot), filename))
  if (primary !== null) return primary
  return readJson<T>(path.join(legacyStateDir(workspaceRoot), filename))
}

/** Directory holding a version's documents. Default → root state dir; others → versions/<id>/. */
function versionDir(workspaceRoot: string, version?: string): string {
  if (isDefaultVersion(version)) return primaryStateDir(workspaceRoot)
  return path.join(primaryStateDir(workspaceRoot), VERSIONS_SUBDIR, version as string)
}

/** Read a version's doc file. Default version keeps the legacy `.req-gath-sys/` fallback. */
async function readVersionJson<T>(
  workspaceRoot: string,
  filename: string,
  version?: string,
): Promise<T | null> {
  if (isDefaultVersion(version)) return readStateJson<T>(workspaceRoot, filename)
  return readJson<T>(path.join(versionDir(workspaceRoot, version), filename))
}

/** Delete a version's entire document folder. No-op for the default (root) version. */
export async function deleteVersionDir(workspaceRoot: string, version: string): Promise<void> {
  if (isDefaultVersion(version)) return
  const dir = versionDir(workspaceRoot, version)
  try {
    await vscode.workspace.fs.delete(vscode.Uri.file(dir), { recursive: true, useTrash: false })
  } catch {
    /* folder may not exist yet */
  }
}

export async function initWorkspace(workspaceRoot: string): Promise<boolean> {
  const dir = primaryStateDir(workspaceRoot)
  if (await pathExists(dir)) return false
  // Already initialized under the legacy folder counts as initialized.
  if (await pathExists(legacyStateDir(workspaceRoot))) return false
  await ensureDir(dir)
  const configPath = path.join(dir, CONFIG_FILE)
  if (!(await pathExists(configPath))) {
    await writeJson(configPath, defaultConfig())
  }
  return true
}

export async function loadConfig(workspaceRoot: string): Promise<WorkspaceConfig> {
  const data = await readStateJson<WorkspaceConfig>(workspaceRoot, CONFIG_FILE)
  if (data && typeof data === 'object') return data
  return defaultConfig()
}

export async function saveConfig(workspaceRoot: string, config: WorkspaceConfig): Promise<void> {
  await writeJson(path.join(primaryStateDir(workspaceRoot), CONFIG_FILE), config)
}

export async function loadCharter(workspaceRoot: string): Promise<unknown | null> {
  return readStateJson(workspaceRoot, CHARTER_FILE)
}

export async function saveCharter(workspaceRoot: string, data: unknown): Promise<void> {
  await writeJson(path.join(primaryStateDir(workspaceRoot), CHARTER_FILE), data)
}

export async function loadPrd(
  workspaceRoot: string,
): Promise<{ prd: unknown | null; charter: unknown | null }> {
  const [prd, charter] = await Promise.all([
    readStateJson(workspaceRoot, PRD_FILE),
    readStateJson(workspaceRoot, CHARTER_FILE),
  ])
  return { prd, charter }
}

export async function savePrd(workspaceRoot: string, data: unknown): Promise<void> {
  await writeJson(path.join(primaryStateDir(workspaceRoot), PRD_FILE), data)
}

export async function loadForm(
  workspaceRoot: string,
  phase: string,
  version?: string,
): Promise<unknown | null> {
  const filename = fileNameForPhase(phase)
  if (!filename) return null
  return readVersionJson(workspaceRoot, filename, version)
}

export async function saveForm(
  workspaceRoot: string,
  phase: string,
  data: unknown,
  version?: string,
): Promise<void> {
  const filename = fileNameForPhase(phase)
  if (!filename) throw new Error(`Unknown phase: ${phase}`)
  await writeJson(path.join(versionDir(workspaceRoot, version), filename), data)
}

/** Custom document-type definitions are shared across all versions. */
export async function loadDocTypes(workspaceRoot: string): Promise<unknown[]> {
  const data = await readStateJson<unknown>(workspaceRoot, DOC_TYPES_FILE)
  return Array.isArray(data) ? data : []
}

export async function saveDocTypes(workspaceRoot: string, data: unknown): Promise<void> {
  await writeJson(path.join(primaryStateDir(workspaceRoot), DOC_TYPES_FILE), data)
}

/** Human-readable label for a phase/custom-doc id, using doc-types.json for custom ones. */
export async function docLabelFor(workspaceRoot: string, phase: string): Promise<string | null> {
  if (PHASE_FILES[phase]) return null
  const types = await loadDocTypes(workspaceRoot)
  const match = types.find(
    (t): t is { id: string; name: string } =>
      Boolean(t) && typeof t === 'object' && (t as { id?: unknown }).id === phase,
  )
  return match && typeof match.name === 'string' ? match.name : null
}

export async function loadCustomOptions(workspaceRoot: string): Promise<CustomOptionsStorage | null> {
  return readStateJson<CustomOptionsStorage>(workspaceRoot, CUSTOM_OPTIONS_FILE)
}

export async function saveCustomOptions(
  workspaceRoot: string,
  data: CustomOptionsStorage,
): Promise<void> {
  await writeJson(path.join(primaryStateDir(workspaceRoot), CUSTOM_OPTIONS_FILE), data)
}

export async function exportDir(): Promise<string | null> {
  const folders = vscode.workspace.workspaceFolders
  if (!folders || folders.length === 0) return null
  const exportPath = path.join(folders[0].uri.fsPath, STATE_DIR, 'export')
  await ensureDir(path.dirname(exportPath))
  await ensureDir(exportPath)
  return exportPath
}
