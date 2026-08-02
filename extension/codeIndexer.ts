import * as path from 'path'
import * as fs from 'fs'
import * as crypto from 'crypto'
import * as ts from 'typescript'
import { spawn } from 'child_process'
import { LEGACY_STATE_DIR, STATE_DIR } from './brand'
import { chunkFile } from './ai/chunker'
import { embedTexts, type EmbeddingConfig } from './ai/embeddings'
import { VectorStore } from './ai/vectorStore'

export interface FileEntry {
  path: string
  kind: 'react-component' | 'react-hook' | 'typescript-module' | 'extension-module' | 'config' | 'other'
  exports: string[]
  imports: { source: string; names: string[] }[]
  components: { name: string; propsInterface: string | null }[]
  hooks: string[]
  hasJsdoc: boolean
  loc: number
}

export interface TypeProperty {
  name: string
  type: string
  optional: boolean
}

export interface TypeEntry {
  name: string
  source: string
  kind: 'interface' | 'type' | 'enum' | 'class'
  properties: TypeProperty[]
}

export interface ComponentEntry {
  name: string
  file: string
  propsInterface: string | null
  parentComponents: string[]
  childComponents: string[]
}

export interface IpcMessageEntry {
  type: string
  payload: string
}

export interface CommunityEntry {
  id: number
  name: string
  cohesion: number
  nodeCount: number
}

export interface CodeIndex {
  version: number
  generatedAt: string
  summary: {
    totalFiles: number
    totalTypes: number
    totalComponents: number
    totalHooks: number
    totalIpcMessages: number
  }
  files: FileEntry[]
  types: TypeEntry[]
  components: ComponentEntry[]
  ipc: {
    webviewToExtension: IpcMessageEntry[]
    extensionToWebview: IpcMessageEntry[]
  }
  graph: {
    nodes: number
    edges: number
    communities: CommunityEntry[]
  } | null
  cache: {
    byFile: Record<string, string>
  }
}

export interface IndexProgress {
  phase: string
  percent: number
}

type ProgressCallback = (progress: IndexProgress) => void

const INDEX_VERSION = 1
const MADAR_TIMEOUT = 180_000
const SUPPORTED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.go', '.rs', '.java', '.rb', '.php',
  '.swift', '.kt', '.kts', '.scala',
  '.sh', '.bash', '.zsh', '.ps1',
  '.md', '.mdx', '.json', '.yaml', '.yml', '.toml',
  '.css', '.scss', '.html', '.htm',
  '.sql',
])

export class CodeIndexer {
  constructor(private workspaceRoot: string) {}

  async buildIndex(onProgress?: ProgressCallback): Promise<CodeIndex> {
    onProgress?.({ phase: 'running-madar', percent: 2 })
    const madarResult = await this.runMadar(onProgress).catch(() => null)

    onProgress?.({ phase: 'discovering-files', percent: 20 })
    const allFiles = this.collectSourceFiles()
    const tsFiles = allFiles.filter((f) => /\.(ts|tsx)$/i.test(f))

    onProgress?.({ phase: 'extracting-ast', percent: 40 })
    let tsEntries: FileEntry[]
    try {
      tsEntries = this.parseFiles(tsFiles)
    } catch (e) {
      throw new Error(`parseFiles: ${(e as Error).message}`)
    }
    const fileEntryMap = new Map<string, FileEntry>()
    for (const e of tsEntries) {
      fileEntryMap.set(e.path, e)
    }
    const files: FileEntry[] = allFiles.map((fp) => {
      const relPath = path.relative(this.workspaceRoot, fp)
      const existing = fileEntryMap.get(relPath)
      if (existing) return existing
      return this.minimalFileEntry(fp, relPath)
    })

    onProgress?.({ phase: 'extracting-types', percent: 55 })
    let types: TypeEntry[]
    try {
      types = this.extractTypes(tsFiles)
    } catch (e) {
      throw new Error(`extractTypes: ${(e as Error).message}`)
    }

    onProgress?.({ phase: 'extracting-components', percent: 65 })
    let components: ComponentEntry[]
    try {
      components = this.extractComponents(files)
    } catch (e) {
      throw new Error(`extractComponents: ${(e as Error).message}`)
    }

    onProgress?.({ phase: 'building-graph', percent: 75 })
    const graphData = this.buildGraphData(madarResult)

    onProgress?.({ phase: 'indexing-ipc', percent: 85 })
    const ipc = this.extractIpcMessages(allFiles)

    onProgress?.({ phase: 'writing-index', percent: 95 })
    const cacheHashes = this.computeFileHashes(allFiles)

    const index: CodeIndex = {
      version: INDEX_VERSION,
      generatedAt: new Date().toISOString(),
      summary: {
        totalFiles: files.length,
        totalTypes: types.length,
        totalComponents: components.length,
        totalHooks: files.reduce((sum, f) => sum + f.hooks.length, 0),
        totalIpcMessages: ipc.webviewToExtension.length + ipc.extensionToWebview.length,
      },
      files,
      types,
      components,
      ipc,
      graph: graphData,
      cache: { byFile: cacheHashes },
    }

    await this.writeIndex(index)
    onProgress?.({ phase: 'complete', percent: 100 })
    return index
  }

  /**
   * Incrementally sync the semantic embedding index for this workspace.
   * Only re-chunks/re-embeds files whose content hash changed since last run,
   * removes vectors for deleted files, and persists the vector store.
   */
  async syncEmbeddings(
    embedCfg: EmbeddingConfig,
    onProgress?: ProgressCallback,
  ): Promise<{ changed: number; total: number; chunks: number }> {
    const store = new VectorStore(this.workspaceRoot)
    store.load()
    // A model change invalidates every existing vector.
    if (store.getModel() !== embedCfg.model) {
      store.resetModel(embedCfg.model, 0)
    }

    onProgress?.({ phase: 'embedding-scan', percent: 0 })
    const absFiles = this.collectSourceFiles()
    const relHashes = this.computeFileHashes(absFiles)
    const rels = Object.keys(relHashes)

    for (const known of store.knownFiles()) {
      if (!(known in relHashes)) store.removeFile(known)
    }

    const changed = rels.filter((r) => store.fileHash(r) !== relHashes[r])
    let done = 0
    try {
      for (const rel of changed) {
        const abs = path.join(this.workspaceRoot, rel)
        let content = ''
        try {
          content = fs.readFileSync(abs, 'utf-8')
        } catch {
          store.removeFile(rel)
          done++
          continue
        }

        const chunks = chunkFile(rel, content)
        if (chunks.length === 0) {
          // Record the hash so we don't re-attempt an unchunkable file every run.
          store.upsertFile(rel, relHashes[rel], [])
        } else {
          const vectors = await embedTexts(chunks.map((c) => c.text), embedCfg)
          const entries = chunks
            .map((c, i) => ({
              meta: {
                id: c.id,
                file: c.file,
                startLine: c.startLine,
                endLine: c.endLine,
                symbol: c.symbol,
                kind: c.kind,
              },
              vector: vectors[i] ?? [],
            }))
            .filter((e) => e.vector.length > 0)
          store.upsertFile(rel, relHashes[rel], entries)
        }

        done++
        onProgress?.({
          phase: 'embedding',
          percent: changed.length ? Math.round((done / changed.length) * 100) : 100,
        })
      }
    } catch (err) {
      // Persist partial progress so a later run resumes instead of restarting.
      store.save()
      throw err
    }

    store.save()
    onProgress?.({ phase: 'embedding-complete', percent: 100 })
    return { changed: changed.length, total: rels.length, chunks: store.chunkCount() }
  }

  async loadIndex(): Promise<CodeIndex | null> {
    for (const indexPath of [this.indexFilePath(), this.legacyIndexFilePath()]) {
      if (!fs.existsSync(indexPath)) continue
      try {
        const raw = fs.readFileSync(indexPath, 'utf-8')
        return JSON.parse(raw) as CodeIndex
      } catch {
        /* try next */
      }
    }
    return null
  }

  private indexFilePath(): string {
    return path.join(this.workspaceRoot, STATE_DIR, 'code-index.json')
  }

  private cacheFilePath(): string {
    return path.join(this.workspaceRoot, STATE_DIR, 'code-index-cache.json')
  }

  private legacyIndexFilePath(): string {
    return path.join(this.workspaceRoot, LEGACY_STATE_DIR, 'code-index.json')
  }

  private async writeIndex(index: CodeIndex): Promise<void> {
    const dir = path.join(this.workspaceRoot, STATE_DIR)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(this.indexFilePath(), JSON.stringify(index, null, 2), 'utf-8')
    fs.writeFileSync(
      this.cacheFilePath(),
      JSON.stringify(index.cache, null, 2),
      'utf-8',
    )
  }

  private async runMadar(onProgress?: ProgressCallback): Promise<{ graphPath: string } | null> {
    const scriptPath = path.resolve(__dirname, '..', 'scripts', 'madar-runner.mjs')
    if (!fs.existsSync(scriptPath)) return null

    return new Promise((resolve) => {
      const child = spawn(process.execPath, [scriptPath, this.workspaceRoot], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: MADAR_TIMEOUT,
      })

      let stdout = ''
      let settled = false

      child.stdout.on('data', (chunk) => {
        stdout += chunk
      })

      child.stderr.on('data', (chunk) => {
        const lines = chunk.toString().split('\n')
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const p = JSON.parse(line.trim())
            if (p.step) {
              onProgress?.({ phase: p.step, percent: Math.min((p.current ?? 0) / (p.total ?? 1) * 15 + 2, 18) })
            }
          } catch { /* skip non-json stderr */ }
        }
      })

      const finish = (result: { graphPath: string } | null) => {
        if (settled) return
        settled = true
        resolve(result)
      }

      child.on('close', (code) => {
        if (code === 0) {
          try {
            const parsed = JSON.parse(stdout.trim())
            finish(parsed.success ? { graphPath: parsed.graphPath } : null)
          } catch {
            finish(null)
          }
        } else {
          finish(null)
        }
      })

      child.on('error', () => finish(null))
    })
  }

  private collectSourceFiles(): string[] {
    const ignoreDirs = new Set([
      'node_modules',
      'dist',
      'out',
      '.git',
      STATE_DIR,
      LEGACY_STATE_DIR,
      'graphify-out',
      '.vscode',
    ])
    const results: string[] = []

    const walk = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
          if (ignoreDirs.has(entry.name)) continue
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            walk(fullPath)
          } else if (entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name))) {
            results.push(fullPath)
          }
        }
      } catch { /* skip unreadable */ }
    }

    walk(this.workspaceRoot)
    return results
  }

  private minimalFileEntry(absPath: string, relPath: string): FileEntry {
    let kind: FileEntry['kind'] = 'other'
    const ext = path.extname(absPath)
    if (['.json', '.yaml', '.yml', '.toml'].includes(ext)) kind = 'config'
    if (['.js', '.mjs', '.cjs'].includes(ext)) kind = 'typescript-module'
    if (relPath.startsWith('src/') && (ext === '.js' || ext === '.jsx')) kind = 'typescript-module'

    let loc = 0
    try {
      const content = fs.readFileSync(absPath, 'utf-8')
      loc = content.split('\n').length
    } catch { /* ignore */ }

    return {
      path: relPath,
      kind,
      exports: [],
      imports: [],
      components: [],
      hooks: [],
      hasJsdoc: false,
      loc,
    }
  }

  private parseFiles(filePaths: string[]): FileEntry[] {
    if (filePaths.length === 0) return []
    const program = this.createTsProgram(filePaths)
    const files: FileEntry[] = []

    for (const filePath of filePaths) {
      const sourceFile = program.getSourceFile(filePath)
      if (!sourceFile) continue

      const relativePath = path.relative(this.workspaceRoot, filePath)
      const exports: string[] = []
      const imports: { source: string; names: string[] }[] = []
      const components: { name: string; propsInterface: string | null }[] = []
      const hooks: string[] = []
      let hasJsdoc = false
      let loc = 0

      try {
      ts.forEachChild(sourceFile, (node) => {
        try {
        if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
          const source = (node.moduleSpecifier as ts.StringLiteral).text
          const names: string[] = []
          if (node.importClause) {
            if (node.importClause.name) names.push(node.importClause.name.text)
            if (node.importClause.namedBindings) {
              if (ts.isNamedImports(node.importClause.namedBindings)) {
                for (const spec of node.importClause.namedBindings.elements) {
                  names.push(spec.name.text)
                }
              }
            }
          }
          imports.push({ source, names })
        }

        if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
          for (const spec of node.exportClause.elements) {
            exports.push(spec.name.text)
          }
        }

        if (ts.isFunctionDeclaration(node) && node.name) {
          let name: string
          try { name = node.name.text } catch (e) { throw new Error(`${relativePath}/funcName: ${(e as Error).message}`) }
          if (name.startsWith('use')) hooks.push(name)
          if (node.jsDoc?.length) hasJsdoc = true
          let isReact = false
          try { isReact = isReactComponent(node) } catch (e) { throw new Error(`${relativePath}/isReactCheck: ${(e as Error).message}`) }
          if (isReact) {
            let propsInterface: string | null = null
            try { propsInterface = extractPropsInterface(node, sourceFile) } catch (e) { throw new Error(`${relativePath}/extractProps: ${(e as Error).message}`) }
            components.push({ name, propsInterface })
          }
        }

        if (ts.isVariableStatement(node)) {
          for (const decl of node.declarationList.declarations) {
            if (ts.isIdentifier(decl.name)) {
              const name = decl.name.text
              if (name.startsWith('use')) hooks.push(name)
              if (decl.initializer && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) {
                if (isReactComponentFromReturn(decl.initializer)) {
                  components.push({ name, propsInterface: null })
                }
              }
            }
          }
        }
        } catch (e) {
          throw new Error(`${relativePath} nodeKind=${ts.SyntaxKind[node.kind]}: ${(e as Error).message}`)
        }
      })
      } catch (e) {
        throw new Error(`parseFiles: ${(e as Error).message}`)
      }

      loc = sourceFile.getLineAndCharacterOfPosition(sourceFile.getEnd()).line + 1

      const kind = this.classifyFile(relativePath, components, hooks)

      files.push({
        path: relativePath,
        kind,
        exports,
        imports,
        components,
        hooks,
        hasJsdoc,
        loc,
      })
    }

    return files
  }

  private classifyFile(
    relativePath: string,
    components: { name: string }[],
    hooks: string[],
  ): FileEntry['kind'] {
    if (components.length > 0) return 'react-component'
    if (hooks.length > 0) return 'react-hook'
    if (relativePath.startsWith('extension')) return 'extension-module'
    if (relativePath.startsWith('src/')) return 'typescript-module'
    if (relativePath === 'vite.config.ts' || relativePath === 'eslint.config.js') return 'config'
    return 'other'
  }

  private createTsProgram(filePaths: string[]): ts.Program {
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      noEmit: true,
      skipLibCheck: true,
    }
    return ts.createProgram(filePaths, compilerOptions)
  }

  private extractTypes(filePaths: string[]): TypeEntry[] {
    if (filePaths.length === 0) return []
    const program = this.createTsProgram(filePaths)
    const types: TypeEntry[] = []
    const seen = new Set<string>()

    for (const filePath of filePaths) {
      const sourceFile = program.getSourceFile(filePath)
      if (!sourceFile) continue

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isInterfaceDeclaration(node) && node.name) {
          const key = `${node.name.text}:${filePath}`
          if (seen.has(key)) return
          seen.add(key)
          types.push({
            name: node.name.text,
            source: path.relative(this.workspaceRoot, filePath),
            kind: 'interface',
            properties: node.members
              .filter(ts.isPropertySignature)
              .map((m) => ({
                name: (m.name as ts.Identifier)?.text ?? 'unknown',
                type: m.type ? sourceFile.text.substring(m.type.pos, m.type.end) : 'unknown',
                optional: !!m.questionToken,
              })),
          })
        }

        if (ts.isTypeAliasDeclaration(node) && node.name) {
          const key = `${node.name.text}:${filePath}`
          if (seen.has(key)) return
          seen.add(key)
          types.push({
            name: node.name.text,
            source: path.relative(this.workspaceRoot, filePath),
            kind: 'type',
            properties: node.type && ts.isTypeLiteralNode(node.type)
              ? node.type.members
                  .filter(ts.isPropertySignature)
                  .map((m) => ({
                    name: (m.name as ts.Identifier)?.text ?? 'unknown',
                    type: m.type ? sourceFile.text.substring(m.type.pos, m.type.end) : 'unknown',
                    optional: !!m.questionToken,
                  }))
              : [],
          })
        }

        if (ts.isEnumDeclaration(node) && node.name) {
          const key = `${node.name.text}:${filePath}`
          if (seen.has(key)) return
          seen.add(key)
          types.push({
            name: node.name.text,
            source: path.relative(this.workspaceRoot, filePath),
            kind: 'enum',
            properties: node.members.map((m) => ({
              name: (m.name as ts.Identifier)?.text ?? 'unknown',
              type: m.initializer ? sourceFile.text.substring(m.initializer.pos, m.initializer.end) : 'number',
              optional: false,
            })),
          })
        }
      })
    }

    return types
  }

  private extractComponents(
    files: FileEntry[],
  ): ComponentEntry[] {
    const importMap = this.buildImportMap(files)
    const components: ComponentEntry[] = []

    for (const file of files) {
      for (const comp of file.components) {
        const parentComponents = this.findParentComponents(file, importMap, files)
        const childComponents = this.findChildComponents(file, files)

        components.push({
          name: comp.name,
          file: file.path,
          propsInterface: comp.propsInterface,
          parentComponents,
          childComponents,
        })
      }
    }

    return components
  }

  private buildImportMap(files: FileEntry[]): Map<string, string> {
    const map = new Map<string, string>()
    for (const file of files) {
      const basename = path.basename(file.path, path.extname(file.path))
      map.set(basename, file.path)
      for (const exp of file.exports) {
        map.set(exp, file.path)
      }
    }
    return map
  }

  private findParentComponents(
    file: FileEntry,
    importMap: Map<string, string>,
    allFiles: FileEntry[],
  ): string[] {
    const parents: string[] = []
    for (const imp of file.imports) {
      for (const name of imp.names) {
        const sourceFile = importMap.get(name)
        if (sourceFile) {
          const src = allFiles.find((f) => f.path === sourceFile)
          if (src) {
            for (const c of src.components) parents.push(c.name)
          }
        }
      }
    }
    return [...new Set(parents)]
  }

  private findChildComponents(file: FileEntry, allFiles: FileEntry[]): string[] {
    const children: string[] = []
    for (const other of allFiles) {
      if (other.path === file.path) continue
      for (const imp of other.imports) {
        for (const name of imp.names) {
          if (file.exports.includes(name) || name === path.basename(file.path, path.extname(file.path))) {
            for (const c of other.components) children.push(c.name)
          }
        }
      }
    }
    return [...new Set(children)]
  }

  private extractIpcMessages(sourceFiles: string[]): CodeIndex['ipc'] {
    const webviewToExtension: IpcMessageEntry[] = []
    const extensionToWebview: IpcMessageEntry[] = []

    const protocolFile = sourceFiles.find(
      (f) => f.endsWith('extension/protocol.ts'),
    )
    if (!protocolFile) {
      return { webviewToExtension, extensionToWebview }
    }

    const raw = fs.readFileSync(protocolFile, 'utf-8')

    const w2eMatch = raw.match(/WebviewToExtensionMessage[\s\S]*?(?=^export|$)/m)
    if (w2eMatch) {
      const typeMatches = w2eMatch[0].matchAll(/\|\s*\{\s*type:\s*'([^']+)'/g)
      for (const m of typeMatches) {
        webviewToExtension.push({ type: m[1], payload: 'unknown' })
      }
    }

    const e2wMatch = raw.match(/ExtensionToWebviewMessage[\s\S]*?(?=^export|$)/m)
    if (e2wMatch) {
      const typeMatches = e2wMatch[0].matchAll(/\|\s*\{\s*type:\s*'([^']+)'/g)
      for (const m of typeMatches) {
        extensionToWebview.push({ type: m[1], payload: 'unknown' })
      }
    }

    return { webviewToExtension, extensionToWebview }
  }

  private buildGraphData(madarResult: { graphPath: string } | null): CodeIndex['graph'] {
    if (madarResult && fs.existsSync(madarResult.graphPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(madarResult.graphPath, 'utf-8'))
        const communities: CommunityEntry[] = []

        if (raw.community_labels) {
          const communityNodeCounts = new Map<string, number>()
          if (Array.isArray(raw.nodes)) {
            for (const node of raw.nodes) {
              const cid = String(node.community ?? -1)
              communityNodeCounts.set(cid, (communityNodeCounts.get(cid) || 0) + 1)
            }
          }

          for (const [id, label] of Object.entries(raw.community_labels)) {
            communities.push({
              id: Number(id),
              name: label as string,
              cohesion: 0,
              nodeCount: communityNodeCounts.get(id) || 0,
            })
          }
        }

        return {
          nodes: Array.isArray(raw.nodes) ? raw.nodes.length : 0,
          edges: Array.isArray(raw.links) ? raw.links.length : 0,
          communities,
        }
      } catch { /* fall through to fallback */ }
    }

    return null
  }

  private computeFileHashes(filePaths: string[]): Record<string, string> {
    const hashes: Record<string, string> = {}
    for (const fp of filePaths) {
      try {
        const content = fs.readFileSync(fp)
        hashes[path.relative(this.workspaceRoot, fp)] = crypto
          .createHash('sha256')
          .update(content)
          .digest('hex')
          .slice(0, 16)
      } catch { /* skip */ }
    }
    return hashes
  }
}

function isReactComponent(node: ts.FunctionDeclaration): boolean {
  if (!node.name) return false
  const name = node.name.text
  if (!/^[A-Z]/.test(name)) return false
  return hasJsxReturn(node)
}

function isReactComponentFromReturn(node: ts.ArrowFunction | ts.FunctionExpression): boolean {
  return hasJsxReturn(node)
  function hasJsxReturn(n: ts.FunctionLikeDeclaration): boolean {
    const body = n.body
    if (!body) return false
    if (ts.isJsxElement(body) || ts.isJsxFragment(body) || ts.isJsxSelfClosingElement(body)) return true
    if (ts.isBlock(body)) {
      return body.statements.some((stmt) => {
        if (ts.isReturnStatement(stmt) && stmt.expression) {
          return (
            ts.isJsxElement(stmt.expression) ||
            ts.isJsxFragment(stmt.expression) ||
            ts.isJsxSelfClosingElement(stmt.expression)
          )
        }
        return false
      })
    }
    return false
  }
}

function hasJsxReturn(node: ts.FunctionDeclaration): boolean {
  const body = node.body
  if (!body) return false
  return body.statements.some((stmt) => {
    if (ts.isReturnStatement(stmt) && stmt.expression) {
      return (
        ts.isJsxElement(stmt.expression) ||
        ts.isJsxFragment(stmt.expression) ||
        ts.isJsxSelfClosingElement(stmt.expression)
      )
    }
    return false
  })
}

function extractPropsInterface(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile): string | null {
  if (!node.parameters || node.parameters.length === 0) return null
  const firstParam = node.parameters[0]
  if (firstParam.type) {
    const typeText = sourceFile.text.substring(firstParam.type.pos, firstParam.type.end)
    return typeText || null
  }
  return null
}
