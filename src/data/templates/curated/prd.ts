import type { MarketplaceTemplate } from '../types'
import { bullet, guide, h, p, quote, table } from '../blocks'

export const PRD_TEMPLATE: MarketplaceTemplate = {
  id: 'mp-prd',
  name: 'Product Requirements (PRD)',
  category: 'Product',
  standard: 'Convention',
  tagline: 'Industry-converged PRD with metadata, TL;DR, and filled tables.',
  description:
    'There is no official standard for a PRD, but product teams have converged on a similar shape because the same questions always need answers: what problem you’re solving, who it’s for, what success looks like, and what’s out of scope. A PRD keeps engineering, design, and stakeholders aligned before any code gets written, which makes it one of the most requested documents in early stage product work.',
  curated: true,
  icon: 'lightbulb',
  suggestedDocName: 'Product Requirements',
  keywords: ['prd', 'requirements', 'product', 'jtbd', 'user stories'],
  build: () => [
    h(1, 'Product Requirements Document'),
    table(
      ['Field', 'Value'],
      [
        ['Author', 'Your name'],
        ['Status', 'Draft'],
        ['Last updated', 'YYYY-MM-DD'],
        ['Stakeholders', 'PM, Eng lead, Design, Support'],
      ],
    ),
    quote(
      'TL;DR — In one or two sentences: who this is for, what changes, and how we will know it worked.',
    ),
    h(2, 'Problem statement / background'),
    guide('What is broken or missing today? Who feels it, how often, and what workaround do they use?'),
    p(
      'Support spends ~4 hours/week manually reconciling failed webhook deliveries. Customers see “payment succeeded” while fulfillment never starts.',
    ),
    h(2, 'Goals and non-goals'),
    guide('Keep goals and non-goals side by side so scope arguments stay concrete.'),
    table(
      ['Goals', 'Non-goals'],
      [
        ['Auto-retry failed webhooks with backoff', 'Rebuilding the entire payments stack'],
        ['Surface delivery status in the admin UI', 'Multi-region active-active in v1'],
        ['Cut manual reconciliation time by 80%', 'Changing merchant pricing models'],
      ],
    ),
    h(2, 'User stories / Jobs-to-be-Done'),
    guide('Keep the “As a … I want … so that …” shape — one story per bullet.'),
    bullet('As a [ops engineer], I want [failed deliveries queued with reason codes], so that [I can fix root causes without grepping logs].'),
    bullet('As a [support agent], I want [a timeline of webhook attempts on the order], so that [I can answer merchants without escalating].'),
    bullet('As a [merchant], I want [fulfillment to start after a successful payment], so that [customers receive orders on time].'),
    h(2, 'Requirements'),
    h(3, 'Functional'),
    guide('Each requirement should be testable. Prefer “system shall…” over vague wishes.'),
    bullet('System shall enqueue failed webhook deliveries with attempt count and last error.'),
    bullet('System shall expose delivery status on the order detail page within 30s of an attempt.'),
    h(3, 'Non-functional'),
    bullet('p95 enqueue latency < 200ms under peak load'),
    bullet('Retries must be idempotent for the same delivery id'),
    bullet('Admin views meet WCAG 2.2 AA for status badges and tables'),
    h(2, 'Success metrics'),
    guide('Baseline vs target — if you lack a baseline, write “TBD” and a plan to measure.'),
    table(
      ['Metric', 'Baseline', 'Target'],
      [
        ['Manual reconciliation hours / week', '4h', '≤ 0.8h'],
        ['Orders stuck > 15m after paid', '2.1%', '< 0.3%'],
        ['Mean time to diagnose webhook failure', '45m', '< 10m'],
      ],
    ),
    h(2, 'Out of scope'),
    table(
      ['In scope', 'Out of scope'],
      [
        ['Webhook retry worker', 'Payment provider migration'],
        ['Admin delivery timeline', 'Multi-region active-active'],
        ['Alerting on retry exhaustion', 'Merchant-facing status page'],
      ],
    ),
    h(2, 'Open questions'),
    guide('Unanswered decisions that block build or launch.'),
    bullet('Do we keep delivery payloads longer than 30 days?'),
    bullet('Who owns the on-call rotation for the retry worker?'),
  ],
}
