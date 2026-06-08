import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { loadCharter, saveCharter, loadPrd, savePrd, loadCustomOptions, saveCustomOptions } from './formStateManager'
import { handlePdfExport, handlePdfExportAs } from './pdfExportHandler'
import { CodeIndexer } from './codeIndexer'
import type { WebviewToExtensionMessage, ExtensionToWebviewMessage } from './protocol'

export function activate(context: vscode.ExtensionContext) {
  let panel: vscode.WebviewPanel | undefined

  function getHtml(webview: vscode.Webview): string {
    const distPath = path.join(context.extensionPath, 'dist', 'index.html')
    let html = fs.readFileSync(distPath, 'utf8')

    const rootUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist'))

    html = html.replace(/(src|href)=["']\.\/assets\//g, `$1="${rootUri}/assets/`)

    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com`,
      `font-src ${webview.cspSource} https://fonts.gstatic.com`,
      `script-src ${webview.cspSource}`,
      `img-src ${webview.cspSource} data:`,
    ].join('; ')

    html = html.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${csp}">`)

    return html
  }

  function postMessage(msg: ExtensionToWebviewMessage): void {
    panel?.webview.postMessage(msg)
  }

  async function handleMessage(msg: WebviewToExtensionMessage): Promise<void> {
    switch (msg.type) {
      case 'loadCharter': {
        const data = await loadCharter()
        postMessage({ type: 'loadCharter', data })
        break
      }
      case 'loadPrd': {
        const { prd, charter } = await loadPrd()
        postMessage({ type: 'loadPrd', data: prd, charterData: charter })
        break
      }
      case 'saveCharter': {
        await saveCharter(msg.data)
        break
      }
      case 'savePrd': {
        await savePrd(msg.data)
        break
      }
      case 'loadCustomOptions': {
        const data = await loadCustomOptions()
        postMessage({ type: 'loadCustomOptions', data: data ?? { strings: {}, choices: {} } })
        break
      }
      case 'saveCustomOptions': {
        await saveCustomOptions(msg.data)
        break
      }
      case 'exportPdf': {
        const filePath = await handlePdfExport(msg.phase, msg.buffer)
        if (filePath) {
          vscode.window.showInformationMessage(`PDF exported to ${filePath}`, 'Reveal in Explorer')
            .then(selection => {
              if (selection) vscode.commands.executeCommand('revealInExplorer', vscode.Uri.file(filePath))
            })
        }
        break
      }
      case 'exportPdfAs': {
        await handlePdfExportAs(msg.phase, msg.buffer)
        break
      }
      case 'indexCodebase': {
        const ws = workspaceRoot()
        if (!ws) {
          vscode.window.showErrorMessage('Open a workspace first.')
          postMessage({ type: 'loadCodeIndex', data: null })
          return
        }

        const indexer = new CodeIndexer(ws)
        postMessage({ type: 'indexProgress', phase: 'starting', percent: 0 })

        try {
          const index = await indexer.buildIndex((progress) => {
            postMessage({ type: 'indexProgress', phase: progress.phase, percent: progress.percent })
          })
          postMessage({ type: 'loadCodeIndex', data: index })
          vscode.window.showInformationMessage(`Code index rebuilt: ${index.summary.totalFiles} files, ${index.summary.totalTypes} types, ${index.summary.totalComponents} components`)
        } catch (err) {
          const msg_err = err instanceof Error ? err.message : String(err)
          vscode.window.showErrorMessage(`Indexing failed: ${msg_err}`)
          postMessage({ type: 'indexProgress', phase: 'error', percent: 0 })
          postMessage({ type: 'loadCodeIndex', data: null })
        }
        break
      }
      case 'loadCodeIndex': {
        const ws = workspaceRoot()
        if (!ws) {
          postMessage({ type: 'loadCodeIndex', data: null })
          return
        }
        const index = await new CodeIndexer(ws).loadIndex()
        postMessage({ type: 'loadCodeIndex', data: index })
        break
      }
    }
  }

  function workspaceRoot(): string | null {
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    if (folder) return folder
    return context.extensionPath
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('req-gath-sys.openPipeline', () => {
      if (panel) {
        panel.reveal(vscode.ViewColumn.One)
        return
      }

      panel = vscode.window.createWebviewPanel(
        'reqGathSysPanel',
        'Req-Gath-Sys Pipeline',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')],
        },
      )

      panel.webview.html = getHtml(panel.webview)

      panel.webview.onDidReceiveMessage(handleMessage)

      panel.onDidDispose(() => {
        panel = undefined
      })
    }),

    vscode.commands.registerCommand('req-gath-sys.indexCodebase', async () => {
      const ws = workspaceRoot()
      if (!ws) { vscode.window.showErrorMessage('Open a workspace first.'); return }

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Indexing codebase...',
        cancellable: false,
      }, async (progress) => {
        const indexer = new CodeIndexer(ws)
        progress.report({ message: 'Parsing AST...' })
        const index = await indexer.buildIndex((p) => {
          progress.report({ message: `${p.phase} (${p.percent}%)` })
        })
        vscode.window.showInformationMessage(
          `Code index: ${index.summary.totalFiles} files, ${index.summary.totalTypes} types, ${index.summary.totalComponents} components`,
        )
      })
    }),

    vscode.commands.registerCommand('req-gath-sys.initializeWorkspace', async () => {
      const ws = workspaceRoot()
      if (!ws) { vscode.window.showErrorMessage('Open a workspace first.'); return }

      const statePath = path.join(ws, '.req-gath-sys')
      if (!fs.existsSync(statePath)) {
        fs.mkdirSync(statePath, { recursive: true })
        vscode.window.showInformationMessage('Req-Gath-Sys workspace initialized!')
      } else {
        vscode.window.showInformationMessage('Req-Gath-Sys already initialized in this workspace.')
      }
    }),
  )
}

export function deactivate() {}
