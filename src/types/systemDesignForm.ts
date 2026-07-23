export type DesignStatus = '' | 'draft' | 'in-review' | 'approved' | 'needs-revision'

export interface SectionValidation {
  complete: boolean
  total: number
  filled: number
  missing: string[]
}

export interface ComponentRow {
  name: string
  responsibility: string
  technology: string
}

export interface DesignDecisionRow {
  decision: string
  rationale: string
  alternatives: string
}

export interface DataStoreRow {
  store: string
  type: string
  purpose: string
}

export interface DataModelRow {
  entity: string
  fields: string
  notes: string
}

export interface EndpointRow {
  method: string
  path: string
  purpose: string
  auth: string
}

export interface IntegrationRow {
  service: string
  purpose: string
  protocol: string
}

export interface SecurityMeasureRow {
  measure: string
  description: string
}

export interface SignatureRow {
  name: string
  role: string
  signature: string
  date: string
}

export const SYSTEM_DESIGN_SECTION_LABELS = [
  { id: 1, title: 'Architecture Overview', subtitle: 'Components · Data Flow' },
  { id: 2, title: 'Data Design', subtitle: 'Stores · Models · Retention' },
  { id: 3, title: 'Model & AI Design', subtitle: 'Selection · Eval · Fallback' },
  { id: 4, title: 'APIs & Interfaces', subtitle: 'Endpoints · Integrations' },
  { id: 5, title: 'Infrastructure & Deployment', subtitle: 'Hosting · CI/CD · Security' },
  { id: 6, title: 'Review & Sign-off', subtitle: 'Approval' },
] as const

export interface SystemDesignFormData {
  section1: {
    architectureSummary: string
    components: ComponentRow[]
    dataFlow: string
    keyDecisions: DesignDecisionRow[]
  }
  section2: {
    dataStores: DataStoreRow[]
    dataModels: DataModelRow[]
    dataFlowDetails: string
    retentionPolicy: string
  }
  section3: {
    modelSelection: string
    modelRationale: string
    trainingApproach: string
    evalStrategy: string
    fallbackBehavior: string
    promptStrategy: string
  }
  section4: {
    endpoints: EndpointRow[]
    externalIntegrations: IntegrationRow[]
    contracts: string
  }
  section5: {
    hostingEnvironment: string
    scalingStrategy: string
    cicdPipeline: string
    monitoring: string
    securityMeasures: SecurityMeasureRow[]
    estimatedCost: string
  }
  section6: {
    designStatus: DesignStatus
    reviewNotes: string
    signatures: SignatureRow[]
  }
}
