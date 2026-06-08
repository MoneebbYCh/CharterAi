import type { FormData } from '../types/form'
import type { PrdFormData } from '../types/prdForm'
import type { PrdSectionValidation } from '../types/prdForm'
import { PRD_SECTION_LABELS } from '../types/prdForm'

function isFilled(value: string): boolean {
  return value.trim().length > 0
}

function hasCompleteTableRow<T extends object>(rows: T[], requiredKeys: (keyof T)[]): boolean {
  return rows.some((row) =>
    requiredKeys.every((key) => isFilled(String((row as Record<string, string>)[key as string] ?? ''))),
  )
}

export function validatePrdSection1(data: PrdFormData): PrdSectionValidation {
  const missing: string[] = []
  const s = data.section1
  if (!isFilled(s.solutionOverview)) missing.push('Solution Overview')
  if (!hasCompleteTableRow(s.scopeItems, ['item', 'description'])) missing.push('At least one scope item')
  if (!hasCompleteTableRow(s.keyDecisions, ['decision', 'rationale'])) missing.push('At least one key decision')
  const total = 3
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validatePrdSection2(data: PrdFormData): PrdSectionValidation {
  const missing: string[] = []
  const s = data.section2
  if (!hasCompleteTableRow(s.businessGoals, ['goal', 'owner'])) missing.push('At least one business goal')
  if (!hasCompleteTableRow(s.successMetrics, ['metric', 'target'])) missing.push('At least one success metric')
  if (!hasCompleteTableRow(s.outOfScope, ['item'])) missing.push('At least one out-of-scope item')
  const total = 3
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validatePrdSection3(data: PrdFormData): PrdSectionValidation {
  const missing: string[] = []
  const s = data.section3
  if (!hasCompleteTableRow(s.personas, ['persona', 'description'])) {
    missing.push('At least one complete persona row (name and description)')
  }
  const total = 1
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validatePrdSection4(data: PrdFormData): PrdSectionValidation {
  const missing: string[] = []
  const s = data.section4
  if (!hasCompleteTableRow(s.features, ['epic', 'userStory'])) {
    missing.push('At least one complete feature row (epic and user story)')
  }
  const total = 1
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validatePrdSection5(data: PrdFormData): PrdSectionValidation {
  const missing: string[] = []
  const s = data.section5
  if (!hasCompleteTableRow(s.performanceRequirements, ['requirement'])) missing.push('At least one performance requirement')
  if (!hasCompleteTableRow(s.securityRequirements, ['requirement'])) missing.push('At least one security requirement')
  const total = 2
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validatePrdSection6(data: PrdFormData, charterData: FormData | null): PrdSectionValidation {
  const missing: string[] = []
  const s = data.section6
  const requiresAi = charterData?.section1.includesAiWork ?? true

  if (!hasCompleteTableRow(s.dataSources, ['source', 'type'])) missing.push('At least one data source')
  if (!hasCompleteTableRow(s.dataAccessRequirements, ['role', 'accessLevel'])) missing.push('At least one data access row')

  if (requiresAi && !isFilled(s.aiModelSelectionCriteria)) missing.push('AI Model Selection Criteria')
  if (requiresAi && !isFilled(s.aiEvalCriteria)) missing.push('AI Evaluation Criteria')

  const aiCount = requiresAi ? 2 : 0
  const total = 2 + aiCount
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validatePrdSection7(data: PrdFormData): PrdSectionValidation {
  const missing: string[] = []
  const s = data.section7
  if (!isFilled(s.releaseStrategy)) missing.push('Release Strategy')
  if (!hasCompleteTableRow(s.keyMilestones, ['milestone', 'date'])) missing.push('At least one key milestone')
  if (!hasCompleteTableRow(s.risks, ['risk', 'likelihood', 'impact'])) {
    missing.push('At least one complete risk row')
  }
  const total = 3
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validatePrdSection8(data: PrdFormData): PrdSectionValidation {
  const missing: string[] = []
  const s = data.section8
  if (!s.prdStatus) missing.push('PRD Status')
  const hasSignatures = s.signatures.filter(
    (sig) => isFilled(sig.name) && isFilled(sig.role) && isFilled(sig.date),
  ).length >= 2
  if (!hasSignatures) missing.push('Both signatures required')
  const total = 2
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validatePrdSections1to7(prdData: PrdFormData, charterData: FormData | null): boolean {
  return [
    validatePrdSection1,
    validatePrdSection2,
    validatePrdSection3,
    validatePrdSection4,
    validatePrdSection5,
    (d: PrdFormData) => validatePrdSection6(d, charterData),
    validatePrdSection7,
  ].every((fn) => fn(prdData).complete)
}

export function getPrdSectionValidator(sectionId: number, charterData: FormData | null) {
  const validators: ((data: PrdFormData) => PrdSectionValidation)[] = [
    validatePrdSection1,
    validatePrdSection2,
    validatePrdSection3,
    validatePrdSection4,
    validatePrdSection5,
    (data) => validatePrdSection6(data, charterData),
    validatePrdSection7,
    validatePrdSection8,
  ]
  return validators[sectionId - 1]
}

export function getPrdOverallProgress(prdData: PrdFormData, charterData: FormData | null): { filled: number; total: number; percent: number } {
  const validators = [
    validatePrdSection1,
    validatePrdSection2,
    validatePrdSection3,
    validatePrdSection4,
    validatePrdSection5,
    (data: PrdFormData) => validatePrdSection6(data, charterData),
    validatePrdSection7,
  ]
  let filled = 0
  let total = 0
  for (const v of validators) {
    const result = v(prdData)
    filled += result.filled
    total += result.total
  }
  return {
    filled,
    total,
    percent: total === 0 ? 0 : Math.round((filled / total) * 100),
  }
}

export function getPrdIncompleteSections1to7(prdData: PrdFormData, charterData: FormData | null): { id: number; title: string; missing: string[] }[] {
  const validators = [
    validatePrdSection1,
    validatePrdSection2,
    validatePrdSection3,
    validatePrdSection4,
    validatePrdSection5,
    (data: PrdFormData) => validatePrdSection6(data, charterData),
    validatePrdSection7,
  ]
  const incomplete: { id: number; title: string; missing: string[] }[] = []
  validators.forEach((fn, i) => {
    const result = fn(prdData)
    if (!result.complete) {
      incomplete.push({
        id: i + 1,
        title: PRD_SECTION_LABELS[i].title,
        missing: result.missing,
      })
    }
  })
  return incomplete
}

export function getPrdGateStatus(data: PrdFormData): PrdFormData['section8']['prdStatus'] {
  return data.section8.prdStatus || 'draft'
}

export function isPrdApproved(data: PrdFormData): boolean {
  return data.section8.prdStatus === 'approved' && validatePrdSection8(data).complete
}
