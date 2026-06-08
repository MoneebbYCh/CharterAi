import type { HML, RiskRow, OpenQuestionRow, SignatureRow } from './form'

export type PrdStatus = '' | 'draft' | 'in-review' | 'approved' | 'needs-revision'

export interface PrdSectionValidation {
  complete: boolean
  total: number
  filled: number
  missing: string[]
}

export interface PersonaRow {
  persona: string
  description: string
  goals: string
  painPoints: string
}

export interface FeatureRow {
  epic: string
  userStory: string
  priority: HML
  acceptanceCriteria: string
  notes: string
}

export interface ScopeItemRow {
  item: string
  description: string
  priority: HML
}

export interface DecisionRow {
  decision: string
  rationale: string
  owner: string
}

export interface GoalRow {
  goal: string
  owner: string
  priority: HML
}

export interface MetricRow {
  metric: string
  target: string
  measurement: string
}

export interface OutOfScopeRow {
  item: string
  rationale: string
}

export interface NfrRow {
  requirement: string
  specification: string
}

export interface DataSourceRow {
  source: string
  type: string
  volume: string
  accessMethod: string
}

export interface DataAccessRow {
  role: string
  accessLevel: string
  condition: string
}

export interface IntegrationRow {
  system: string
  integrationType: string
  protocol: string
}

export interface DependencyRow {
  dependency: string
  version: string
  notes: string
}

export interface MilestoneRow {
  milestone: string
  date: string
  owner: string
}

export const PRD_SECTION_LABELS = [
  { id: 1, title: 'Executive Summary', subtitle: 'Solution Overview' },
  { id: 2, title: 'Goals & Scope', subtitle: 'Metrics · Exclusions' },
  { id: 3, title: 'User Personas', subtitle: 'Actors & Archetypes' },
  { id: 4, title: 'Functional Requirements', subtitle: 'Features & Stories' },
  { id: 5, title: 'Non-Functional Requirements', subtitle: 'Performance · Security · Scale' },
  { id: 6, title: 'Data & AI Requirements', subtitle: 'Data · Model · Eval' },
  { id: 7, title: 'Rollout & Integrations', subtitle: 'Release Plan · Risks' },
  { id: 8, title: 'Review & Sign-off', subtitle: 'Approval' },
] as const

export interface PrdFormData {
  section1: {
    solutionOverview: string
    scopeItems: ScopeItemRow[]
    keyDecisions: DecisionRow[]
  }
  section2: {
    businessGoals: GoalRow[]
    successMetrics: MetricRow[]
    outOfScope: OutOfScopeRow[]
  }
  section3: {
    personas: PersonaRow[]
  }
  section4: {
    features: FeatureRow[]
  }
  section5: {
    performanceRequirements: NfrRow[]
    securityRequirements: NfrRow[]
    scalabilityRequirements: NfrRow[]
    complianceRequirements: NfrRow[]
    usabilityRequirements: NfrRow[]
  }
  section6: {
    dataSources: DataSourceRow[]
    dataSchemaFormat: string
    dataVolumeEstimate: string
    dataAccessRequirements: DataAccessRow[]
    aiModelSelectionCriteria: string
    aiEvalCriteria: string
    aiFallbackBehavior: string
    aiLabelingAnnotationNeeds: string
    aiBiasFairness: string
  }
  section7: {
    integrationPoints: IntegrationRow[]
    thirdPartyDependencies: DependencyRow[]
    releaseStrategy: string
    keyMilestones: MilestoneRow[]
    rollbackPlan: string
    risks: RiskRow[]
    openQuestions: OpenQuestionRow[]
  }
  section8: {
    prdStatus: PrdStatus
    reviewNotes: string
    signatures: SignatureRow[]
  }
}
