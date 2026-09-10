import type { MarketplaceTemplate } from '../../types'
import { h, p } from '../../blocks'

/** Nygard ADR (2011) — genuinely minimal: five headers + one guiding sentence each. */
export const ADR_NYGARD: MarketplaceTemplate = {
  id: 'mp-adr-nygard',
  name: 'Nygard ADR',
  category: 'Engineering',
  standard: 'Nygard',
  tagline: 'Classic five-section ADR (Nygard, 2011).',
  description:
    'An Architectural Decision Record captures one significant decision: what was decided, why, and what it cost. The format comes from Michael Nygard’s 2011 proposal, which listed title, status, context, decision, and consequences, and still shapes most ADR tools today. Teams pick Nygard for speed when a decision does not need a full option comparison.',
  curated: true,
  icon: 'gavel',
  suggestedDocName: 'Architecture Decision',
  keywords: ['adr', 'nygard', 'decision'],
  build: () => [
    h(1, 'ADR-0001: Short Title of Decision'),
    p('Status: Proposed · YYYY-MM-DD'),
    h(2, 'Context'),
    p('Describe the forces at play and why a decision is needed now.'),
    h(2, 'Decision'),
    p('State the change we are making, in the present tense.'),
    h(2, 'Consequences'),
    p('List what becomes easier, harder, or newly required because of this decision.'),
  ],
}
