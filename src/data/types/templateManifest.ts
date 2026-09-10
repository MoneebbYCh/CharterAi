// ── Core manifest types ──────────────────────────────────────────────
// One TemplateManifest is the single source of truth for a curated
// template: canvas seed (build()), gallery preview, and — later — the
// agent's fixed outline. Nothing else should hand-author blocks.

export type SeedSpec =
  | { kind: 'paragraph'; content: string }
  | { kind: 'placeholder'; content: string }
  | { kind: 'bulletList'; content: string[] }
  | { kind: 'table'; content: { header: string[]; rows: string[][] } }
  | { kind: 'diagram'; content: { code: string; title?: string } }
  | { kind: 'codeBlock'; content: { language: string; code: string } }

export interface SectionSpec {
  id: string
  parentId?: string
  heading: string
  headingLevel: 2 | 3
  order: number
  /** Authoring prompts — also shown as guidance bullets on the canvas. */
  guidance: string[]
  furtherInfoUrl?: string
  /** When true, duplicate this section for each instance you have. */
  repeatable?: boolean
  seed?: SeedSpec[]
}

export interface TemplateManifest {
  id: string
  standard?: string
  standardVersion?: string
  familyId?: string
  sections: SectionSpec[]
}
