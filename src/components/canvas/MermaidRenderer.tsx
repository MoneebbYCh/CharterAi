import { useEffect, useId, useState } from 'react'
import { sanitizeMermaidLabels } from '../../../shared/mermaidSanitize'

type MermaidApi = typeof import('mermaid').default

let mermaidApi: MermaidApi | null = null
let mermaidReady = false
let mermaidLoad: Promise<MermaidApi> | null = null

async function loadMermaid(): Promise<MermaidApi> {
  if (mermaidApi) return mermaidApi
  if (!mermaidLoad) {
    mermaidLoad = import('mermaid').then((mod) => {
      mermaidApi = mod.default
      return mermaidApi
    })
  }
  return mermaidLoad
}

function ensureMermaid(api: MermaidApi) {
  if (mermaidReady) return
  api.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'neutral',
    fontFamily: 'var(--font-body, system-ui, sans-serif)',
  })
  mermaidReady = true
}

/** Keep viewBox; drop fixed px size so CSS can scale the SVG with its box. */
function makeSvgFluid(svgMarkup: string): string {
  if (typeof DOMParser === 'undefined') return svgMarkup
  try {
    const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml')
    const svg = doc.documentElement
    if (!svg || svg.tagName.toLowerCase() !== 'svg') return svgMarkup
    const attrW = Number.parseFloat(svg.getAttribute('width') || '')
    const attrH = Number.parseFloat(svg.getAttribute('height') || '')
    if (!svg.getAttribute('viewBox') && Number.isFinite(attrW) && Number.isFinite(attrH)) {
      svg.setAttribute('viewBox', `0 0 ${attrW} ${attrH}`)
    }
    svg.removeAttribute('width')
    svg.removeAttribute('height')
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    return new XMLSerializer().serializeToString(svg)
  } catch {
    return svgMarkup
  }
}

export type MermaidFit = 'width' | 'readable' | 'contain'

interface MermaidRendererProps {
  code: string
  className?: string
  /**
   * `width` — classic max-width 100%.
   * `readable` — fluid width.
   * `contain` — fill parent box (grows/shrinks with resize frame).
   */
  fit?: MermaidFit
}

/** Renders Mermaid source to SVG. Shows parse/render errors inline. */
export function MermaidRenderer({ code, className, fit = 'width' }: MermaidRendererProps) {
  const reactId = useId().replace(/:/g, '')
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const source = sanitizeMermaidLabels((code || '').trim())
      if (!source) {
        setSvg(null)
        setError('Empty diagram')
        return
      }
      try {
        const api = await loadMermaid()
        if (cancelled) return
        ensureMermaid(api)
        await api.parse(source)
        const id = `rg-mermaid-${reactId}-${Date.now()}`
        const { svg: rendered } = await api.render(id, source)
        if (!cancelled) {
          setSvg(fit === 'width' ? rendered : makeSvgFluid(rendered))
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setSvg(null)
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [code, reactId, fit])

  if (error) {
    return (
      <div className={`rg-diagram-error ${className ?? ''}`} role="alert">
        <span className="rg-diagram-error-label">Diagram error</span>
        <pre className="rg-diagram-error-body">{error}</pre>
      </div>
    )
  }

  if (!svg) {
    return <div className={`rg-diagram-loading ${className ?? ''}`}>Rendering diagram…</div>
  }

  const fitClass =
    fit === 'contain'
      ? ' rg-diagram-svg--contain'
      : fit === 'readable'
        ? ' rg-diagram-svg--readable'
        : ''

  return (
    <div
      className={`rg-diagram-svg${fitClass} ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
