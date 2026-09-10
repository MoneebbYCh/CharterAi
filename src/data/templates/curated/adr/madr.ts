import type { MarketplaceTemplate } from '../../types'
import { bullet, guide, h, numbered, p, quote } from '../../blocks'

/** MADR v4 — full sub-structure pre-filled. */
export const ADR_MADR: MarketplaceTemplate = {
  id: 'mp-adr-madr',
  name: 'MADR v4',
  category: 'Engineering',
  standard: 'MADR',
  tagline: 'Markdown Architectural Decision Records (v4.0.0).',
  description:
    'An Architectural Decision Record captures one significant decision: what was decided, why, and what it cost. MADR builds on Nygard’s 2011 format by adding structure for comparing the options you actually considered, which helps when a decision gets questioned later. Teams pick MADR when a decision needs more justification.',
  curated: true,
  icon: 'gavel',
  suggestedDocName: 'Architecture Decision',
  keywords: ['adr', 'madr', 'decision'],
  build: () => [
    h(1, 'ADR-0001: Short Title of Decision'),
    quote('Status — Proposed · date TBD · authors TBD'),
    h(2, 'Context and problem statement'),
    guide(
      'Frame the situation as: In the context of <…>, facing <…>, we need to decide <…>.',
    ),
    p(
      'In the context of our service boundary for checkout, facing rising coupling between billing and inventory, we need to decide how ownership of the order aggregate should be split.',
    ),
    h(2, 'Decision drivers'),
    guide('Bullet the forces that will decide the option — latency, operability, team skill, cost, compliance.'),
    bullet('Independently deployable services'),
    bullet('Clear ownership for on-call'),
    bullet('Minimal migration risk for in-flight orders'),
    h(2, 'Considered options'),
    guide('Number each realistic option. Include “do nothing” when it is a real choice.'),
    numbered('Keep a single order service; extract billing later'),
    numbered('Split into Order + Billing now with a shared events bus'),
    numbered('Adopt an existing commercial order platform'),
    h(2, 'Decision outcome'),
    guide('Use the Y-statement shape so the choice and rationale stay inseparable.'),
    p('Chosen option: Split into Order + Billing now with a shared events bus, because it unlocks independent deployability without a multi-year rewrite.'),
    h(3, 'Good consequences'),
    bullet('Teams can ship billing changes without coordinating order releases'),
    bullet('On-call ownership maps cleanly to service boundaries'),
    h(3, 'Bad consequences'),
    bullet('Temporary dual-write period increases operational load'),
    bullet('Event schema versioning becomes a first-class concern'),
    h(2, 'Confirmation / compliance'),
    guide(
      'Optional: how this decision is verified — lint rules, ADR index, review checklist, CI gate.',
    ),
    p('Architecture review checklist includes “ADR linked from service README.” Event schemas validated in CI.'),
    h(2, 'More information'),
    p('Links to PRs, tickets, related ADRs, or design docs.'),
  ],
}
