import { beforeEach, describe, expect, it } from 'vitest'
import { compileManifestToBlocks } from './compileManifest'
import { getMarketplaceTemplate, getTemplateManifest } from './index'
import { saveUserManifest } from './userManifestStore'

describe('smoke: custom template create → canvas blocks', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('gallery build equals compile of the stored manifest', () => {
    const saved = saveUserManifest({
      name: 'Smoke Spec',
      icon: 'architecture',
      suggestedDocName: 'Smoke Spec',
      category: 'Architecture',
      manifest: {
        sections: [
          {
            id: 'goals',
            heading: 'Goals',
            headingLevel: 2,
            order: 1,
            guidance: ['Define goals'],
            seed: [
              {
                kind: 'table',
                content: { header: ['Goal', 'Priority'], rows: [['', '']] },
              },
            ],
          },
          {
            id: 'arch',
            heading: 'Architecture',
            headingLevel: 2,
            order: 2,
            guidance: [],
            seed: [
              {
                kind: 'diagram',
                content: { code: 'graph TD\n  A-->B', title: 'Context' },
              },
            ],
          },
        ],
      },
    })

    const gallery = getMarketplaceTemplate(saved.id)
    expect(gallery).toBeTruthy()
    const fromGallery = gallery!.build()
    const fromManifest = compileManifestToBlocks(getTemplateManifest(saved.id)!, {
      title: saved.name,
      numberTopLevel: false,
    })

    expect(fromGallery).toEqual(fromManifest)
    expect(fromGallery.some((b) => b.type === 'table')).toBe(true)
    expect(fromGallery.some((b) => b.type === 'diagram')).toBe(true)
    expect(fromGallery[0]).toMatchObject({ type: 'heading', content: 'Smoke Spec' })
  })
})
