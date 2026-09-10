import type { BlockNoteBlock } from '../../types/document'
import type { SectionSpec, SeedSpec, TemplateManifest } from '../types/templateManifest'
import { bullet, code, diagram, h, p, quote, table } from './blocks'
import { isAsciiTableLine, sectionGuidanceLines } from './formatGuidance'

export interface CompileManifestOptions {
  /** Optional H1 title before the first section. */
  title?: string
  /** Extra blocks inserted immediately after the title. */
  preamble?: BlockNoteBlock[]
  /** Prefix top-level (H2) headings with 1., 2., … */
  numberTopLevel?: boolean
}

const LONG_LINE_CHARS = 220

function sortedSections(manifest: TemplateManifest): SectionSpec[] {
  return [...manifest.sections].sort((a, b) => a.order - b.order)
}

function compileGuidanceLine(line: string): BlockNoteBlock[] {
  const text = line.trim()
  if (!text) return []

  if (isAsciiTableLine(text)) {
    return [code('text', text)]
  }
  if (text.length > LONG_LINE_CHARS) {
    return [quote(text)]
  }
  return [bullet(text)]
}

function compileSeed(seed: SeedSpec): BlockNoteBlock[] {
  switch (seed.kind) {
    case 'paragraph':
      return [p(String(seed.content ?? ''))]
    case 'placeholder':
      return []
    case 'bulletList': {
      const items = Array.isArray(seed.content) ? seed.content.map(String) : []
      return items.map((item) => bullet(item))
    }
    case 'table': {
      const raw = seed.content
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
      const header = Array.isArray((raw as { header?: unknown }).header)
        ? (raw as { header: string[] }).header.map(String)
        : []
      const rows = Array.isArray((raw as { rows?: unknown }).rows)
        ? (raw as { rows: string[][] }).rows.map((row) => row.map(String))
        : []
      return header.length > 0 || rows.length > 0 ? [table(header, rows)] : []
    }
    case 'diagram': {
      const raw = seed.content
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
      const diagramCode = String((raw as { code?: unknown }).code ?? '').trim()
      if (!diagramCode) return []
      return [diagram(diagramCode, String((raw as { title?: unknown }).title ?? ''))]
    }
    case 'codeBlock': {
      const raw = seed.content
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
      const source = String((raw as { code?: unknown }).code ?? '')
      if (!source.trim()) return []
      return [code(String((raw as { language?: unknown }).language ?? 'text'), source)]
    }
    default:
      return []
  }
}

function compileSection(section: SectionSpec, topLevelIndex: number, options?: CompileManifestOptions): BlockNoteBlock[] {
  const headingText =
    options?.numberTopLevel && section.headingLevel === 2
      ? `${topLevelIndex}. ${section.heading}`
      : section.heading

  const blocks: BlockNoteBlock[] = [h(section.headingLevel, headingText)]

  for (const line of sectionGuidanceLines(section)) {
    blocks.push(...compileGuidanceLine(line))
  }

  const seeds = section.seed ?? []
  const rendered = seeds.flatMap((seed) => compileSeed(seed))
  if (rendered.length > 0) {
    blocks.push(...rendered)
  }

  blocks.push(p(''))

  return blocks
}

/** Compile a template manifest into BlockNote blocks for the canvas. */
export function compileManifestToBlocks(
  manifest: TemplateManifest,
  options?: CompileManifestOptions,
): BlockNoteBlock[] {
  const blocks: BlockNoteBlock[] = []

  if (options?.title?.trim()) {
    blocks.push(h(1, options.title.trim()))
  }
  if (options?.preamble?.length) {
    blocks.push(...options.preamble)
  }

  let topLevelIndex = 0
  for (const section of sortedSections(manifest)) {
    if (section.headingLevel === 2) topLevelIndex += 1
    blocks.push(...compileSection(section, topLevelIndex, options))
  }

  return blocks.length > 0 ? blocks : [p('')]
}

/** Section headings in manifest order — for outlines and future agent wiring. */
export function manifestOutline(manifest: TemplateManifest): string[] {
  return sortedSections(manifest).map((s) => s.heading)
}

/** Top-level (H2) section headings only. */
export function manifestTopLevelOutline(manifest: TemplateManifest): string[] {
  return sortedSections(manifest)
    .filter((s) => s.headingLevel === 2)
    .map((s) => s.heading)
}

/** Full guidance text for a section — for agent prompts. */
export function sectionGuidanceText(section: SectionSpec): string {
  return sectionGuidanceLines(section).join('\n\n')
}
