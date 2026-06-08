import { useEffect, useState, useCallback } from 'react'
import { getVscodeApi } from '../utils/vscodeApi'

const vscode = getVscodeApi()

export interface CodeIndexSummary {
  totalFiles: number
  totalTypes: number
  totalComponents: number
  totalHooks: number
}

export interface GraphSummary {
  nodes: number
  edges: number
  communities: number
}

export type IndexState =
  | { status: 'idle' }
  | { status: 'indexing'; phase: string; percent: number }
  | { status: 'done'; summary: CodeIndexSummary; graph: GraphSummary | null }
  | { status: 'error'; message: string }

export function useCodeIndex() {
  const [state, setState] = useState<IndexState>({ status: 'idle' })

  useEffect(() => {
    if (!vscode) return
    const handler = (event: MessageEvent) => {
      const msg = event.data
      if (msg.type === 'indexProgress') {
        setState((prev) => {
          if (msg.phase === 'error') {
            return { status: 'error', message: 'Indexing failed on the extension side' }
          }
          if (prev.status === 'idle' || prev.status === 'indexing') {
            return { status: 'indexing', phase: msg.phase, percent: msg.percent }
          }
          return prev
        })
      }
      if (msg.type === 'loadCodeIndex') {
        if (msg.data) {
          const d = msg.data
          setState({
            status: 'done',
            summary: d.summary ?? { totalFiles: 0, totalTypes: 0, totalComponents: 0, totalHooks: 0 },
            graph: d.graph
              ? { nodes: d.graph.nodes, edges: d.graph.edges, communities: d.graph.communities?.length ?? 0 }
              : null,
          })
        } else {
          setState({ status: 'error', message: 'No workspace open — open a folder in VS Code first.' })
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const startIndexing = useCallback(() => {
    if (!vscode) {
      setState({ status: 'error', message: 'Not running inside VS Code webview.' })
      return
    }
    setState({ status: 'indexing', phase: 'starting', percent: 0 })
    vscode.postMessage({ type: 'indexCodebase' })
  }, [])

  const loadIndex = useCallback(() => {
    if (!vscode) {
      setState({ status: 'error', message: 'Not running inside VS Code webview.' })
      return
    }
    setState({ status: 'indexing', phase: 'loading', percent: 0 })
    vscode.postMessage({ type: 'loadCodeIndex' })
  }, [])

  const reset = useCallback(() => {
    setState({ status: 'idle' })
  }, [])

  return { state, startIndexing, loadIndex, reset }
}
