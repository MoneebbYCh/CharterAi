import { beforeEach, describe, expect, it } from 'vitest'
import {
  isCustomManifestTemplate,
  listCustomMarketplaceTemplates,
  listMarketplaceTemplates,
} from './index'
import { saveUserManifest } from './userManifestStore'

describe('custom marketplace templates', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('lists a saved custom manifest in the gallery with Custom tagline', () => {
    saveUserManifest({
      name: 'Review Checklist',
      description: 'For design reviews',
      icon: 'list_alt',
      suggestedDocName: 'Design Review',
      category: 'Engineering',
      manifest: {
        sections: [
          {
            id: 'goals',
            heading: 'Goals',
            headingLevel: 2,
            order: 1,
            guidance: ['State the review goals'],
            seed: [
              {
                kind: 'table',
                content: { header: ['Goal', 'Owner'], rows: [['', '']] },
              },
            ],
          },
        ],
      },
    })

    const customs = listCustomMarketplaceTemplates()
    expect(customs).toHaveLength(1)
    expect(customs[0].tagline).toMatch(/Custom/i)
    expect(customs[0].curated).toBe(false)
    expect(customs[0].manifestId).toBe(customs[0].id)
    expect(isCustomManifestTemplate(customs[0])).toBe(true)

    const blocks = customs[0].build()
    expect(blocks.some((b) => b.type === 'heading' && b.content === 'Goals')).toBe(true)
    expect(blocks.some((b) => b.type === 'table')).toBe(true)

    const all = listMarketplaceTemplates()
    expect(all.some((t) => t.id === customs[0].id)).toBe(true)
  })
})
