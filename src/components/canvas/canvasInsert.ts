import {
  insertOrUpdateBlockForSlashMenu,
  type BlockNoteEditor,
} from '@blocknote/core'
import type { DefaultReactSuggestionItem } from '@blocknote/react'
import { canvasSchema } from './schema'
import { DEFAULT_DIAGRAM_CODE } from './blocks/Diagram'

export type CanvasEditor = BlockNoteEditor<
  typeof canvasSchema.blockSchema,
  typeof canvasSchema.inlineContentSchema,
  typeof canvasSchema.styleSchema
>

export interface CanvasInsertItem {
  id: string
  title: string
  description: string
  /** Text inserts vs structured blocks (table / diagram). */
  group: 'Blocks' | 'Text'
  aliases?: string[]
  insert: (editor: CanvasEditor) => void
}

function insert(editor: CanvasEditor, block: Record<string, unknown>) {
  insertOrUpdateBlockForSlashMenu(editor as never, block as never)
}

/** Empty BlockNote table — cells are inline-editable on the canvas. */
export function emptyTableBlock(rows: number, cols: number): Record<string, unknown> {
  const r = Math.max(1, Math.min(12, Math.floor(rows)))
  const c = Math.max(1, Math.min(12, Math.floor(cols)))
  return {
    type: 'table',
    content: {
      type: 'tableContent',
      rows: Array.from({ length: r }, () => ({
        cells: Array.from({ length: c }, () => ''),
      })),
    },
  }
}

export function insertTable(editor: CanvasEditor, rows: number, cols: number): void {
  insert(editor, emptyTableBlock(rows, cols))
}

export function insertDiagram(
  editor: CanvasEditor,
  opts: { code: string; title?: string } = { code: DEFAULT_DIAGRAM_CODE },
): void {
  insert(editor, {
    type: 'diagram',
    props: {
      code: opts.code || DEFAULT_DIAGRAM_CODE,
      title: opts.title ?? 'Diagram',
      source: 'llm',
    },
  })
}

/** Shared catalog for slash menu + tools sidebar. */
export const CANVAS_INSERT_ITEMS: CanvasInsertItem[] = [
  {
    id: 'heading-1',
    title: 'Heading 1',
    description: 'Section title',
    group: 'Text',
    aliases: ['h1', 'title'],
    insert: (editor) => insert(editor, { type: 'heading', props: { level: 1 }, content: '' }),
  },
  {
    id: 'heading-2',
    title: 'Heading 2',
    description: 'Subsection',
    group: 'Text',
    aliases: ['h2'],
    insert: (editor) => insert(editor, { type: 'heading', props: { level: 2 }, content: '' }),
  },
  {
    id: 'heading-3',
    title: 'Heading 3',
    description: 'Minor heading',
    group: 'Text',
    aliases: ['h3'],
    insert: (editor) => insert(editor, { type: 'heading', props: { level: 3 }, content: '' }),
  },
  {
    id: 'paragraph',
    title: 'Paragraph',
    description: 'Body text',
    group: 'Text',
    aliases: ['text', 'p'],
    insert: (editor) => insert(editor, { type: 'paragraph', content: '' }),
  },
  {
    id: 'bullet',
    title: 'Bullet list',
    description: 'Unordered list item',
    group: 'Text',
    aliases: ['ul', 'list'],
    insert: (editor) => insert(editor, { type: 'bulletListItem', content: '' }),
  },
  {
    id: 'numbered',
    title: 'Numbered list',
    description: 'Ordered list item',
    group: 'Text',
    aliases: ['ol', 'numbered'],
    insert: (editor) => insert(editor, { type: 'numberedListItem', content: '' }),
  },
  {
    id: 'table',
    title: 'Table',
    description: 'Inline-editable grid',
    group: 'Blocks',
    aliases: ['table', 'grid'],
    insert: (editor) => insertTable(editor, 3, 3),
  },
  {
    id: 'diagram',
    title: 'Mermaid Diagram',
    description: 'Flowchart with Mermaid',
    group: 'Blocks',
    aliases: ['mermaid', 'flowchart', 'graph', 'diagram'],
    insert: (editor) => insertDiagram(editor),
  },
]

export function getCanvasSlashMenuItems(editor: CanvasEditor): DefaultReactSuggestionItem[] {
  return CANVAS_INSERT_ITEMS.filter((item) => item.group === 'Blocks').map((item) => ({
    title: item.title,
    subtext: item.description,
    aliases: item.aliases,
    group: 'Insert',
    onItemClick: () => item.insert(editor),
  }))
}

/** Move the cursor to a block and scroll it into view. */
export function focusCanvasBlock(editor: CanvasEditor, blockId: string): void {
  try {
    editor.setTextCursorPosition(blockId, 'start')
  } catch {
    /* block may not support a text cursor */
  }
  requestAnimationFrame(() => {
    const el =
      document.querySelector(`.bn-canvas-host [data-id="${CSS.escape(blockId)}"]`) ??
      document.querySelector(`[data-id="${CSS.escape(blockId)}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

export function removeCanvasBlockById(editor: CanvasEditor, blockId: string): void {
  const block = editor.document.find((b) => b.id === blockId)
  if (!block) return
  try {
    editor.removeBlocks([block])
  } catch (err) {
    console.error('[canvasInsert] removeBlocks failed', err)
  }
}
