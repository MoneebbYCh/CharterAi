import type { Finding } from '../contracts/Finding'
import type { EvidenceLedger } from './EvidenceLedger'

/**
 * When a model omits evidenceIds but read evidence during the run, attach the
 * best-matching id from loop.evidenceIds only (never invent ids).
 */
export function enrichEvidenceIds(
  claim: string,
  evidenceIds: readonly string[],
  loopEvidenceIds: readonly string[],
  evidence: EvidenceLedger,
): string[] {
  if (evidenceIds.length > 0) return [...evidenceIds]
  if (loopEvidenceIds.length === 0) return []

  const claimLower = claim.toLowerCase()
  const claimTokens = claimLower.split(/[^a-z0-9]+/).filter((t) => t.length > 3)

  let best: { id: string; score: number } | undefined
  for (const id of loopEvidenceIds) {
    const record = evidence.get(id)
    if (!record) continue
    const haystack = `${record.path} ${record.excerpt ?? ''}`.toLowerCase()
    let score = 0
    for (const token of claimTokens) {
      if (haystack.includes(token)) score++
    }
    for (const segment of record.path.toLowerCase().split(/[/\\]+/)) {
      if (segment.length > 2 && claimLower.includes(segment)) score += 2
    }
    if (!best || score > best.score) best = { id, score }
  }

  return best && best.score > 0 ? [best.id] : []
}

/**
 * Synthesize observed findings from tool-recorded evidence when worker JSON
 * omitted citations or failed to parse — only ids from this run are used.
 */
export function findingsFromEvidenceReads(
  loopEvidenceIds: readonly string[],
  evidence: EvidenceLedger,
  domain: string,
  repositoryVersion: string,
  maxFindings = 8,
): Array<Omit<Finding, 'id'>> {
  const byPath = new Map<string, string>()
  for (const id of loopEvidenceIds) {
    const record = evidence.get(id)
    if (!record?.excerpt?.trim()) continue
    if (!byPath.has(record.path)) byPath.set(record.path, id)
  }

  const inputs: Array<Omit<Finding, 'id'>> = []
  for (const [, id] of byPath) {
    if (inputs.length >= maxFindings) break
    const record = evidence.get(id)
    if (!record?.excerpt?.trim()) continue
    const range =
      record.startLine && record.endLine ? ` (lines ${record.startLine}-${record.endLine})` : ''
    inputs.push({
      claim: `Read ${record.path}${range}: ${record.excerpt.trim().slice(0, 240)}`,
      type: 'observed',
      domain,
      evidenceIds: [id],
      confidence: 'medium',
      assumptions: ['Auto-linked from repository reads when analysis output omitted citations.'],
      contradictions: [],
      repositoryVersion,
    })
  }
  return inputs
}

export function countObservedWithEvidence(inputs: readonly Omit<Finding, 'id'>[]): number {
  return inputs.filter((f) => f.type === 'observed' && f.evidenceIds.length > 0).length
}
