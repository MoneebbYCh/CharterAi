import type { BlockNoteBlock } from '../../types/document'

export const h = (level: 1 | 2 | 3, text: string): BlockNoteBlock => ({
  type: 'heading',
  props: { level },
  content: text,
})

export const p = (text = ''): BlockNoteBlock => ({
  type: 'paragraph',
  content: text,
})

export const quote = (text: string): BlockNoteBlock => ({
  type: 'quote',
  content: text,
})

export const bullet = (text: string): BlockNoteBlock => ({
  type: 'bulletListItem',
  content: text,
})

export const numbered = (text: string): BlockNoteBlock => ({
  type: 'numberedListItem',
  content: text,
})

/** Prompt / note — plain quote so it stays editable on the canvas. */
export const guide = (body: string): BlockNoteBlock => quote(body)

export const code = (language: string, source: string): BlockNoteBlock => ({
  type: 'codeBlock',
  props: { language },
  content: source,
})

export const table = (header: string[], rows: string[][]): BlockNoteBlock => ({
  type: 'table',
  content: {
    type: 'tableContent',
    rows: [{ cells: header }, ...rows.map((r) => ({ cells: r }))],
  },
})

export const diagram = (code: string, title = ''): BlockNoteBlock => ({
  type: 'diagram',
  props: { code, title, source: 'llm' },
})
