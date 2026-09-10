import type { BlockNoteBlock } from '../../types/document'
import type { SeedSpec, SectionSpec } from '../types/templateManifest'

export interface ExtractManifestResult {
  sections: SectionSpec[]
  /** First H1 text, if any — suggested template name. */
  suggestedTitle?: string
  hadHeadings: boolean
}

function blockPlainText(content: unknown): string {
  if (typeof content === 'string') return content.trim()
  if (!Array.isArray(content)) return ''
  return content
    .map((c) => {
      if (typeof c === 'string') return c
      if (c && typeof c === 'object' && 'text' in c) return String((c as { text: unknown }).text)
      return ''
    })
    .join('')
    .trim()
}

function blockType(block: BlockNoteBlock): string {
  return String(block.type || '')
}

function headingLevel(block: BlockNoteBlock): number {
  const props = block.props
  if (props && typeof props === 'object' && 'level' in props) {
    const level = Number((props as { level: unknown }).level)
    if (level === 1 || level === 2 || level === 3) return level
  }
  return 2
}

function propsOf(block: BlockNoteBlock): Record<string, unknown> {
  const props = block.props
  return props && typeof props === 'object' && !Array.isArray(props)
    ? (props as Record<string, unknown>)
    : {}
}

/** Map a known structured canvas block → SeedSpec. Returns null if unsupported / empty. */
export function blockToSeed(block: BlockNoteBlock): SeedSpec | null {
  const type = blockType(block)
  const props = propsOf(block)

  if (type === 'table') {
    const content = block.content
    if (!content || typeof content !== 'object' || Array.isArray(content)) return null
    const rowsRaw = (content as { rows?: unknown }).rows
    if (!Array.isArray(rowsRaw) || rowsRaw.length === 0) return null
    const cellsOf = (row: unknown): string[] => {
      if (!row || typeof row !== 'object') return []
      const cells = (row as { cells?: unknown }).cells
      if (!Array.isArray(cells)) return []
      return cells.map((cell) => {
        if (typeof cell === 'string') return cell
        if (cell && typeof cell === 'object' && 'content' in cell) {
          return blockPlainText((cell as { content: unknown }).content)
        }
        return blockPlainText(cell)
      })
    }
    const header = cellsOf(rowsRaw[0])
    const rows = rowsRaw.slice(1).map(cellsOf)
    if (header.length === 0 && rows.length === 0) return null
    return {
      kind: 'table',
      content: {
        header: header.length > 0 ? header : ['Column'],
        rows: rows.length > 0 ? rows : [header.map(() => '')],
      },
    }
  }

  if (type === 'diagram') {
    const diagramCode = String(props.code ?? '').trim()
    if (!diagramCode) return null
    return {
      kind: 'diagram',
      content: {
        code: diagramCode,
        title: String(props.title ?? ''),
      },
    }
  }

  if (type === 'codeBlock') {
    const source = blockPlainText(block.content)
    if (!source) return null
    return {
      kind: 'codeBlock',
      content: {
        language: String(props.language ?? 'text'),
        code: source,
      },
    }
  }

  return null
}

function isGuidanceBlock(type: string): boolean {
  return type === 'paragraph' || type === 'quote' || type === 'bulletListItem' || type === 'numberedListItem'
}

function flushBulletSeed(bullets: string[]): SeedSpec | null {
  const cleaned = bullets.map((b) => b.trim()).filter(Boolean)
  return cleaned.length > 0 ? { kind: 'bulletList', content: cleaned } : null
}

interface OpenSection {
  heading: string
  headingLevel: 2 | 3
  guidance: string[]
  seeds: SeedSpec[]
  pendingBullets: string[]
}

function closeSection(open: OpenSection, order: number): SectionSpec {
  const bulletSeed = flushBulletSeed(open.pendingBullets)
  const seeds = [...open.seeds]
  if (bulletSeed) seeds.push(bulletSeed)
  return {
    id: `section-${order}-${open.heading
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || order}`,
    heading: open.heading,
    headingLevel: open.headingLevel,
    order,
    guidance: open.guidance,
    seed: seeds.length > 0 ? seeds : undefined,
  }
}

/**
 * Draft a TemplateManifest outline from canvas blocks.
 * Headings → sections; typed structural blocks → seeds; plain text → best-effort guidance.
 * Does not claim byte-for-byte fidelity with the source document.
 */
export function extractManifestFromBlocks(blocks: BlockNoteBlock[]): ExtractManifestResult {
  const sections: SectionSpec[] = []
  let suggestedTitle: string | undefined
  let open: OpenSection | null = null
  let order = 0
  let hadHeadings = false

  for (const block of blocks) {
    const type = blockType(block)
    const text = blockPlainText(block.content)

    if (type === 'heading' && text) {
      hadHeadings = true
      const level = headingLevel(block)
      // First H1 is document title → suggested template name, not a section.
      if (level === 1 && !suggestedTitle) {
        suggestedTitle = text
        continue
      }
      if (open) {
        order += 1
        sections.push(closeSection(open, order))
      }
      open = {
        heading: text,
        headingLevel: level === 3 ? 3 : 2,
        guidance: [],
        seeds: [],
        pendingBullets: [],
      }
      continue
    }

    if (!open) continue

    const seed = blockToSeed(block)
    if (seed) {
      const bulletSeed = flushBulletSeed(open.pendingBullets)
      if (bulletSeed) open.seeds.push(bulletSeed)
      open.pendingBullets = []
      open.seeds.push(seed)
      continue
    }

    if (type === 'bulletListItem' || type === 'numberedListItem') {
      if (text) open.pendingBullets.push(text)
      continue
    }

    if (isGuidanceBlock(type) && text) {
      const bulletSeed = flushBulletSeed(open.pendingBullets)
      if (bulletSeed && bulletSeed.kind === 'bulletList') {
        open.guidance.push(...bulletSeed.content)
        open.pendingBullets = []
      }
      open.guidance.push(text)
    }
    // empty paragraphs ignored — typed blocks already handled above
  }

  if (open) {
    order += 1
    sections.push(closeSection(open, order))
  }

  return { sections, suggestedTitle, hadHeadings }
}
