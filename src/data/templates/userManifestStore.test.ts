import { describe, expect, it, beforeEach } from 'vitest'
import {
  deleteUserManifest,
  getUserManifest,
  listUserManifests,
  saveUserManifest,
  updateUserManifest,
} from './userManifestStore'

describe('userManifestStore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips save, get, update, delete', () => {
    const saved = saveUserManifest({
      name: 'My Spec',
      description: 'A custom outline',
      icon: 'description',
      suggestedDocName: 'My Spec Doc',
      category: 'Engineering',
      manifest: {
        sections: [
          {
            id: 'intro',
            heading: 'Introduction',
            headingLevel: 2,
            order: 1,
            guidance: ['Write the context'],
            seed: [{ kind: 'paragraph', content: '' }],
          },
        ],
      },
    })

    expect(saved.id).toMatch(/^custom-/)
    expect(saved.manifest.id).toBe(saved.id)
    expect(listUserManifests()).toHaveLength(1)
    expect(getUserManifest(saved.id)?.name).toBe('My Spec')

    const updated = updateUserManifest(saved.id, {
      name: 'My Spec v2',
      description: 'Updated',
      icon: 'description',
      suggestedDocName: 'My Spec Doc',
      category: 'Docs',
      manifest: {
        sections: [
          {
            id: 'intro',
            heading: 'Overview',
            headingLevel: 2,
            order: 1,
            guidance: [],
          },
        ],
      },
    })

    expect(updated?.name).toBe('My Spec v2')
    expect(updated?.manifest.id).toBe(saved.id)
    expect(getUserManifest(saved.id)?.manifest.sections[0].heading).toBe('Overview')

    expect(deleteUserManifest(saved.id)).toBe(true)
    expect(listUserManifests()).toHaveLength(0)
    expect(getUserManifest(saved.id)).toBeUndefined()
  })
})
