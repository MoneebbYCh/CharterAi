import type { MarketplaceTemplate } from '../types'
import { ADR_TEMPLATE } from './adr'
import { API_DOCS_TEMPLATE } from './api-docs'
import { ARC42_TEMPLATE } from './arc42'
import { PRD_TEMPLATE } from './prd'
import { README_TEMPLATE } from './readme'

/**
 * Built-in marketplace catalog. Add or remove entries here when introducing
 * new curated templates under ./curated/.
 */
export const CURATED_TEMPLATES: MarketplaceTemplate[] = [
  README_TEMPLATE,
  PRD_TEMPLATE,
  ARC42_TEMPLATE,
  API_DOCS_TEMPLATE,
  ADR_TEMPLATE,
]

export {
  ADR_TEMPLATE,
  API_DOCS_TEMPLATE,
  ARC42_TEMPLATE,
  PRD_TEMPLATE,
  README_TEMPLATE,
}
