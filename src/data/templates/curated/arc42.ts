import type { MarketplaceTemplate } from '../types'
import { arc42Manifest } from '../../manifests'
import { compileManifestToBlocks } from '../compileManifest'

export const ARC42_TEMPLATE: MarketplaceTemplate = {
  id: 'mp-arc42',
  manifestId: 'mp-arc42',
  name: 'Architecture (arc42)',
  category: 'Architecture',
  standard: 'arc42',
  tagline: 'arc42 v9 with section guidance and room to write.',
  description:
    'arc42 is a widely used template for documenting software architecture, maintained as an open source project and taught in the iSAQB certification used across Europe. It splits architecture documentation into 12 fixed sections, covering goals, building blocks, runtime behavior, deployment, and known risks, so every doc answers the same core questions no matter who wrote it. This template is driven by an arc42 v9 manifest: each section carries the standard’s own guidance text.',
  curated: true,
  icon: 'schema',
  suggestedDocName: 'Architecture',
  keywords: ['arc42', 'architecture', 'c4', 'system design'],
  build: () =>
    compileManifestToBlocks(arc42Manifest, {
      title: 'Architecture Documentation (arc42)',
      numberTopLevel: true,
    }),
}
