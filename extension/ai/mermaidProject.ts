import type { CodeIndex, FileEntry } from '../codeIndexer'

const DEFAULT_MAX_NODES = 20

export interface ModuleDepDiagramOptions {
  /** Substring match on file path to focus the subgraph (e.g. "extension/" or "src/hooks"). */
  focus?: string
  /** Hard cap — cluster by top folder if exceeded. */
  maxNodes?: number
}

export interface ModuleDepDiagramResult {
  code: string
  title: string
  nodeCount: number
  edgeCount: number
  truncated: boolean
  focus: string | null
}

function normPath(p: string): string {
  return p.replace(/\\/g, '/')
}

function fileId(p: string): string {
  // Mermaid node ids: alphanumeric + underscore
  return (
    'N_' +
    normPath(p)
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64)
  )
}

function fileLabel(p: string): string {
  const n = normPath(p)
  const parts = n.split('/')
  if (parts.length <= 2) return n
  return parts.slice(-2).join('/')
}

function topFolder(p: string): string {
  const n = normPath(p)
  const parts = n.split('/').filter(Boolean)
  if (parts[0] === 'src' || parts[0] === 'extension') {
    return parts.slice(0, Math.min(2, parts.length)).join('/')
  }
  return parts[0] || 'root'
}

function resolveImport(fromFile: string, source: string, pathSet: Set<string>): string | null {
  if (!source.startsWith('.')) return null
  const fromDir = normPath(fromFile).split('/').slice(0, -1).join('/')
  const joined = normPath(
    [fromDir, ...source.split('/')]
      .reduce<string[]>((acc, part) => {
        if (part === '.' || part === '') return acc
        if (part === '..') {
          acc.pop()
          return acc
        }
        acc.push(part)
        return acc
      }, [])
      .join('/'),
  )

  const candidates = [
    joined,
    `${joined}.ts`,
    `${joined}.tsx`,
    `${joined}.js`,
    `${joined}.jsx`,
    `${joined}/index.ts`,
    `${joined}/index.tsx`,
  ]
  for (const c of candidates) {
    if (pathSet.has(c)) return c
  }
  // Loose match: any indexed file that ends with the joined path
  for (const p of pathSet) {
    if (p === joined || p.startsWith(joined + '.') || p.startsWith(joined + '/')) return p
  }
  return null
}

function buildEdges(files: FileEntry[]): { nodes: Set<string>; edges: { from: string; to: string }[] } {
  const pathSet = new Set(files.map((f) => normPath(f.path)))
  const nodes = new Set<string>()
  const edgeSet = new Set<string>()
  const edges: { from: string; to: string }[] = []

  for (const file of files) {
    const from = normPath(file.path)
    nodes.add(from)
    for (const imp of file.imports) {
      const to = resolveImport(from, imp.source, pathSet)
      if (!to || to === from) continue
      nodes.add(to)
      const key = `${from}→${to}`
      if (edgeSet.has(key)) continue
      edgeSet.add(key)
      edges.push({ from, to })
    }
  }
  return { nodes, edges }
}

function expandAroundFocus(
  allNodes: Set<string>,
  edges: { from: string; to: string }[],
  focus: string,
  maxNodes: number,
): Set<string> {
  const focusNorm = focus.replace(/\\/g, '/')
  const seeds = [...allNodes].filter((p) => p.includes(focusNorm))
  if (seeds.length === 0) return new Set([...allNodes].slice(0, maxNodes))

  const keep = new Set<string>(seeds)
  const adj = new Map<string, Set<string>>()
  for (const e of edges) {
    if (!adj.has(e.from)) adj.set(e.from, new Set())
    if (!adj.has(e.to)) adj.set(e.to, new Set())
    adj.get(e.from)!.add(e.to)
    adj.get(e.to)!.add(e.from)
  }

  const queue = [...seeds]
  while (queue.length && keep.size < maxNodes) {
    const cur = queue.shift()!
    for (const n of adj.get(cur) ?? []) {
      if (keep.has(n)) continue
      keep.add(n)
      queue.push(n)
      if (keep.size >= maxNodes) break
    }
  }
  return keep
}

function clusterByFolder(
  nodes: Set<string>,
  edges: { from: string; to: string }[],
  maxNodes: number,
): { code: string; nodeCount: number; edgeCount: number } {
  const folders = new Map<string, string[]>()
  for (const p of nodes) {
    const folder = topFolder(p)
    if (!folders.has(folder)) folders.set(folder, [])
    folders.get(folder)!.push(p)
  }

  const folderIds = [...folders.keys()].slice(0, maxNodes)
  const folderSet = new Set(folderIds)
  const lines = ['graph TD']
  for (const f of folderIds) {
    const id = fileId(f)
    const count = folders.get(f)?.length ?? 0
    lines.push(`  ${id}["${f} (${count})"]`)
  }

  const edgeKeys = new Set<string>()
  let edgeCount = 0
  for (const e of edges) {
    const a = topFolder(e.from)
    const b = topFolder(e.to)
    if (a === b) continue
    if (!folderSet.has(a) || !folderSet.has(b)) continue
    const key = `${a}→${b}`
    if (edgeKeys.has(key)) continue
    edgeKeys.add(key)
    lines.push(`  ${fileId(a)} --> ${fileId(b)}`)
    edgeCount++
  }

  return { code: lines.join('\n'), nodeCount: folderIds.length, edgeCount }
}

/**
 * Deterministic CodeIndex → Mermaid `graph TD` projection.
 * No LLM — structure comes only from file import edges.
 */
export function projectModuleDependencyMermaid(
  index: CodeIndex,
  options: ModuleDepDiagramOptions = {},
): ModuleDepDiagramResult {
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES
  const focus = options.focus?.trim() || null
  const { nodes: allNodes, edges: allEdges } = buildEdges(index.files)

  let selected = focus
    ? expandAroundFocus(allNodes, allEdges, focus, maxNodes)
    : new Set(
        [...allNodes]
          .sort((a, b) => b.length - a.length)
          .slice(0, maxNodes),
      )

  // Prefer high-degree nodes when no focus
  if (!focus) {
    const degree = new Map<string, number>()
    for (const n of allNodes) degree.set(n, 0)
    for (const e of allEdges) {
      degree.set(e.from, (degree.get(e.from) ?? 0) + 1)
      degree.set(e.to, (degree.get(e.to) ?? 0) + 1)
    }
    selected = new Set(
      [...allNodes]
        .sort((a, b) => (degree.get(b) ?? 0) - (degree.get(a) ?? 0))
        .slice(0, maxNodes),
    )
  }

  let truncated = allNodes.size > selected.size

  // If still too dense conceptually, cluster
  if (allNodes.size > maxNodes * 2 && !focus) {
    const clustered = clusterByFolder(allNodes, allEdges, maxNodes)
    return {
      code: clustered.code,
      title: 'Module dependencies (clustered)',
      nodeCount: clustered.nodeCount,
      edgeCount: clustered.edgeCount,
      truncated: true,
      focus,
    }
  }

  const lines = ['graph TD']
  for (const p of [...selected].sort()) {
    lines.push(`  ${fileId(p)}["${fileLabel(p)}"]`)
  }

  let edgeCount = 0
  for (const e of allEdges) {
    if (!selected.has(e.from) || !selected.has(e.to)) {
      truncated = true
      continue
    }
    lines.push(`  ${fileId(e.from)} --> ${fileId(e.to)}`)
    edgeCount++
  }

  const title = focus
    ? `Dependencies around ${focus}`
    : 'Module dependency diagram'

  return {
    code: lines.join('\n'),
    title,
    nodeCount: selected.size,
    edgeCount,
    truncated,
    focus,
  }
}

export function diagramBlockFromProjection(result: ModuleDepDiagramResult): Record<string, unknown> {
  return {
    type: 'diagram',
    props: {
      code: result.code,
      title: result.title,
      source: 'code-index',
    },
  }
}
