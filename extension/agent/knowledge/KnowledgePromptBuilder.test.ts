import { describe, expect, it } from 'vitest'
import {
  buildDocumentKnowledgePack,
  countObservedFindingsWithEvidence,
  parseDependencyOutputs,
  parseRequiredEvidenceMinObserved,
  documentGroundingRules,
  MIN_OBSERVED_FINDINGS,
} from './KnowledgePromptBuilder'
import type { Finding, ProjectFact } from '../contracts/Finding'
import type { EvidenceRecord } from '../contracts/Evidence'

const fact = (overrides: Partial<ProjectFact> = {}): ProjectFact => ({
  id: 'fact-1',
  key: 'runtime.backend',
  statement: 'Extension host runs in Node',
  domain: 'runtime',
  sourceFindingIds: ['f-1'],
  evidenceIds: ['ev-1'],
  confidence: 'high',
  repositoryVersion: 'rv1',
  updatedAt: 1,
  ...overrides,
})

const finding = (overrides: Partial<Finding> = {}): Finding => ({
  id: 'finding-1',
  claim: 'Auth uses middleware',
  type: 'observed',
  domain: 'auth',
  evidenceIds: ['ev-2'],
  confidence: 'high',
  assumptions: [],
  contradictions: [],
  repositoryVersion: 'rv1',
  ...overrides,
})

const evidence = (overrides: Partial<EvidenceRecord> = {}): EvidenceRecord => ({
  id: 'ev-1',
  repositoryVersion: 'rv1',
  path: 'extension/agent/auth.ts',
  contentHash: 'hash',
  range: { startLine: 1, endLine: 10 },
  kind: 'source',
  excerpt: 'export function authenticate() {}',
  sourceTool: 'read_file',
  createdAt: 1,
  ...overrides,
})

describe('KnowledgePromptBuilder', () => {
  it('parses repository survey dependency outputs', () => {
    const parsed = parseDependencyOutputs([
      JSON.stringify({
        overview: 'Monorepo with extension and webview',
        structure_highlights: [{ claim: 'extension/ hosts VS Code logic' }],
        package_manifest: [{ claim: 'charter-ai@1.0.0' }],
        unknowns: ['deployment target unclear'],
      }),
    ])
    expect(parsed.survey?.overview).toContain('Monorepo')
    expect(parsed.survey?.structureHighlights[0]).toContain('extension/')
    expect(parsed.unknowns).toContain('deployment target unclear')
  })

  it('includes prior analysis summaries and evidence excerpts', () => {
    const pack = buildDocumentKnowledgePack({
      facts: [fact()],
      findings: [finding()],
      evidence: [
        evidence(),
        evidence({ id: 'ev-2', path: 'src/middleware.ts', excerpt: 'verifyToken()' }),
      ],
      dependencyOutputs: [JSON.stringify({ role: 'Security', findings: [{ claim: 'JWT used' }] })],
    })
    expect(pack.text).toContain('Prior analysis 1')
    expect(pack.text).toContain('[EVIDENCE:ev-1]')
    expect(pack.text).toContain('Canonical facts')
    expect(pack.text).toContain('OBSERVED')
  })

  it('uses stable domain sort for facts', () => {
    const pack = buildDocumentKnowledgePack({
      facts: [
        fact({ id: 'f-z', domain: 'zebra', statement: 'Z', updatedAt: 99 }),
        fact({ id: 'f-a', domain: 'auth', statement: 'A', updatedAt: 1 }),
      ],
      findings: [],
      evidence: [],
    })
    const authPos = pack.text.indexOf('auth')
    const zebraPos = pack.text.indexOf('zebra')
    expect(authPos).toBeGreaterThanOrEqual(0)
    expect(zebraPos).toBeGreaterThan(authPos)
  })

  it('boosts section-relevant evidence for a heading query', () => {
    const pack = buildDocumentKnowledgePack({
      facts: [],
      findings: [
        finding({ evidenceIds: ['ev-auth'] }),
        finding({ id: 'f-2', domain: 'billing', claim: 'Stripe integration', evidenceIds: ['ev-bill'] }),
      ],
      evidence: [
        evidence({ id: 'ev-auth', path: 'src/auth/middleware.ts', excerpt: 'authenticate request' }),
        evidence({ id: 'ev-bill', path: 'src/billing/stripe.ts', excerpt: 'createCharge' }),
      ],
      sectionHeading: 'Authentication architecture',
      documentTitle: 'Security Architecture',
    })
    const authPos = pack.text.indexOf('ev-auth')
    const billPos = pack.text.indexOf('ev-bill')
    expect(authPos).toBeGreaterThanOrEqual(0)
    expect(billPos).toBeGreaterThanOrEqual(0)
    expect(authPos).toBeLessThan(billPos)
  })

  it('detects knowledge gaps when observed findings are below threshold', () => {
    const pack = buildDocumentKnowledgePack({
      facts: [],
      findings: [finding({ type: 'inferred', evidenceIds: [] })],
      evidence: [],
    })
    expect(pack.hasKnowledgeGaps).toBe(true)
    expect(pack.text).toContain('KNOWLEDGE GAPS')
    expect(pack.observedFindingCount).toBe(0)
    expect(documentGroundingRules(pack)).toContain('Do NOT invent')
  })

  it('includes uncited evidence excerpts when observed findings are below threshold', () => {
    const pack = buildDocumentKnowledgePack({
      facts: [],
      findings: [],
      evidence: [evidence({ id: 'ev-read', path: 'extension/agent/runtime/AgentRuntime.ts', excerpt: 'export class AgentRuntime' })],
    })
    expect(pack.text).toContain('[EVIDENCE:ev-read]')
    expect(pack.text).toContain('AgentRuntime.ts')
  })

  it('counts observed findings with evidence', () => {
    expect(
      countObservedFindingsWithEvidence([
        finding(),
        finding({ id: 'f-2', type: 'observed', evidenceIds: [] }),
        finding({ id: 'f-3', type: 'inferred', evidenceIds: ['ev-3'] }),
      ]),
    ).toBe(1)
  })

  it('parses requiredEvidence min_observed token', () => {
    expect(parseRequiredEvidenceMinObserved(['min_observed_findings:3'])).toBe(3)
    expect(parseRequiredEvidenceMinObserved([])).toBeUndefined()
  })

  it('uses healthy grounding rules when enough observed findings exist', () => {
    const pack = buildDocumentKnowledgePack({
      facts: [],
      findings: [
        finding({ id: 'f-1' }),
        finding({ id: 'f-2', claim: 'Uses React' }),
        finding({ id: 'f-3', claim: 'BlockNote canvas' }),
      ],
      evidence: [
        evidence({ id: 'ev-1' }),
        evidence({ id: 'ev-2' }),
        evidence({ id: 'ev-3' }),
      ],
      dependencyOutputs: [],
    })
    expect(pack.observedFindingCount).toBeGreaterThanOrEqual(MIN_OBSERVED_FINDINGS)
    expect(pack.hasKnowledgeGaps).toBe(false)
    expect(documentGroundingRules(pack)).toContain('Ground every factual statement')
  })
})
