import mermaid from 'mermaid'

let initialized = false

function ensureInit() {
  if (initialized) return
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' })
  initialized = true
}

/** Parse-only check — throws (or returns error string) without rendering. */
export async function parseMermaid(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const source = (code || '').trim()
  if (!source) return { ok: false, error: 'Empty Mermaid source' }
  try {
    ensureInit()
    await mermaid.parse(source)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
