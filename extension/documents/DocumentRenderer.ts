import type { DocumentIR, DocumentSection, IRBlock } from './DocumentIR'
import { markdownToCanvasBlocks } from './mdastToCanvas'

/** Structural mirror of the webview's CanvasDocument (extension tsconfig excludes src/). */
export interface RenderedCanvasDocument {
  version: 1
  kind: 'blocknote'
  blocks: Array<Record<string, unknown>>
  anchors: Record<string, unknown>
}

/**
 * Deterministic DocumentIR → CanvasDocument renderer.
 * IR is markdown / lists / tables / mermaid only → BlockNote defaults + diagram.
 */
export function renderDocument(ir: DocumentIR): RenderedCanvasDocument {
  const blocks: Array<Record<string, unknown>> = []

  if (ir.title.trim()) {
    blocks.push({ type: 'heading', props: { level: 1 }, content: ir.title.trim() })
  }

  for (const section of ir.sections) {
    blocks.push(...renderSection(section))
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'paragraph', content: '' })
  }

  return {
    version: 1,
    kind: 'blocknote',
    blocks,
    anchors: {},
  }
}

function renderSection(section: DocumentSection): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = [
    { type: 'heading', props: { level: 2 }, content: section.heading.trim() },
  ]
  for (const block of section.blocks) blocks.push(...renderBlock(block))
  if (section.blocks.length === 0) blocks.push({ type: 'paragraph', content: '' })
  return blocks
}

function nativeTable(header: string[], rows: string[][]): Array<Record<string, unknown>> {
  return [
    {
      type: 'table',
      content: {
        type: 'tableContent',
        rows: [{ cells: header }, ...rows.map((row) => ({ cells: header.map((_, i) => row[i] ?? '') }))],
      },
    },
  ]
}

function renderBlock(block: IRBlock): Array<Record<string, unknown>> {
  switch (block.type) {
    case 'markdown':
      return markdownToCanvasBlocks(block.source) as Array<Record<string, unknown>>
    case 'paragraph':
      return [{ type: 'paragraph', content: block.text }]
    case 'bullets':
      return block.items.map((item) => ({ type: 'bulletListItem', content: item }))
    case 'numbered':
      return block.items.map((item) => ({ type: 'numberedListItem', content: item }))
    case 'table':
      return nativeTable(block.header, block.rows)
    case 'mermaid':
      return [
        {
          type: 'diagram',
          props: { code: block.diagram.trim(), title: block.title ?? '', source: 'llm' },
        },
      ]
  }
}
