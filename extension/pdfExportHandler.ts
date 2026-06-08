import * as vscode from 'vscode'
import * as path from 'path'
import { exportDir } from './formStateManager'

export async function handlePdfExport(phase: 'charter' | 'prd', buffer: ArrayBuffer): Promise<string | null> {
  const exportPath = await exportDir()
  if (!exportPath) {
    vscode.window.showErrorMessage('No workspace open. Open a workspace first.')
    return null
  }

  const filename = `Req-Gath-Sys-${phase === 'charter' ? 'Project-Charter' : 'PRD'}.pdf`
  const filePath = path.join(exportPath, filename)

  try {
    await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), new Uint8Array(buffer))
    return filePath
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to write PDF: ${err}`)
    return null
  }
}

export async function handlePdfExportAs(phase: 'charter' | 'prd', buffer: ArrayBuffer): Promise<string | null> {
  const defaultName = `Req-Gath-Sys-${phase === 'charter' ? 'Project-Charter' : 'PRD'}.pdf`

  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(defaultName),
    filters: { 'PDF Files': ['pdf'] },
  })

  if (!uri) return null

  try {
    await vscode.workspace.fs.writeFile(uri, new Uint8Array(buffer))
    return uri.fsPath
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to write PDF: ${err}`)
    return null
  }
}
