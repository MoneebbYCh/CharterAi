import type { SeedSpec, SectionSpec } from '../../data/types/templateManifest'
import type { MarketplaceCategory } from '../../data/templates/types'

export type BuilderSeedKind =
  | 'none'
  | 'paragraph'
  | 'bulletList'
  | 'table'
  | 'diagram'
  | 'codeBlock'

export type BuilderCategory = Exclude<MarketplaceCategory, 'All' | 'Saved'>

export interface BuilderSectionDraft {
  localId: string
  heading: string
  headingLevel: 2 | 3
  guidanceText: string
  repeatable: boolean
  seedKind: BuilderSeedKind
  seed: SeedSpec | null
  additionalSeeds: SeedSpec[]
}

export interface BuilderMetaDraft {
  name: string
  description: string
  icon: string
  suggestedDocName: string
  category: BuilderCategory
}

export const BUILDER_CATEGORIES: BuilderCategory[] = [
  'Docs',
  'Product',
  'Architecture',
  'Engineering',
]

export const BUILDER_ICONS = [
  'edit_note',
  'description',
  'article',
  'architecture',
  'account_tree',
  'list_alt',
  'table_chart',
  'speed',
  'gavel',
  'menu_book',
] as const

export const SEED_KIND_OPTIONS: Array<{ value: BuilderSeedKind; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'bulletList', label: 'Bullet list' },
  { value: 'table', label: 'Table' },
  { value: 'diagram', label: 'Diagram' },
  { value: 'codeBlock', label: 'Code block' },
]

const DEFAULT_DIAGRAM = `graph TD
  A[Start] --> B[Decision]
  B -->|Yes| C[Done]
  B -->|No| A`

export function newLocalId(): string {
  return `sec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function defaultSeedForKind(kind: BuilderSeedKind): SeedSpec | null {
  switch (kind) {
    case 'none':
      return null
    case 'paragraph':
      return { kind: 'paragraph', content: '' }
    case 'bulletList':
      return { kind: 'bulletList', content: ['', ''] }
    case 'table':
      return {
        kind: 'table',
        content: { header: ['Column 1', 'Column 2'], rows: [['', '']] },
      }
    case 'diagram':
      return { kind: 'diagram', content: { code: DEFAULT_DIAGRAM, title: '' } }
    case 'codeBlock':
      return { kind: 'codeBlock', content: { language: 'text', code: '' } }
  }
}

export function seedKindFromSpec(seed: SeedSpec | undefined): BuilderSeedKind {
  if (!seed || seed.kind === 'placeholder') return 'none'
  return seed.kind
}

export function emptySectionDraft(orderHint = 0): BuilderSectionDraft {
  return {
    localId: newLocalId(),
    heading: orderHint === 0 ? 'Introduction' : `Section ${orderHint + 1}`,
    headingLevel: 2,
    guidanceText: '',
    repeatable: false,
    seedKind: 'none',
    seed: null,
    additionalSeeds: [],
  }
}

export function sectionDraftToSpec(draft: BuilderSectionDraft, order: number): SectionSpec {
  const guidance = draft.guidanceText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const id = draft.localId.replace(/^sec-/, 'section-')
  const seeds = [...(draft.seed ? [draft.seed] : []), ...draft.additionalSeeds]
  return {
    id,
    heading: draft.heading.trim() || `Section ${order}`,
    headingLevel: draft.headingLevel,
    order,
    guidance,
    repeatable: draft.repeatable || undefined,
    seed: seeds.length > 0 ? seeds : undefined,
  }
}

export function sectionSpecToDraft(section: SectionSpec): BuilderSectionDraft {
  const all = section.seed ?? []
  const first = all[0]
  const kind = seedKindFromSpec(first)
  return {
    localId: section.id.startsWith('sec-') ? section.id : `sec-${section.id}`,
    heading: section.heading,
    headingLevel: section.headingLevel,
    guidanceText: (section.guidance ?? []).join('\n'),
    repeatable: Boolean(section.repeatable),
    seedKind: kind,
    seed: kind === 'none' ? null : (first ?? defaultSeedForKind(kind)),
    additionalSeeds: all.slice(1),
  }
}
