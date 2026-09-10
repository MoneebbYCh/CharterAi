import type { DocTemplate } from '../docTemplateTypes'

/** Marketplace entry — a browseable starting point, independent of any doc type. */
export interface MarketplaceTemplate extends DocTemplate {
  /** Material symbol shown on the card. */
  icon: string
  /** Suggested name when creating a document from this template. */
  suggestedDocName: string
  /** Credibility / standards pill on the card (arc42, MADR, Diátaxis, …). */
  standard?: string
  /** Search keywords beyond name/description. */
  keywords?: string[]
  /** True for built-in catalog entries (vs user-saved). */
  curated?: boolean
  /** When set, canvas blocks are compiled from src/data/manifests/<id>.manifest.json. */
  manifestId?: string
  /**
   * Optional sub-templates (e.g. ADR → Nygard vs MADR).
   * When present, the gallery card opens a chooser before Use.
   */
  variants?: MarketplaceTemplate[]
}

export const MARKETPLACE_CATEGORIES = [
  'All',
  'Docs',
  'Product',
  'Architecture',
  'Engineering',
  'Saved',
] as const

export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number]
