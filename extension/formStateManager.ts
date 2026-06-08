import * as vscode from 'vscode'
import * as path from 'path'
import type { CustomOptionsStorage } from './protocol'

const STATE_DIR = '.req-gath-sys'

function workspaceDir(): string | null {
  const folders = vscode.workspace.workspaceFolders
  if (!folders || folders.length === 0) return null
  return path.join(folders[0].uri.fsPath, STATE_DIR)
}

async function ensureDir(dir: string): Promise<void> {
  try {
    await vscode.workspace.fs.stat(vscode.Uri.file(dir))
  } catch {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(dir))
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
  const uri = vscode.Uri.file(filePath)
  const bytes = new TextEncoder().encode(JSON.stringify(data, null, 2))
  await vscode.workspace.fs.writeFile(uri, bytes)
}

export async function loadCharter(): Promise<unknown | null> {
  const dir = workspaceDir()
  if (!dir) return null
  return readJson(path.join(dir, 'charter.json'))
}

export async function saveCharter(data: unknown): Promise<void> {
  const dir = workspaceDir()
  if (!dir) return
  await ensureDir(dir)
  await writeJson(path.join(dir, 'charter.json'), data)
}

export async function loadPrd(): Promise<{ prd: unknown | null; charter: unknown | null }> {
  const dir = workspaceDir()
  if (!dir) return { prd: null, charter: null }
  const [prd, charter] = await Promise.all([
    readJson(path.join(dir, 'prd.json')),
    readJson(path.join(dir, 'charter.json')),
  ])
  return { prd, charter }
}

export async function savePrd(data: unknown): Promise<void> {
  const dir = workspaceDir()
  if (!dir) return
  await ensureDir(dir)
  await writeJson(path.join(dir, 'prd.json'), data)
}

export async function loadCustomOptions(): Promise<CustomOptionsStorage | null> {
  const dir = workspaceDir()
  if (!dir) return null
  return readJson<CustomOptionsStorage>(path.join(dir, 'custom-options.json'))
}

export async function saveCustomOptions(data: CustomOptionsStorage): Promise<void> {
  const dir = workspaceDir()
  if (!dir) return
  await ensureDir(dir)
  await writeJson(path.join(dir, 'custom-options.json'), data)
}

export async function exportDir(): Promise<string | null> {
  const dir = workspaceDir()
  if (!dir) return null
  const exportPath = path.join(dir, 'export')
  await ensureDir(exportPath)
  return exportPath
}
