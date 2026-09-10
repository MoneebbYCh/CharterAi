import { describe, expect, it } from 'vitest'
import { extractManifestFromBlocks } from './extractManifestFromBlocks'

describe('extractManifestFromBlocks', () => {
  it('returns no sections when there are no headings', () => {
    const result = extractManifestFromBlocks([
      { type: 'paragraph', content: 'Just prose' },
      {
        type: 'table',
        content: {
          type: 'tableContent',
          rows: [{ cells: ['Metric', 'Target'] }, { cells: ['a', 'b'] }],
        },
      },
    ])
    expect(result.hadHeadings).toBe(false)
    expect(result.sections).toEqual([])
  })

  it('maps headings to sections and H1 to suggested title', () => {
    const result = extractManifestFromBlocks([
      { type: 'heading', props: { level: 1 }, content: 'My Doc' },
      { type: 'heading', props: { level: 2 }, content: 'Goals' },
      { type: 'paragraph', content: 'List the goals' },
      { type: 'heading', props: { level: 3 }, content: 'Details' },
      { type: 'paragraph', content: 'More detail' },
    ])
    expect(result.hadHeadings).toBe(true)
    expect(result.suggestedTitle).toBe('My Doc')
    expect(result.sections).toHaveLength(2)
    expect(result.sections[0]).toMatchObject({
      heading: 'Goals',
      headingLevel: 2,
      guidance: ['List the goals'],
    })
    expect(result.sections[1]).toMatchObject({
      heading: 'Details',
      headingLevel: 3,
      guidance: ['More detail'],
    })
  })

  it('maps tables and diagrams to seeds 1:1', () => {
    const result = extractManifestFromBlocks([
      { type: 'heading', props: { level: 2 }, content: 'Goals' },
      {
        type: 'table',
        content: {
          type: 'tableContent',
          rows: [{ cells: ['Goal', 'Priority'] }, { cells: ['Ship', 'P0'] }],
        },
      },
      { type: 'heading', props: { level: 2 }, content: 'Architecture' },
      {
        type: 'diagram',
        props: { code: 'graph TD\n  A-->B', title: 'Context' },
      },
    ])
    expect(result.sections[0].seed?.[0]).toEqual({
      kind: 'table',
      content: { header: ['Goal', 'Priority'], rows: [['Ship', 'P0']] },
    })
    expect(result.sections[1].seed?.[0]).toEqual({
      kind: 'diagram',
      content: { code: 'graph TD\n  A-->B', title: 'Context' },
    })
  })

  it('turns trailing bullets into a bulletList seed', () => {
    const result = extractManifestFromBlocks([
      { type: 'heading', props: { level: 2 }, content: 'Checklist' },
      { type: 'bulletListItem', content: 'One' },
      { type: 'bulletListItem', content: 'Two' },
    ])
    expect(result.sections[0].seed?.[0]).toEqual({
      kind: 'bulletList',
      content: ['One', 'Two'],
    })
  })
})
