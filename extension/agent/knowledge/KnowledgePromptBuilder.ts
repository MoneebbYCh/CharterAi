import type { EvidenceRecord } from '../contracts/Evidence'
import type { Finding, ProjectFact } from '../contracts/Finding'
import { buildContext } from '../context/ContextBuilder'

/** Minimum observed findings with evidence before the pack is considered healthy. */
export const MIN_OBSERVED_FINDINGS = 3

export const REQUIRED_EVIDENCE_MIN_OBSERVED = 'min_observed_findings:3'

const MAX_EVIDENCE_EXCERPT_CHARS = 2_000
const DEFAULT_TOKEN_BUDGET = 6_000
/** When findings lack citations, still surface recent reads for document writers. */
const MAX_UNCITED_EVIDENCE = 12

export interface KnowledgePromptInput {
  facts: readonly ProjectFact[]
  findings: readonly Finding[]
  evidence: readonly EvidenceRecord[]
  dependencyOutputs?: readonly string[]
  sectionHeading?: string
  documentTitle?: string
  /** Extra gap messages (e.g. from readiness evaluation). */
  extraGaps?: readonly string[]
  tokenBudget?: number
}

export interface KnowledgePromptPack {
  /** Full formatted text for document/validation prompts. */
  text: string
  /** Layer blocks after budget allocation (for ContextualModelProvider). */
  layers: {
    knowledgeGaps: string[]
    surveySummary: string[]
    priorAnalysis: string[]
    facts: string[]
    findings: string[]
    evidenceExcerpts: string[]
  }
  observedFindingCount: number
  hasKnowledgeGaps: boolean
}

interface ParsedDependencyOutput {
  survey?: {
    overview: string
    structureHighlights: string[]
    packageManifest: string[]
    unknowns: string[]
  }
  analysis: string[]
  unknowns: string[]
}

interface Scored<T> {
  item: T
  score: number
  domain: string
  recency: number
}

/** Parse explorer/analysis dependency output JSON blobs. */
export function parseDependencyOutputs(outputs: readonly string[]): ParsedDependencyOutput {
  const result: ParsedDependencyOutput = { analysis: [], unknowns: [] }
  for (const raw of outputs) {
    if (!raw.trim()) continue
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      result.analysis.push(raw.slice(0, 4_000))
      continue
    }
    if (!parsed || typeof parsed !== 'object') {
      result.analysis.push(raw.slice(0, 4_000))
      continue
    }
    const obj = parsed as Record<string, unknown>
    if (typeof obj.overview === 'string' || Array.isArray(obj.structure_highlights)) {
      const highlights = Array.isArray(obj.structure_highlights)
        ? obj.structure_highlights
            .map((h) => {
              if (h && typeof h === 'object' && 'claim' in h) return String((h as { claim: unknown }).claim)
              return typeof h === 'string' ? h : ''
            })
            .filter(Boolean)
        : []
      const manifest = Array.isArray(obj.package_manifest)
        ? obj.package_manifest
            .map((h) => {
              if (h && typeof h === 'object' && 'claim' in h) return String((h as { claim: unknown }).claim)
              return typeof h === 'string' ? h : ''
            })
            .filter(Boolean)
        : []
      const unknowns = Array.isArray(obj.unknowns) ? obj.unknowns.map(String).filter(Boolean) : []
      result.survey = {
        overview: typeof obj.overview === 'string' ? obj.overview : '',
        structureHighlights: highlights,
        packageManifest: manifest,
        unknowns,
      }
      result.unknowns.push(...unknowns)
      continue
    }
    if (Array.isArray(obj.unknowns)) result.unknowns.push(...obj.unknowns.map(String).filter(Boolean))
    result.analysis.push(raw.slice(0, 4_000))
  }
  return result
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2)
}

function relevanceScore(text: string, query: string): number {
  if (!query.trim()) return 0
  const queryTokens = new Set(tokenize(query))
  if (queryTokens.size === 0) return 0
  const textTokens = tokenize(text)
  let hits = 0
  for (const t of textTokens) if (queryTokens.has(t)) hits++
  return hits
}

function stableSortFacts(facts: readonly ProjectFact[]): Scored<ProjectFact>[] {
  return facts
    .map((item, index) => ({
      item,
      score: 0,
      domain: item.domain.toLowerCase(),
      recency: item.updatedAt || index,
    }))
    .sort((a, b) => a.domain.localeCompare(b.domain) || a.recency - b.recency)
}

function stableSortFindings(findings: readonly Finding[]): Scored<Finding>[] {
  const typeOrder: Record<Finding['type'], number> = { observed: 0, inferred: 1, proposed: 2, unknown: 3 }
  return findings
    .map((item, index) => ({
      item,
      score: 0,
      domain: item.domain.toLowerCase(),
      recency: index,
    }))
    .sort(
      (a, b) =>
        typeOrder[a.item.type] - typeOrder[b.item.type] ||
        a.domain.localeCompare(b.domain) ||
        a.recency - b.recency,
    )
}

function applyRelevance<T extends { domain: string }>(
  scored: Scored<T>[],
  query: string,
  textFor: (item: T) => string,
): Scored<T>[] {
  if (!query.trim()) return scored
  return [...scored]
    .map((s) => ({
      ...s,
      score: relevanceScore(`${s.domain} ${textFor(s.item)}`, query),
    }))
    .sort((a, b) => b.score - a.score || a.domain.localeCompare(b.domain) || a.recency - b.recency)
}

function formatEvidenceExcerpt(record: EvidenceRecord): string {
  const range = record.range ? `:${record.range.startLine}-${record.range.endLine}` : ''
  const excerpt = (record.excerpt ?? '').slice(0, MAX_EVIDENCE_EXCERPT_CHARS)
  return `[EVIDENCE:${record.id}] ${record.path}${range}\n${excerpt}`
}

export function countObservedFindingsWithEvidence(findings: readonly Finding[]): number {
  return findings.filter((f) => f.type === 'observed' && f.evidenceIds.length > 0).length
}

export function parseRequiredEvidenceMinObserved(requiredEvidence: readonly string[]): number | undefined {
  for (const token of requiredEvidence) {
    const match = /^min_observed_findings:(\d+)$/.exec(token.trim())
    if (match) return Number(match[1])
  }
  return undefined
}

/**
 * Build a unified knowledge pack for document writers, validation, and the
 * contextual model provider. Uses stable selection and optional section
 * relevance instead of inconsistent first/last slicing.
 */
export function buildDocumentKnowledgePack(input: KnowledgePromptInput): KnowledgePromptPack {
  const budget = input.tokenBudget ?? DEFAULT_TOKEN_BUDGET
  const query = [input.documentTitle, input.sectionHeading].filter(Boolean).join(' ')
  const deps = parseDependencyOutputs(input.dependencyOutputs ?? [])
  const evidenceById = new Map(input.evidence.map((r) => [r.id, r]))

  const sortedFacts = applyRelevance(stableSortFacts(input.facts), query, (f) => f.statement)
  const sortedFindings = applyRelevance(stableSortFindings(input.findings), query, (f) => f.claim)

  const observedFindingCount = countObservedFindingsWithEvidence(input.findings)
  const knowledgeGaps: string[] = [...(input.extraGaps ?? [])]
  if (observedFindingCount < MIN_OBSERVED_FINDINGS) {
    knowledgeGaps.push(
      `Only ${observedFindingCount} observed finding(s) with evidence (minimum ${MIN_OBSERVED_FINDINGS}). ` +
        'Do not invent file paths, APIs, class names, or dependencies.',
    )
  }
  if (sortedFacts.length === 0 && sortedFindings.length === 0 && deps.analysis.length === 0 && !deps.survey) {
    knowledgeGaps.push('No established repository facts or analysis summaries are available.')
  }
  knowledgeGaps.push(...deps.unknowns)

  const surveySummary: string[] = []
  if (deps.survey) {
    const lines: string[] = ['Repository survey:']
    if (deps.survey.overview) lines.push(deps.survey.overview)
    for (const h of deps.survey.structureHighlights) lines.push(`- Structure: ${h}`)
    for (const p of deps.survey.packageManifest) lines.push(`- Package: ${p}`)
    for (const u of deps.survey.unknowns) lines.push(`- Unknown: ${u}`)
    if (lines.length > 1) surveySummary.push(lines.join('\n'))
  }

  const priorAnalysis = deps.analysis.map((a, i) => `--- Prior analysis ${i + 1} ---\n${a}`)

  const factsLines = sortedFacts.map(
    ({ item: f }) => `[FACT:${f.id}] ${f.domain}: ${f.statement} (evidence: ${f.evidenceIds.join(', ') || 'none'})`,
  )

  const findingsByType: Record<Finding['type'], string[]> = { observed: [], inferred: [], proposed: [], unknown: [] }
  for (const { item: f } of sortedFindings) {
    findingsByType[f.type].push(
      `[FINDING:${f.id}] (${f.domain}): ${f.claim} (evidence: ${f.evidenceIds.join(', ') || 'none'})`,
    )
  }
  const findingsLines = [
    ...findingsByType.observed.map((l) => `OBSERVED ${l}`),
    ...findingsByType.inferred.map((l) => `INFERRED ${l}`),
    ...findingsByType.proposed.map((l) => `PROPOSED ${l}`),
    ...findingsByType.unknown.map((l) => `UNKNOWN ${l}`),
  ]

  const citedIds = new Set<string>()
  for (const { item: f } of sortedFacts) for (const id of f.evidenceIds) citedIds.add(id)
  for (const { item: f } of sortedFindings) for (const id of f.evidenceIds) citedIds.add(id)

  let evidenceScored = [...citedIds]
    .map((id) => evidenceById.get(id))
    .filter((r): r is EvidenceRecord => Boolean(r))
    .map((record, index) => ({
      record,
      score: relevanceScore(`${record.path} ${record.excerpt ?? ''}`, query),
      index,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)

  if (observedFindingCount < MIN_OBSERVED_FINDINGS && input.evidence.length > 0) {
    const extra = input.evidence
      .filter((record) => !citedIds.has(record.id))
      .map((record, index) => ({
        record,
        score: relevanceScore(`${record.path} ${record.excerpt ?? ''}`, query),
        index,
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, MAX_UNCITED_EVIDENCE)
    evidenceScored = [...evidenceScored, ...extra]
  }

  const evidenceExcerpts = evidenceScored.map(({ record }) => formatEvidenceExcerpt(record))

  const gapBlock =
    knowledgeGaps.length > 0
      ? [`KNOWLEDGE GAPS (address with warn blockquotes — do not speculate):\n${[...new Set(knowledgeGaps)].map((g) => `- ${g}`).join('\n')}`]
      : []

  const layers = {
    knowledgeGaps: gapBlock,
    surveySummary,
    priorAnalysis,
    facts: factsLines.length > 0 ? [`Canonical facts:\n${factsLines.join('\n')}`] : [],
    findings: findingsLines.length > 0 ? [`Findings:\n${findingsLines.join('\n')}`] : [],
    evidenceExcerpts:
      evidenceExcerpts.length > 0 ? [`Evidence excerpts (cite only these ids):\n${evidenceExcerpts.join('\n\n')}`] : [],
  }

  const blocks = buildContext(
    {
      findings: [...layers.knowledgeGaps, ...layers.surveySummary, ...layers.priorAnalysis, ...layers.facts, ...layers.findings],
      evidenceExcerpts: layers.evidenceExcerpts,
    },
    budget,
  )

  const text =
    blocks.filter(Boolean).join('\n\n') ||
    '- (no established facts yet — use warn blockquotes for any repository-specific claims)'

  return {
    text,
    layers,
    observedFindingCount,
    hasKnowledgeGaps: knowledgeGaps.length > 0,
  }
}

/** Compact facts/findings block for validation prompts (char-capped). */
export function buildValidationKnowledgeContext(
  input: Omit<KnowledgePromptInput, 'sectionHeading' | 'documentTitle'>,
  maxChars = 12_000,
): string {
  return buildDocumentKnowledgePack({ ...input, tokenBudget: Math.floor(maxChars / 4) }).text.slice(0, maxChars)
}

/** Fail-closed writer rules when knowledge is thin. */
export function documentGroundingRules(pack: KnowledgePromptPack): string {
  if (!pack.hasKnowledgeGaps) {
    return (
      'Ground every factual statement in the REPOSITORY KNOWLEDGE pack below. ' +
      'Clearly label inferred or proposed content. Do not cite evidence ids that are not in the pack.'
    )
  }
  return (
    'STRICT GROUNDING RULES (limited repository evidence):\n' +
    '- Do NOT invent file paths, APIs, class names, module names, or dependencies.\n' +
    '- For any topic without supporting fact or evidence in the pack, emit Markdown:\n' +
    '  > **Not established:** Not established from repository evidence\n' +
    '- Prefer UNKNOWN findings from the pack verbatim over speculation.\n' +
    '- Label inferred or proposed content explicitly in prose.\n' +
    '- Cite only evidence ids present in the pack.'
  )
}
