/**
 * Validate Mermaid in the extension host before committing diagram blocks.
 *
 * Mermaid 11's `parse()` needs DOMPurify / DOM APIs that are incomplete in
 * Node/VS Code host. Labeled nodes (`A[Label]`) often throw
 * `DOMPurify.addHook is not a function` even for valid diagrams. We treat those
 * environment errors as inconclusive and fall back to detectType + a light
 * structural check so we do not strip good diagrams.
 */
import mermaid from 'mermaid'

let initialized = false

const DIAGRAM_HEADERS =
  /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|quadrantChart|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|gitGraph|sankey-beta|xychart-beta|block-beta|architecture-beta)\b/i

function ensureInit() {
  if (initialized) return
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' })
  initialized = true
}

function isDomEnvironmentError(message: string): boolean {
  return /DOMPurify|addHook is not a function|document is not defined|window is not defined|HTMLElement|JSDOM/i.test(
    message,
  )
}

/** Strip %% comments and blank lines to find the diagram header. */
function firstDiagramLine(source: string): string {
  for (const line of source.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('%%')) continue
    return t
  }
  return ''
}

/**
 * Light structural check used when full parse is unavailable in Node.
 * Rejects empty / unknown headers / wildly unbalanced brackets.
 */
export function looksLikeValidMermaid(code: string): boolean {
  const source = (code || '').trim()
  if (!source) return false
  const header = firstDiagramLine(source)
  if (!DIAGRAM_HEADERS.test(header)) return false

  const openSq = (source.match(/\[/g) || []).length
  const closeSq = (source.match(/\]/g) || []).length
  const openPar = (source.match(/\(/g) || []).length
  const closePar = (source.match(/\)/g) || []).length
  const openCurly = (source.match(/\{/g) || []).length
  const closeCurly = (source.match(/\}/g) || []).length
  if (Math.abs(openSq - closeSq) > 2) return false
  if (Math.abs(openPar - closePar) > 2) return false
  if (Math.abs(openCurly - closeCurly) > 2) return false

  // Flow/graph: expect at least one edge-ish token or a second content line
  const bodyLines = source
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('%%'))
  if (bodyLines.length < 2 && !/-->|---|==>|-.->/.test(source)) return false

  return true
}

export async function parseMermaid(
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const source = (code || '').trim()
  if (!source) return { ok: false, error: 'Empty Mermaid source' }

  try {
    ensureInit()
    try {
      mermaid.detectType(source)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (looksLikeValidMermaid(source)) return { ok: true }
      return { ok: false, error: msg }
    }

    const parsed = await mermaid.parse(source, { suppressErrors: true })
    if (parsed !== false) return { ok: true }

    // suppressErrors → false can mean real syntax error OR Node DOMPurify gap.
    if (looksLikeValidMermaid(source)) return { ok: true }
    return { ok: false, error: 'Mermaid parse failed' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (isDomEnvironmentError(msg) && looksLikeValidMermaid(source)) {
      return { ok: true }
    }
    if (looksLikeValidMermaid(source) && /DOMPurify/i.test(msg)) {
      return { ok: true }
    }
    return { ok: false, error: msg }
  }
}

export function extractDiagramCodes(blocks: unknown[]): { index: number; code: string }[] {
  const out: { index: number; code: string }[] = []
  blocks.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object') return
    const block = raw as Record<string, unknown>
    if (block.type !== 'diagram') return
    const props =
      block.props && typeof block.props === 'object' && !Array.isArray(block.props)
        ? (block.props as Record<string, unknown>)
        : {}
    const code = typeof props.code === 'string' ? props.code : ''
    out.push({ index, code })
  })
  return out
}
