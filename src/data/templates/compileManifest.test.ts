import { describe, expect, it } from 'vitest'
import { arc42Manifest } from '../manifests'
import {
  compileManifestToBlocks,
  manifestOutline,
  manifestTopLevelOutline,
  sectionGuidanceText,
} from './compileManifest'
import { expandGuidanceEntry } from './formatGuidance'

describe('expandGuidanceEntry', () => {
  it('splits arc42 Contents/Motivation/Form labels', () => {
    const parts = expandGuidanceEntry(
      'Contents A short summary. Motivation These decisions matter. Form Keep it short.',
    )
    expect(parts.length).toBeGreaterThan(1)
    expect(parts[0]).toMatch(/^Contents/i)
  })

  it('splits inline dash lists', () => {
    const parts = expandGuidanceEntry('These include - goals - features - requirements')
    expect(parts).toEqual(['These include', 'goals', 'features', 'requirements'])
  })
})

describe('compileManifestToBlocks', () => {
  it('renders manifest guidance as bullets and quotes without callouts', () => {
    const blocks = compileManifestToBlocks(arc42Manifest, {
      title: 'Architecture Documentation (arc42)',
      numberTopLevel: true,
    })

    expect(blocks.some((b) => b.type === 'callout')).toBe(false)
    expect(
      blocks.some(
        (b) => b.type === 'paragraph' && String(b.content).includes('<'),
      ),
    ).toBe(false)

    const bullets = blocks.filter((b) => b.type === 'bulletListItem')
    const quotes = blocks.filter((b) => b.type === 'quote')
    expect(bullets.length).toBeGreaterThan(15)
    expect(quotes.length).toBeGreaterThan(0)

    const h2 = blocks.find(
      (b) => b.type === 'heading' && String(b.content).startsWith('1. Introduction'),
    )
    expect(h2).toBeTruthy()
  })

  it('keeps full guidance available for agent prompts', () => {
    const section = arc42Manifest.sections.find((s) => s.id === 'introduction-and-goals.requirements-overview')!
    const text = sectionGuidanceText(section)
    expect(text).toContain('Suggested form')
    expect(text).toContain('https://docs.arc42.org/section-1/')
  })

  it('manifestOutline returns headings in order', () => {
    const outline = manifestOutline(arc42Manifest)
    expect(outline[0]).toBe('Introduction and Goals')
    expect(outline[outline.length - 1]).toBe('Glossary')
    expect(outline.length).toBe(arc42Manifest.sections.length)
  })

  it('manifestTopLevelOutline returns only H2 sections', () => {
    const top = manifestTopLevelOutline(arc42Manifest)
    expect(top).toContain('Introduction and Goals')
    expect(top).toContain('Building Block View')
    expect(top).not.toContain('Quality Goals')
    expect(top.length).toBe(12)
  })

  it('compiles table and diagram seeds', () => {
    const blocks = compileManifestToBlocks(
      {
        id: 'test-seeds',
        sections: [
          {
            id: 'goals',
            heading: 'Goals',
            headingLevel: 2,
            order: 1,
            guidance: [],
            seed: [
              {
                kind: 'table',
                content: { header: ['Goal', 'Priority'], rows: [['', '']] },
              },
              {
                kind: 'diagram',
                content: { code: 'graph TD\n  A-->B', title: 'Flow' },
              },
            ],
          },
        ],
      },
      { title: 'Test Doc' },
    )

    expect(blocks.some((b) => b.type === 'table')).toBe(true)
    expect(blocks.some((b) => b.type === 'diagram')).toBe(true)
  })
})
