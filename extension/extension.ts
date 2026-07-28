import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { handlePdfExport, handlePdfExportAs } from './pdfExportHandler'
import { CodeIndexer } from './codeIndexer'
import { getApiKey, promptForApiKey } from './apiKeyManager'
import {
  deleteVersionDir,
  initWorkspace,
  loadCharter,
  loadCustomOptions,
  loadDocTypes,
  loadForm,
  loadPrd,
  saveCharter,
  saveCustomOptions,
  saveDocTypes,
  saveForm,
  savePrd,
} from './formStateManager'
import { processChat } from './ai/agent'
import { diagramBlockFromProjection, projectModuleDependencyMermaid } from './ai/mermaidProject'
import { parseMermaid } from './ai/mermaidValidate'
import type { WebviewToExtensionMessage, ExtensionToWebviewMessage, CustomOptionsStorage } from './protocol'

export function activate(context: vscode.ExtensionContext) {
  let panel: vscode.WebviewPanel | undefined
  // The active document "version" (independent doc set in the same workspace).
  // Disk reads/writes and the AI chat agent all target this.
  let activeVersion = 'default'

  function getHtml(webview: vscode.Webview): string {
    const distPath = path.join(context.extensionPath, 'dist', 'index.html')
    let html = fs.readFileSync(distPath, 'utf8')

    const rootUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist'))

    html = html.replace(/(src|href)=["']\.\/assets\//g, `$1="${rootUri}/assets/`)

    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com`,
      `font-src ${webview.cspSource} data: https://fonts.gstatic.com`,
      `script-src ${webview.cspSource}`,
      `img-src ${webview.cspSource} data: blob:`,
      `worker-src ${webview.cspSource} blob:`,
      `connect-src ${webview.cspSource}`,
      `wasm-src ${webview.cspSource} blob:`,
    ].join('; ')

    html = html.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${csp}">`)

    return html
  }

  function postMessage(msg: ExtensionToWebviewMessage): void {
    panel?.webview.postMessage(msg)
  }

  async function handleMessage(msg: WebviewToExtensionMessage): Promise<void> {
    const ws = workspaceRoot()

    switch (msg.type) {
      case 'loadCharter': {
        const data = await loadCharter(ws)
        postMessage({ type: 'loadCharter', data })
        break
      }
      case 'loadPrd': {
        const result = await loadPrd(ws)
        postMessage({ type: 'loadPrd', data: result.prd, charterData: result.charter })
        break
      }
      case 'saveCharter': {
        await saveCharter(ws, msg.data)
        break
      }
      case 'savePrd': {
        await savePrd(ws, msg.data)
        break
      }
      case 'loadForm': {
        const data = await loadForm(ws, msg.phase, activeVersion)
        postMessage({ type: 'loadForm', phase: msg.phase, data })
        break
      }
      case 'saveForm': {
        await saveForm(ws, msg.phase, msg.data, activeVersion)
        break
      }
      case 'loadDocTypes': {
        const data = await loadDocTypes(ws)
        postMessage({ type: 'loadDocTypes', data })
        break
      }
      case 'saveDocTypes': {
        await saveDocTypes(ws, msg.data)
        break
      }
      case 'setActiveVersion': {
        activeVersion = msg.version || 'default'
        break
      }
      case 'deleteVersion': {
        await deleteVersionDir(ws, msg.version)
        break
      }
      case 'loadCanvas': {
        const version = msg.version ?? activeVersion
        const data = await loadForm(ws, msg.phase, version)
        postMessage({ type: 'loadCanvas', phase: msg.phase, data, version })
        break
      }
      case 'saveCanvas': {
        const version = msg.version ?? activeVersion
        if (msg.version) activeVersion = msg.version
        await saveForm(ws, msg.phase, msg.data, version)
        break
      }
      case 'loadCustomOptions': {
        const data = await loadCustomOptions(ws)
        postMessage({
          type: 'loadCustomOptions',
          data: (data ?? { strings: {}, choices: {} }) as CustomOptionsStorage,
        })
        break
      }
      case 'saveCustomOptions': {
        await saveCustomOptions(ws, msg.data)
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
        if (!ws) {
          postMessage({ type: 'loadCodeIndex', data: null })
          return
        }
        const index = await new CodeIndexer(ws).loadIndex()
        postMessage({ type: 'loadCodeIndex', data: index })
        break
      }
      case 'chatMessage': {
        try {
          // Optional: SecretStorage key. If empty, llmClient falls back to the
          // DEEPSEEK_API_KEY / MOONSHOT_API_KEY / generic env variables.
          const apiKey = (await getApiKey(context)) ?? ''

          const result = await processChat({
            text: msg.text,
            phase: msg.phase,
            workspaceRoot: ws,
            apiKey,
            version: activeVersion,
          })

          if (result.reload) {
            if (result.reload.type === 'load_canvas' && result.reload.phase) {
              postMessage({
                type: 'loadCanvas',
                phase: result.reload.phase,
                data: result.reload.data,
              })
              // Keep legacy charter channel in sync for older listeners.
              if (result.reload.phase === 'project-charter') {
                postMessage({ type: 'loadCharter', data: result.reload.data })
              }
            } else if (result.reload.type === 'load_charter') {
              postMessage({ type: 'loadCharter', data: result.reload.data })
              postMessage({
                type: 'loadCanvas',
                phase: 'project-charter',
                data: result.reload.data,
              })
            } else if (result.reload.type === 'load_prd') {
              postMessage({
                type: 'loadPrd',
                data: result.reload.data,
                charterData: result.reload.charterData ?? null,
              })
            } else if (result.reload.type === 'load_form' && result.reload.phase) {
              postMessage({
                type: 'loadForm',
                phase: result.reload.phase,
                data: result.reload.data,
              })
            }
          }

          postMessage({ type: 'chatResponse', text: result.message })
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err)
          postMessage({ type: 'chatResponse', text: `Error: ${errorMsg}` })
        }
        break
      }
    }
  }

  function workspaceRoot(): string {
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    if (folder) return folder
    return context.extensionPath
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('charter-ai.openPipeline', () => {
      if (panel) {
        panel.reveal(vscode.ViewColumn.One)
        return
      }

      panel = vscode.window.createWebviewPanel(
        'charterAiPanel',
        'Charter Ai',
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

    vscode.commands.registerCommand('charter-ai.configureApiKey', async () => {
      await promptForApiKey(context)
    }),

    vscode.commands.registerCommand('charter-ai.indexCodebase', async () => {
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

    vscode.commands.registerCommand('charter-ai.initializeWorkspace', async () => {
      const ws = workspaceRoot()
      if (!ws) { vscode.window.showErrorMessage('Open a workspace first.'); return }

      try {
        const created = await initWorkspace(ws)
        if (created) {
          vscode.window.showInformationMessage('Charter Ai workspace initialized!')
        } else {
          vscode.window.showInformationMessage('Charter Ai already initialized in this workspace.')
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        vscode.window.showErrorMessage(`Failed to initialize workspace: ${errorMsg}`)
      }
    }),

    vscode.commands.registerCommand('charter-ai.insertDependencyDiagram', async () => {
      const ws = workspaceRoot()
      if (!ws) {
        vscode.window.showErrorMessage('Open a workspace first.')
        return
      }

      const phasePick = await vscode.window.showQuickPick(
        [
          { label: 'System Design', description: 'system-design', id: 'system-design' },
          { label: 'PRD', description: 'prd', id: 'prd' },
          { label: 'Project Charter', description: 'project-charter', id: 'project-charter' },
          { label: 'Development', description: 'dev', id: 'dev' },
        ],
        { placeHolder: 'Insert module dependency diagram into which phase canvas?' },
      )
      if (!phasePick) return
      const phase = phasePick.id

      const focus = await vscode.window.showInputBox({
        prompt: 'Optional path focus (e.g. extension/ or src/hooks). Leave empty for top dependencies.',
        placeHolder: 'src/',
      })
      if (focus === undefined) return

      try {
        const indexer = new CodeIndexer(ws)
        let index = await indexer.loadIndex()
        if (!index) {
          index = await indexer.buildIndex()
        }
        const projected = projectModuleDependencyMermaid(index, {
          focus: focus.trim() || undefined,
          maxNodes: 20,
        })
        const parsed = await parseMermaid(projected.code)
        if (!parsed.ok) {
          vscode.window.showErrorMessage(`Generated Mermaid failed to parse: ${parsed.error}`)
          return
        }

        const existing = await loadForm(ws, phase, activeVersion)
        const blocks =
          existing &&
          typeof existing === 'object' &&
          !Array.isArray(existing) &&
          Array.isArray((existing as { blocks?: unknown }).blocks)
            ? ([...(existing as { blocks: unknown[] }).blocks] as unknown[])
            : [{ type: 'paragraph', content: '' }]

        blocks.push({
          type: 'heading',
          props: { level: 2 },
          content: projected.title,
        })
        blocks.push(diagramBlockFromProjection(projected))

        const anchors =
          existing &&
          typeof existing === 'object' &&
          !Array.isArray(existing) &&
          (existing as { anchors?: unknown }).anchors &&
          typeof (existing as { anchors?: unknown }).anchors === 'object'
            ? (existing as { anchors: Record<string, string> }).anchors
            : {}

        const saved = {
          version: 1 as const,
          kind: 'blocknote' as const,
          blocks,
          anchors,
        }
        await saveForm(ws, phase, saved, activeVersion)
        postMessage({ type: 'loadCanvas', phase, data: saved, version: activeVersion })

        const trunc = projected.truncated ? ' (capped/clustered)' : ''
        vscode.window.showInformationMessage(
          `Inserted dependency diagram into ${phase}: ${projected.nodeCount} nodes, ${projected.edgeCount} edges${trunc}.`,
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        vscode.window.showErrorMessage(`Failed to insert diagram: ${msg}`)
      }
    }),
  )
}

export function deactivate() {}
