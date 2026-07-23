import type { FormData } from '../types/form'
import { SECTION_LABELS } from '../data/formDefaults'

function isFilled(value: string): boolean {
  return value.trim().length > 0
}

function hasTableRow(values: string[]): boolean {
  return values.some((v) => v.trim().length > 0)
}

function hasCompleteTableRow<T extends object>(rows: T[], requiredKeys: (keyof T)[]): boolean {
  return rows.some((row) =>
    requiredKeys.every((key) => isFilled(String((row as Record<string, string>)[key as string] ?? ''))),
  )
}

export interface SectionValidation {
  complete: boolean
  total: number
  filled: number
  missing: string[]
}

export function validateSection1(data: FormData): SectionValidation {
  const missing: string[] = []
  const s = data.section1

  if (!isFilled(s.projectName)) missing.push('Project Name')
  if (!isFilled(s.dateSubmitted)) missing.push('Date Submitted')
  if (!isFilled(s.submittedBy)) missing.push('Submitted By')
  if (!s.projectType) missing.push('Project Type')
  if (!s.priority) missing.push('Priority Classification')
  if (!isFilled(s.priorityJustification)) missing.push('Priority Justification')
  if (!isFilled(s.budgetEstimate)) missing.push('Budget Estimate')
  if (!isFilled(s.sponsorDecisionMaker)) missing.push('Sponsor / Decision Maker')

  const total = 8
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validateSection2(data: FormData): SectionValidation {
  const missing: string[] = []
  const s = data.section2

  if (!isFilled(s.coreProblem)) missing.push('Core Problem')
  if (!isFilled(s.whoAffected)) missing.push('Who is Affected')
  if (!isFilled(s.costOfInaction)) missing.push('Cost of Inaction')
  if (!isFilled(s.primaryObjective)) missing.push('Primary Business Objective')
  if (!isFilled(s.nonGoals)) missing.push('Non-Goals')

  const total = 5
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validateSection3(data: FormData): SectionValidation {
  const missing: string[] = []
  const s = data.section3

  if (!isFilled(s.primaryKpi)) missing.push('Primary KPI')
  if (!isFilled(s.targetValue)) missing.push('Target Value')
  if (!isFilled(s.measurementMethod)) missing.push('Measurement Method')
  if (!isFilled(s.acceptanceCriterion1)) missing.push('Acceptance Criterion 1')

  if (!hasCompleteTableRow(s.performanceMetrics, ['metric', 'minimumThreshold', 'target'])) {
    missing.push('At least one complete performance metrics row (metric, minimum, and target)')
  }

  const total = 5
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validateSection4(data: FormData): SectionValidation {
  const missing: string[] = []
  const s = data.section4

  if (
    !hasCompleteTableRow(s.stakeholders, ['nameRole', 'interestLevel', 'influence'])
  ) {
    missing.push('At least one complete stakeholder row (name, interest, and influence)')
  }

  if (!isFilled(s.elicitationSummary)) missing.push('Elicitation Session Summary')

  if (!hasCompleteTableRow(s.assumptions, ['assumption', 'classification'])) {
    missing.push('At least one complete assumption row (assumption and classification)')
  }

  const total = 3
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validateSection5(data: FormData): SectionValidation {
  const missing: string[] = []
  const s = data.section5
  const requiresAi = data.section1.includesAiWork

  if (!isFilled(s.dataRequired)) missing.push('Data Required')
  if (!isFilled(s.dataOwnerAccess)) missing.push('Data Owner & Access')
  if (!isFilled(s.dataCurrentState)) missing.push('Current State of Data')
  if (!isFilled(s.dataSensitivity)) missing.push('Data Sensitivity & Compliance')
  if (requiresAi && !Object.values(s.aiWorkTypes).some(Boolean)) missing.push('AI Work Type')
  if (!isFilled(s.deploymentTarget)) missing.push('Deployment Target')
  if (!isFilled(s.acceptableErrorRate)) missing.push('Acceptable Error Rate')
  if (!isFilled(s.whenModelWrong)) missing.push('When Model is Wrong')
  if (!isFilled(s.whenUnavailable)) missing.push('When System is Unavailable')

  const total = requiresAi ? 9 : 8
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validateSection6(data: FormData): SectionValidation {
  const missing: string[] = []
  const type = data.section1.projectType

  if (type === 'client-services') {
    const s = data.section6A
    if (!isFilled(s.clientName)) missing.push('Client Name')
    if (!isFilled(s.clientPoc)) missing.push('Client POC')
    if (!isFilled(s.contractScope)) missing.push('Contract Scope')
    if (!isFilled(s.deliverableFormat)) missing.push('Deliverable Format')
    if (!isFilled(s.clientApprover)) missing.push('Client Approver')
  } else if (type === 'internal-product') {
    const s = data.section6B
    if (!isFilled(s.productArea)) missing.push('Product Area')
    if (!s.roadmapStatus) missing.push('Roadmap Status')
    if (!isFilled(s.internalStakeholder)) missing.push('Internal Stakeholder')
    if (!s.appetite) missing.push('Appetite')
  } else {
    missing.push('Project Type (Section 1)')
  }

  const total = type === 'client-services' ? 5 : 4
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validateSection7(data: FormData): SectionValidation {
  const missing: string[] = []
  const s = data.section7

  if (!isFilled(s.timeConstraints)) missing.push('Time Constraints')
  if (!isFilled(s.resourceConstraints)) missing.push('Resource Constraints')

  if (!hasCompleteTableRow(s.risks, ['risk', 'likelihood', 'impact', 'mitigation'])) {
    missing.push('At least one complete risk row (risk, likelihood, impact, and mitigation)')
  }

  if (!hasCompleteTableRow(s.openQuestions, ['question', 'owner', 'dueDate'])) {
    missing.push('At least one complete open question row (question, owner, and due date)')
  }

  const total = 4
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validateSection8(data: FormData): SectionValidation {
  const missing: string[] = []
  const s = data.section8

  const allChecked = (record: Record<string, boolean>, label: string) => {
    const values = Object.values(record)
    if (values.length === 0 || !values.every(Boolean)) {
      missing.push(label)
    }
  }

  allChecked(s.definitionOfReady, 'All Definition of Ready items')

  if (!s.gateDecision) missing.push('Gate Decision')

  const hasSignatures = s.signatures.filter(
    (sig) => isFilled(sig.name) && isFilled(sig.role) && isFilled(sig.date),
  ).length >= 2
  if (!hasSignatures) missing.push('Both signatures required')

  const total = 3
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validateSections1to7(data: FormData): boolean {
  return [
    validateSection1,
    validateSection2,
    validateSection3,
    validateSection4,
    validateSection5,
    validateSection6,
    validateSection7,
  ].every((fn) => fn(data).complete)
}

export type GateStatus = 'draft' | 'open' | 'approved' | 'needs-revision' | 'rejected'

export function isGateReviewComplete(data: FormData): boolean {
  return validateSection8(data).complete
}

export function isGateApproved(data: FormData): boolean {
  return data.section8.gateDecision === 'approved' && isGateReviewComplete(data)
}

export function isProjectCharterComplete(data: FormData): boolean {
  return isGateApproved(data)
}

export function getGateStatus(data: FormData): GateStatus {
  if (!validateSections1to7(data)) return 'draft'
  if (isGateApproved(data)) return 'approved'
  if (data.section8.gateDecision === 'needs-revision') return 'needs-revision'
  if (data.section8.gateDecision === 'rejected') return 'rejected'
  return 'open'
}

export function isPhaseUnlocked(phaseId: string, _data: FormData | null): boolean {
  if (phaseId === 'project-charter') return true
  if (phaseId === 'prd') return true // TEMP: unlocked for testing
  if (phaseId === 'system-design') return true // TEMP: unlocked for testing
  return false
}

export function getIncompleteSections1to7(data: FormData): { id: number; title: string; missing: string[] }[] {
  const validators = [
    validateSection1,
    validateSection2,
    validateSection3,
    validateSection4,
    validateSection5,
    validateSection6,
    validateSection7,
  ]

  const incomplete: { id: number; title: string; missing: string[] }[] = []
  validators.forEach((fn, i) => {
    const result = fn(data)
    if (!result.complete) {
      incomplete.push({
        id: i + 1,
        title: SECTION_LABELS[i].title,
        missing: result.missing,
      })
    }
  })
  return incomplete
}

export function getSectionValidator(sectionId: number) {
  const validators = [
    validateSection1,
    validateSection2,
    validateSection3,
    validateSection4,
    validateSection5,
    validateSection6,
    validateSection7,
    validateSection8,
  ]
  return validators[sectionId - 1]
}

export function getOverallProgress(data: FormData): { filled: number; total: number; percent: number } {
  const validators = [
    validateSection1,
    validateSection2,
    validateSection3,
    validateSection4,
    validateSection5,
    validateSection6,
    validateSection7,
  ]

  let filled = 0
  let total = 0
  for (const v of validators) {
    const result = v(data)
    filled += result.filled
    total += result.total
  }

  return {
    filled,
    total,
    percent: total === 0 ? 0 : Math.round((filled / total) * 100),
  }
}

export function hasTableContent(values: string[]): boolean {
  return hasTableRow(values)
}
