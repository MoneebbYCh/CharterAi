import * as vscode from 'vscode'
import * as path from 'path'
import type { CustomOptionsStorage } from './protocol'

const STATE_DIR = '.req-gath-sys'
const CONFIG_FILE = 'config.json'
const CHARTER_FILE = 'charter.json'
const PRD_FILE = 'prd.json'
const CUSTOM_OPTIONS_FILE = 'custom-options.json'

// Generic phase -> storage filename map. Charter and PRD keep their dedicated
// helpers for backward compatibility; new phases use loadForm / saveForm.
const PHASE_FILES: Record<string, string> = {
  'project-charter': CHARTER_FILE,
  prd: PRD_FILE,
  'system-design': 'system-design.json',
}

export interface LlmSettings {
  provider: string
  model: string | null
}

export interface WorkspaceConfig {
  llm: LlmSettings
}

function defaultConfig(): WorkspaceConfig {
  return { llm: { provider: 'deepseek', model: null } }
}

function stateDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, STATE_DIR)
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

export async function initWorkspace(workspaceRoot: string): Promise<boolean> {
  const dir = stateDir(workspaceRoot)
  if (await pathExists(dir)) return false
  await ensureDir(dir)
  const configPath = path.join(dir, CONFIG_FILE)
  if (!(await pathExists(configPath))) {
    await writeJson(configPath, defaultConfig())
  }
  return true
}

export async function loadConfig(workspaceRoot: string): Promise<WorkspaceConfig> {
  const data = await readJson<WorkspaceConfig>(path.join(stateDir(workspaceRoot), CONFIG_FILE))
  if (data && typeof data === 'object') return data
  return defaultConfig()
}

export async function loadCharter(workspaceRoot: string): Promise<unknown | null> {
  return readJson(path.join(stateDir(workspaceRoot), CHARTER_FILE))
}

export async function saveCharter(workspaceRoot: string, data: unknown): Promise<void> {
  await writeJson(path.join(stateDir(workspaceRoot), CHARTER_FILE), data)
}

export async function loadPrd(
  workspaceRoot: string,
): Promise<{ prd: unknown | null; charter: unknown | null }> {
  const dir = stateDir(workspaceRoot)
  const [prd, charter] = await Promise.all([
    readJson(path.join(dir, PRD_FILE)),
    readJson(path.join(dir, CHARTER_FILE)),
  ])
  return { prd, charter }
}

export async function savePrd(workspaceRoot: string, data: unknown): Promise<void> {
  await writeJson(path.join(stateDir(workspaceRoot), PRD_FILE), data)
}

export async function loadForm(workspaceRoot: string, phase: string): Promise<unknown | null> {
  const filename = PHASE_FILES[phase]
  if (!filename) return null
  return readJson(path.join(stateDir(workspaceRoot), filename))
}

export async function saveForm(workspaceRoot: string, phase: string, data: unknown): Promise<void> {
  const filename = PHASE_FILES[phase]
  if (!filename) throw new Error(`Unknown phase: ${phase}`)
  await writeJson(path.join(stateDir(workspaceRoot), filename), data)
}

export async function loadCustomOptions(workspaceRoot: string): Promise<CustomOptionsStorage | null> {
  return readJson<CustomOptionsStorage>(path.join(stateDir(workspaceRoot), CUSTOM_OPTIONS_FILE))
}

export async function saveCustomOptions(
  workspaceRoot: string,
  data: CustomOptionsStorage,
): Promise<void> {
  await writeJson(path.join(stateDir(workspaceRoot), CUSTOM_OPTIONS_FILE), data)
}

export async function exportDir(): Promise<string | null> {
  const folders = vscode.workspace.workspaceFolders
  if (!folders || folders.length === 0) return null
  const exportPath = path.join(folders[0].uri.fsPath, STATE_DIR, 'export')
  await ensureDir(path.dirname(exportPath))
  await ensureDir(exportPath)
  return exportPath
}
