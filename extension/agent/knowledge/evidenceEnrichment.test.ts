import { describe, expect, it } from 'vitest'
import { enrichEvidenceIds, findingsFromEvidenceReads } from './evidenceEnrichment'
import { EvidenceLedger } from './EvidenceLedger'

describe('enrichEvidenceIds', () => {
  it('returns existing evidence ids unchanged', () => {
    const ledger = new EvidenceLedger()
    expect(enrichEvidenceIds('auth middleware', ['ev-1'], ['ev-1', 'ev-2'], ledger)).toEqual(['ev-1'])
  })

  it('attaches best-matching loop evidence when claim overlaps excerpt', () => {
    const ledger = new EvidenceLedger()
    ledger.record(
      {
        path: 'src/auth/middleware.ts',
        startLine: 1,
        endLine: 5,
        excerpt: 'export function verifyToken()',
        kind: 'source',
        sourceTool: 'read_file',
      },
      'rv1',
    )
    const id = ledger.all()[0]!.id
    expect(enrichEvidenceIds('verifyToken middleware handles auth', [], [id], ledger)).toEqual([id])
  })

  it('does not attach evidence outside loop ids', () => {
    const ledger = new EvidenceLedger()
    ledger.record(
      {
        path: 'src/billing.ts',
        startLine: 1,
        endLine: 2,
        excerpt: 'billing',
        kind: 'source',
        sourceTool: 'read_file',
      },
      'rv1',
    )
    const id = ledger.all()[0]!.id
    expect(enrichEvidenceIds('unrelated claim about databases', [], [], ledger)).toEqual([])
    expect(enrichEvidenceIds('unrelated claim', [], [id], ledger)).toEqual([])
  })

  it('synthesizes observed findings from loop evidence reads', () => {
    const ledger = new EvidenceLedger()
    ledger.record(
      {
        path: 'extension/agent/runtime/AgentRuntime.ts',
        startLine: 1,
        endLine: 10,
        excerpt: 'export class AgentRuntime',
        kind: 'source',
        sourceTool: 'read_file',
      },
      'rv1',
    )
    const id = ledger.all()[0]!.id
    const findings = findingsFromEvidenceReads([id], ledger, 'architecture', 'rv1')
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ type: 'observed', evidenceIds: [id] })
    expect(findings[0]!.claim).toContain('AgentRuntime.ts')
  })
})
