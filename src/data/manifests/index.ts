import type { TemplateManifest } from '../types/templateManifest'
import rawArc42Manifest from './arc42.manifest.json'
import { getUserManifest } from '../templates/userManifestStore'

export const arc42Manifest = rawArc42Manifest as TemplateManifest

const MANIFESTS: Record<string, TemplateManifest> = {
  [arc42Manifest.id]: arc42Manifest,
}

/** Bundled curated manifests only (not user-authored). */
export const TEMPLATE_MANIFESTS = MANIFESTS

/**
 * Resolve a manifest by id — bundled first, then workspace user store.
 * Gallery / build should use this rather than assuming disk-only.
 */
export function getTemplateManifest(id: string): TemplateManifest | undefined {
  if (MANIFESTS[id]) return MANIFESTS[id]
  return getUserManifest(id)?.manifest
}

export function listTemplateManifests(): TemplateManifest[] {
  return Object.values(MANIFESTS)
}
