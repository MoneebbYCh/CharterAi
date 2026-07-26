import * as fs from 'fs'
import * as path from 'path'
import { LEGACY_STATE_DIR, STATE_DIR } from '../brand'

const CODE_INDEX_FILE = 'code-index.json'

// Keep the injected context small so it does not blow the model context window.
const MAX_FILES = 40
const MAX_TYPES = 25
const MAX_COMPONENTS = 25

interface CodeIndexShape {
  summary?: {
    totalFiles?: number
    totalTypes?: number
    totalComponents?: number
    totalHooks?: number
  }
  graph?: { nodes?: number; edges?: number }
  components?: Array<{ name?: unknown }>
  types?: Array<{ name?: unknown }>
  files?: Array<{ path?: unknown }>
}

function readIndex(workspaceRoot: string): CodeIndexShape | null {
  for (const dir of [STATE_DIR, LEGACY_STATE_DIR]) {
    const indexPath = path.join(workspaceRoot, dir, CODE_INDEX_FILE)
    if (!fs.existsSync(indexPath)) continue
    try {
      const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
      return data && typeof data === 'object' ? (data as CodeIndexShape) : null
    } catch {
      /* try next */
    }
  }
  return null
}

function names(items: Array<Record<string, unknown>> | undefined, key: string, limit: number): string[] {
  if (!Array.isArray(items)) return []
  return items
    .slice(0, limit)
    .map((item) => (item && typeof item === 'object' ? item[key] : undefined))
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
}

export function buildCodeContext(workspaceRoot: string): string {
  const index = readIndex(workspaceRoot)
  if (!index) return ''

  const lines: string[] = ['INDEXED CODEBASE CONTEXT:']

  const summary = index.summary
  if (summary && typeof summary === 'object') {
    lines.push(
      '- Totals: ' +
        `${summary.totalFiles ?? 0} files, ` +
        `${summary.totalTypes ?? 0} types, ` +
        `${summary.totalComponents ?? 0} components, ` +
        `${summary.totalHooks ?? 0} hooks`,
    )
  }

  const graph = index.graph
  if (graph && typeof graph === 'object') {
    lines.push(`- Knowledge graph: ${graph.nodes ?? 0} nodes, ${graph.edges ?? 0} edges`)
  }

  const componentNames = names(index.components, 'name', MAX_COMPONENTS)
  if (componentNames.length) {
    lines.push(`- Components: ${componentNames.join(', ')}`)
  }

  const typeNames = names(index.types, 'name', MAX_TYPES)
  if (typeNames.length) {
    lines.push(`- Types: ${typeNames.join(', ')}`)
  }

  const filePaths = names(index.files, 'path', MAX_FILES)
  if (filePaths.length) {
    lines.push('- Key files:')
    lines.push(...filePaths.map((p) => `    ${p}`))
  }

  // Only the header means no useful data was found.
  if (lines.length === 1) return ''

  return lines.join('\n')
}
