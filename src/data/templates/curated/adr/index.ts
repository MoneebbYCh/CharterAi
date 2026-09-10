import type { MarketplaceTemplate } from '../../types'
import { ADR_MADR } from './madr'
import { ADR_NYGARD } from './nygard'

/** ADR gallery card — one entry with Nygard + MADR as variants. */
export const ADR_TEMPLATE: MarketplaceTemplate = {
  id: 'mp-adr',
  name: 'Architecture Decision Record',
  category: 'Engineering',
  standard: 'ADR',
  tagline: 'Choose Nygard (classic) or MADR v4.',
  description:
    'An Architectural Decision Record captures one significant decision: what was decided, why, and what it cost. The format comes from Michael Nygard’s 2011 proposal, which listed title, status, context, decision, and consequences, and still shapes most ADR tools today. MADR builds on that by adding structure for comparing the options you actually considered, which helps when a decision gets questioned later. Teams pick Nygard for speed and MADR when a decision needs more justification.',
  curated: true,
  icon: 'gavel',
  suggestedDocName: 'Architecture Decision',
  keywords: ['adr', 'nygard', 'madr', 'decision', 'architecture'],
  build: () => ADR_NYGARD.build(),
  variants: [ADR_NYGARD, ADR_MADR],
}

export { ADR_MADR, ADR_NYGARD }
