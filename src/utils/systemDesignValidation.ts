import type { SectionValidation, SystemDesignFormData } from '../types/systemDesignForm'
import { SYSTEM_DESIGN_SECTION_LABELS } from '../types/systemDesignForm'

function isFilled(value: string): boolean {
  return value.trim().length > 0
}

function hasCompleteTableRow<T extends object>(rows: T[], requiredKeys: (keyof T)[]): boolean {
  return rows.some((row) =>
    requiredKeys.every((key) => isFilled(String((row as Record<string, string>)[key as string] ?? ''))),
  )
}

export function validateSection1(data: SystemDesignFormData): SectionValidation {
  const missing: string[] = []
  const s = data.section1
  if (!isFilled(s.architectureSummary)) missing.push('Architecture Summary')
  if (!hasCompleteTableRow(s.components, ['name', 'responsibility'])) missing.push('At least one component')
  if (!isFilled(s.dataFlow)) missing.push('Data Flow')
  const total = 3
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validateSection2(data: SystemDesignFormData): SectionValidation {
  const missing: string[] = []
  const s = data.section2
  if (!hasCompleteTableRow(s.dataStores, ['store', 'type'])) missing.push('At least one data store')
  if (!hasCompleteTableRow(s.dataModels, ['entity'])) missing.push('At least one data model')
  const total = 2
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validateSection3(data: SystemDesignFormData): SectionValidation {
  const missing: string[] = []
  const s = data.section3
  if (!isFilled(s.modelSelection)) missing.push('Model Selection')
  if (!isFilled(s.evalStrategy)) missing.push('Evaluation Strategy')
  const total = 2
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validateSection4(data: SystemDesignFormData): SectionValidation {
  const missing: string[] = []
  const s = data.section4
  if (!hasCompleteTableRow(s.endpoints, ['method', 'path'])) missing.push('At least one endpoint')
  const total = 1
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validateSection5(data: SystemDesignFormData): SectionValidation {
  const missing: string[] = []
  const s = data.section5
  if (!isFilled(s.hostingEnvironment)) missing.push('Hosting Environment')
  if (!isFilled(s.scalingStrategy)) missing.push('Scaling Strategy')
  const total = 2
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

export function validateSection6(data: SystemDesignFormData): SectionValidation {
  const missing: string[] = []
  const s = data.section6
  if (!s.designStatus) missing.push('Design Status')
  const hasSignatures =
    s.signatures.filter((sig) => isFilled(sig.name) && isFilled(sig.role) && isFilled(sig.date)).length >= 2
  if (!hasSignatures) missing.push('Both signatures required')
  const total = 2
  return { complete: missing.length === 0, total, filled: total - missing.length, missing }
}

const SECTION_VALIDATORS: ((data: SystemDesignFormData) => SectionValidation)[] = [
  validateSection1,
  validateSection2,
  validateSection3,
  validateSection4,
  validateSection5,
  validateSection6,
]

export function getSectionValidator(sectionId: number) {
  return SECTION_VALIDATORS[sectionId - 1]
}

export function validateSections1to5(data: SystemDesignFormData): boolean {
  return SECTION_VALIDATORS.slice(0, 5).every((fn) => fn(data).complete)
}

export function getOverallProgress(
  data: SystemDesignFormData,
): { filled: number; total: number; percent: number } {
  let filled = 0
  let total = 0
  for (const fn of SECTION_VALIDATORS.slice(0, 5)) {
    const result = fn(data)
    filled += result.filled
    total += result.total
  }
  return { filled, total, percent: total === 0 ? 0 : Math.round((filled / total) * 100) }
}

export function getIncompleteSections1to5(
  data: SystemDesignFormData,
): { id: number; title: string; missing: string[] }[] {
  const incomplete: { id: number; title: string; missing: string[] }[] = []
  SECTION_VALIDATORS.slice(0, 5).forEach((fn, i) => {
    const result = fn(data)
    if (!result.complete) {
      incomplete.push({ id: i + 1, title: SYSTEM_DESIGN_SECTION_LABELS[i].title, missing: result.missing })
    }
  })
  return incomplete
}

export function getGateStatus(data: SystemDesignFormData): SystemDesignFormData['section6']['designStatus'] {
  return data.section6.designStatus || 'draft'
}

export function isDesignApproved(data: SystemDesignFormData): boolean {
  return data.section6.designStatus === 'approved' && validateSection6(data).complete
}
