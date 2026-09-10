import { listDocumentTypes } from '../documentTypes'
import { templatesForType } from '../docTemplates'
import { CURATED_TEMPLATES } from './curated'
import { compileManifestToBlocks } from './compileManifest'
import type { MarketplaceCategory, MarketplaceTemplate } from './types'
import {
  deleteUserManifest,
  listUserManifests,
  type StoredUserManifest,
} from './userManifestStore'

export type { MarketplaceCategory, MarketplaceTemplate } from './types'
export { MARKETPLACE_CATEGORIES } from './types'
export { CURATED_TEMPLATES } from './curated'
export {
  compileManifestToBlocks,
  manifestOutline,
  manifestTopLevelOutline,
  sectionGuidanceText,
  type CompileManifestOptions,
} from './compileManifest'
export { extractManifestFromBlocks, type ExtractManifestResult } from './extractManifestFromBlocks'
export type { SectionSpec, SeedSpec, TemplateManifest } from '../types/templateManifest'
export { getTemplateManifest, listTemplateManifests, TEMPLATE_MANIFESTS } from '../manifests'
export {
  deleteUserManifest,
  getUserManifest,
  isUserManifestId,
  listUserManifests,
  saveUserManifest,
  updateUserManifest,
  type StoredUserManifest,
  type UserManifestInput,
} from './userManifestStore'

/** @deprecated Use CURATED_TEMPLATES — kept for existing imports. */
export const MARKETPLACE_TEMPLATES = CURATED_TEMPLATES

/** Flatten curated entries including ADR variants (for seed lookup). */
export function listCuratedMarketplaceTemplatesFlat(): MarketplaceTemplate[] {
  const out: MarketplaceTemplate[] = []
  for (const t of CURATED_TEMPLATES) {
    out.push(t)
    if (t.variants?.length) out.push(...t.variants)
  }
  return out
}

function storedToMarketplace(stored: StoredUserManifest): MarketplaceTemplate {
  return {
    id: stored.id,
    name: stored.name,
    category: 'Saved',
    tagline: 'Custom template you authored.',
    description:
      stored.description ||
      'A structure you defined — sections, guidance, and starter grids compile to the canvas.',
    curated: false,
    icon: stored.icon,
    suggestedDocName: stored.suggestedDocName,
    keywords: ['custom', 'saved', stored.category, stored.name],
    manifestId: stored.id,
    build: () =>
      compileManifestToBlocks(stored.manifest, {
        title: stored.name,
        numberTopLevel: false,
      }),
  }
}

/** User-authored TemplateManifest entries (workspace-scoped). */
export function listCustomMarketplaceTemplates(): MarketplaceTemplate[] {
  return listUserManifests().map(storedToMarketplace)
}

/** True when this gallery card is an editable user-authored manifest. */
export function isCustomManifestTemplate(template: MarketplaceTemplate): boolean {
  return Boolean(template.manifestId && template.curated === false)
}

/** User-saved canvas snapshots across all document types, adapted for the marketplace. */
export function listSavedMarketplaceTemplates(): MarketplaceTemplate[] {
  const out: MarketplaceTemplate[] = []
  for (const doc of listDocumentTypes()) {
    for (const t of templatesForType(doc.id)) {
      out.push({
        ...t,
        icon: doc.icon || 'bookmark',
        suggestedDocName: t.name,
        curated: false,
        keywords: ['saved', 'snapshot', doc.title, doc.id],
        category: 'Saved',
        description: t.description || `Saved from “${doc.title}”.`,
        tagline: t.tagline || `From ${doc.title}`,
      })
    }
  }
  return out
}

/** Gallery list: custom manifests first (so new saves are obvious), then curated, then snapshots. */
export function listMarketplaceTemplates(): MarketplaceTemplate[] {
  return [
    ...listCustomMarketplaceTemplates(),
    ...CURATED_TEMPLATES,
    ...listSavedMarketplaceTemplates(),
  ]
}

export function getMarketplaceTemplate(id: string): MarketplaceTemplate | undefined {
  return (
    listCuratedMarketplaceTemplatesFlat().find((t) => t.id === id) ??
    listCustomMarketplaceTemplates().find((t) => t.id === id) ??
    listSavedMarketplaceTemplates().find((t) => t.id === id)
  )
}

export function removeCustomMarketplaceTemplate(id: string): boolean {
  return deleteUserManifest(id)
}

export function filterMarketplaceTemplates(
  templates: MarketplaceTemplate[],
  query: string,
  category: MarketplaceCategory,
): MarketplaceTemplate[] {
  const q = query.trim().toLowerCase()
  return templates.filter((t) => {
    if (category !== 'All' && t.category !== category) return false
    if (!q) return true
    const hay = [
      t.name,
      t.tagline,
      t.description,
      t.category,
      t.standard ?? '',
      ...(t.keywords ?? []),
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}
