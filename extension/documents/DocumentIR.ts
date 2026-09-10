import { z } from 'zod'

/**
 * Deterministic document intermediate representation (plan §11). The model
 * never produces BlockNote internals directly — it emits this validated IR
 * and `DocumentRenderer` converts it to a complete CanvasDocument snapshot.
 * Every checkpoint is a FULL valid document, never a partial JSON fragment.
 *
 * Canvas-facing IR is intentionally slim: prose (markdown / paragraph / lists),
 * tables, and Mermaid. KPI/risk/stakeholder/callout widgets are not IR types —
 * the agent should express those as Markdown tables or blockquotes.
 */

export type IRBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'numbered'; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] }
  /** Prose from the model as CommonMark/GFM; expanded to canvas blocks at render time. */
  | { type: 'markdown'; source: string }
  | { type: 'mermaid'; diagram: string; title?: string }

export interface DocumentSection {
  heading: string
  blocks: IRBlock[]
}

export interface DocumentIR {
  title: string
  sections: DocumentSection[]
}

const textBlock = z.object({ type: z.literal('paragraph'), text: z.string().max(8_000) })
const bulletsBlock = z.object({
  type: z.literal('bullets'),
  items: z.array(z.string().max(1_000)).max(40),
})
const numberedBlock = z.object({
  type: z.literal('numbered'),
  items: z.array(z.string().max(1_000)).max(40),
})
const tableBlock = z.object({
  type: z.literal('table'),
  header: z.array(z.string().max(200)).max(8),
  rows: z.array(z.array(z.string().max(500)).max(8)).max(40),
})
const markdownBlock = z.object({
  type: z.literal('markdown'),
  source: z.string().min(1).max(12_000),
})
const mermaidBlock = z.object({
  type: z.literal('mermaid'),
  diagram: z.string().max(10_000),
  title: z.string().max(200).optional(),
})

export const irBlockSchema = z.discriminatedUnion('type', [
  textBlock,
  bulletsBlock,
  numberedBlock,
  tableBlock,
  markdownBlock,
  mermaidBlock,
])

export const documentSectionSchema = z.object({
  heading: z.string().min(1).max(300),
  blocks: z.array(irBlockSchema).max(60),
})

export const documentIrSchema = z.object({
  title: z.string().min(1).max(300),
  sections: z.array(documentSectionSchema).max(40),
})
