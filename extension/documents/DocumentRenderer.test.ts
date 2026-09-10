import type { DocumentIR } from './DocumentIR'
import { renderDocument } from './DocumentRenderer'
import { describe, expect, it } from 'vitest'
import { documentIrSchema } from './DocumentIR'

const ir = (sections: DocumentIR['sections']): DocumentIR => ({ title: 'Test Doc', sections })

describe('DocumentRenderer', () => {
  it('renders title + section headings + paragraphs', () => {
    const canvas = renderDocument(
      ir([{ heading: 'Overview', blocks: [{ type: 'paragraph', text: 'Hello world.' }] }]),
    )
    expect(canvas.kind).toBe('blocknote')
    expect(canvas.blocks).toEqual([
      { type: 'heading', props: { level: 1 }, content: 'Test Doc' },
      { type: 'heading', props: { level: 2 }, content: 'Overview' },
      { type: 'paragraph', content: 'Hello world.' },
    ])
  })

  it('renders lists as bulletListItem/numberedListItem blocks', () => {
    const canvas = renderDocument(
      ir([
        {
          heading: 'Lists',
          blocks: [
            { type: 'bullets', items: ['a', 'b'] },
            { type: 'numbered', items: ['1', '2'] },
          ],
        },
      ]),
    )
    const types = canvas.blocks.map((b) => b.type)
    expect(types).toContain('bulletListItem')
    expect(types).toContain('numberedListItem')
    expect(canvas.blocks.filter((b) => b.type === 'bulletListItem')).toHaveLength(2)
  })

  it('renders widgets as quote, bullets, table, or diagram', () => {
    const canvas = renderDocument(
      ir([
        {
          heading: 'Risks',
          blocks: [
            {
              type: 'risk',
              rows: [{ risk: 'Late deps', likelihood: 'M', impact: 'H', mitigation: 'buffer' }],
            },
            { type: 'scope', inScope: ['a'], outOfScope: ['b'] },
            { type: 'mermaid', diagram: 'flowchart TD\n  A --> B', title: 'Flow' },
            { type: 'callout', text: 'Note', variant: 'warn', title: 'Heads up' },
          ],
        },
      ]),
    )
    expect(canvas.blocks).toContainEqual({
      type: 'table',
      content: {
        type: 'tableContent',
        rows: [
          { cells: ['Risk', 'Likelihood', 'Impact', 'Mitigation'] },
          { cells: ['Late deps', 'M', 'H', 'buffer'] },
        ],
      },
    })
    expect(canvas.blocks).toContainEqual({ type: 'paragraph', content: '**In scope**' })
    expect(canvas.blocks).toContainEqual({ type: 'bulletListItem', content: 'a' })
    expect(canvas.blocks).toContainEqual({ type: 'paragraph', content: '**Out of scope**' })
    expect(canvas.blocks).toContainEqual({ type: 'bulletListItem', content: 'b' })
    expect(canvas.blocks).toContainEqual({
      type: 'diagram',
      props: { code: 'flowchart TD\n  A --> B', title: 'Flow', source: 'llm' },
    })
    expect(canvas.blocks).toContainEqual({
      type: 'quote',
      content: '**Heads up:** Note',
    })
  })

  it('renders kpiGrid and stakeholderTable as native tables', () => {
    const canvas = renderDocument(
      ir([
        {
          heading: 'Plan',
          blocks: [
            {
              type: 'kpiGrid',
              items: [{ metric: 'Uptime', target: '99.9%', method: 'SLA dashboards' }],
            },
            {
              type: 'stakeholderTable',
              rows: [{ nameRole: 'Eng lead', interest: 'H', influence: 'M', concern: 'scope creep' }],
            },
          ],
        },
      ]),
    )
    expect(canvas.blocks).toContainEqual({
      type: 'table',
      content: {
        type: 'tableContent',
        rows: [
          { cells: ['Metric', 'Target', 'Method'] },
          { cells: ['Uptime', '99.9%', 'SLA dashboards'] },
        ],
      },
    })
    expect(canvas.blocks).toContainEqual({
      type: 'table',
      content: {
        type: 'tableContent',
        rows: [
          { cells: ['Name / Role', 'Interest', 'Influence', 'Concern'] },
          { cells: ['Eng lead', 'H', 'M', 'scope creep'] },
        ],
      },
    })
  })

  it('renders markdown IR through remark into lists and paragraphs', () => {
    const canvas = renderDocument(
      ir([
        {
          heading: 'Setup',
          blocks: [
            {
              type: 'markdown',
              source: 'Configure first.\n\n- Copy env\n- Set URL\n\n## Subheading\n\nMore prose.',
            },
          ],
        },
      ]),
    )
    expect(canvas.blocks[0]).toEqual({ type: 'heading', props: { level: 1 }, content: 'Test Doc' })
    expect(canvas.blocks[1]).toEqual({ type: 'heading', props: { level: 2 }, content: 'Setup' })
    expect(canvas.blocks[2]).toMatchObject({ type: 'paragraph' })
    expect(canvas.blocks.filter((b) => b.type === 'bulletListItem')).toHaveLength(2)
    const headings = canvas.blocks.filter((b) => b.type === 'heading')
    expect(headings.some((h) => (h.props as { level?: number }).level === 3)).toBe(true)
    expect(headings.every((h) => (h.props as { level?: number }).level !== 2 || h.content === 'Setup')).toBe(true)
  })

  it('renders legacy table IR as native tableContent', () => {
    const canvas = renderDocument(
      ir([
        {
          heading: 'Matrix',
          blocks: [{ type: 'table', header: ['A', 'B'], rows: [['1', '2']] }],
        },
      ]),
    )
    expect(canvas.blocks).toContainEqual({
      type: 'table',
      content: {
        type: 'tableContent',
        rows: [{ cells: ['A', 'B'] }, { cells: ['1', '2'] }],
      },
    })
  })

  it('renders empty documents as a single empty paragraph (always a valid canvas)', () => {
    const canvas = renderDocument({ title: '', sections: [] })
    expect(canvas.blocks).toEqual([{ type: 'paragraph', content: '' }])
  })

  it('schema accepts a full IR and rejects invalid block types', () => {
    expect(documentIrSchema.parse(ir([{ heading: 'x', blocks: [{ type: 'bullets', items: [] }] }]))).toBeTruthy()
    expect(() =>
      documentIrSchema.parse({
        title: 'x',
        sections: [{ heading: 'x', blocks: [{ type: 'rm -rf', text: '' }] }],
      }),
    ).toThrow()
  })
})
