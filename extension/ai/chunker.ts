import * as ts from 'typescript'

export interface CodeChunk {
  id: string
  file: string
  startLine: number
  endLine: number
  symbol: string
  kind: 'function' | 'class' | 'interface' | 'type' | 'enum' | 'component' | 'block'
  /** Text used for embedding (includes a small path/symbol header). */
  text: string
}

const MAX_CHARS = 1400
const WINDOW_LINES = 60
const OVERLAP_LINES = 10
const MAX_FILE_BYTES = 200_000

const TS_EXT = /\.(ts|tsx|mts|cts)$/i
const JS_EXT = /\.(js|jsx|mjs|cjs)$/i

function looksMinified(content: string): boolean {
  const lines = content.split('\n')
  if (lines.length === 0) return false
  const avg = content.length / lines.length
  return avg > 400
}

function header(file: string, symbol: string, start: number, end: number): string {
  const sym = symbol && symbol !== 'block' ? ` ${symbol}` : ''
  return `// ${file}:${start}-${end}${sym}\n`
}

function mkId(file: string, start: number, end: number): string {
  return `${file}#${start}-${end}`
}

/** Split an oversized text span into line windows so no chunk blows the budget. */
function windowize(
  file: string,
  symbol: string,
  kind: CodeChunk['kind'],
  lines: string[],
  baseLine: number,
): CodeChunk[] {
  const chunks: CodeChunk[] = []
  for (let i = 0; i < lines.length; i += WINDOW_LINES - OVERLAP_LINES) {
    const slice = lines.slice(i, i + WINDOW_LINES)
    if (slice.length === 0) break
    const startLine = baseLine + i
    const endLine = startLine + slice.length - 1
    const body = slice.join('\n')
    chunks.push({
      id: mkId(file, startLine, endLine),
      file,
      startLine,
      endLine,
      symbol,
      kind,
      text: header(file, symbol, startLine, endLine) + body.slice(0, MAX_CHARS * 2),
    })
    if (i + WINDOW_LINES >= lines.length) break
  }
  return chunks
}

function chunkTypeScript(file: string, content: string): CodeChunk[] {
  const scriptKind = TS_EXT.test(file) && file.toLowerCase().endsWith('x')
    ? ts.ScriptKind.TSX
    : JS_EXT.test(file)
      ? ts.ScriptKind.JSX
      : ts.ScriptKind.TS
  const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, scriptKind)
  const chunks: CodeChunk[] = []

  const lineOf = (pos: number) => sf.getLineAndCharacterOfPosition(pos).line + 1

  const push = (node: ts.Node, symbol: string, kind: CodeChunk['kind']) => {
    // getStart(sf, true) includes leading JSDoc/comments.
    const start = node.getStart(sf, true)
    const end = node.getEnd()
    const startLine = lineOf(start)
    const endLine = lineOf(end)
    const raw = content.slice(start, end)
    if (raw.length > MAX_CHARS) {
      chunks.push(...windowize(file, symbol, kind, raw.split('\n'), startLine))
      return
    }
    chunks.push({
      id: mkId(file, startLine, endLine),
      file,
      startLine,
      endLine,
      symbol,
      kind,
      text: header(file, symbol, startLine, endLine) + raw,
    })
  }

  const nameOf = (node: ts.NamedDeclaration): string => {
    const n = node.name
    return n && ts.isIdentifier(n) ? n.text : 'anonymous'
  }

  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node) && node.body) {
      push(node, nameOf(node), 'function')
      return
    }
    if (ts.isClassDeclaration(node)) {
      push(node, nameOf(node), 'class')
      return
    }
    if (ts.isInterfaceDeclaration(node)) {
      push(node, node.name.text, 'interface')
      return
    }
    if (ts.isTypeAliasDeclaration(node)) {
      push(node, node.name.text, 'type')
      return
    }
    if (ts.isEnumDeclaration(node)) {
      push(node, node.name.text, 'enum')
      return
    }
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (
          ts.isIdentifier(decl.name) &&
          decl.initializer &&
          (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))
        ) {
          const name = decl.name.text
          const kind: CodeChunk['kind'] = /^[A-Z]/.test(name) ? 'component' : 'function'
          push(node, name, kind)
        }
      }
      return
    }
  }

  sf.forEachChild(visit)

  // Nothing structural captured (e.g. a script of top-level statements) — window it.
  if (chunks.length === 0) {
    return windowize(file, 'block', 'block', content.split('\n'), 1)
  }
  return chunks
}

/** Produce embeddable chunks for a single file. */
export function chunkFile(relPath: string, content: string): CodeChunk[] {
  if (!content || content.length > MAX_FILE_BYTES || looksMinified(content)) return []
  if (TS_EXT.test(relPath) || JS_EXT.test(relPath)) {
    try {
      return chunkTypeScript(relPath, content)
    } catch {
      // Fall through to the generic windower on any parser hiccup.
    }
  }
  return windowize(relPath, 'block', 'block', content.split('\n'), 1)
}
