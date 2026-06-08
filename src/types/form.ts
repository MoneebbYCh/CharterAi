export type ProjectType = 'client-services' | 'internal-product' | ''
export type Priority = 'P0' | 'P1' | 'P2' | 'P3' | ''
export type HML = 'H' | 'M' | 'L' | ''
export type AssumptionClass = 'KNOWN' | 'UNKNOWN' | 'RISKY' | ''
export type GateDecision = 'approved' | 'needs-revision' | 'rejected' | ''


export interface PerformanceMetricRow {
  metric: string
  minimumThreshold: string
  target: string
  measurementMethod: string
}

export interface StakeholderRow {
  nameRole: string
  interestLevel: HML
  influence: HML
  keyConcern: string
}

export interface AssumptionRow {
  assumption: string
  classification: AssumptionClass
  ifWrongImpact: string
}

export interface RiskRow {
  risk: string
  likelihood: HML
  impact: HML
  mitigation: string
}

export interface OpenQuestionRow {
  question: string
  owner: string
  dueDate: string
  status: string
}

export interface SignatureRow {
  name: string
  role: string
  signature: string
  date: string
}

export interface FormData {
  section1: {
    projectName: string
    projectCode: string
    dateSubmitted: string
    submittedBy: string
    aiTeamLead: string
    targetStartDate: string
    requestedDeliveryDate: string
    projectType: ProjectType
    priority: Priority
    priorityJustification: string
    budgetEstimate: string
    teamSkillsRequired: string
    sponsorDecisionMaker: string
    keyMilestones: string
    includesAiWork: boolean
  }
  section2: {
    coreProblem: string
    whoAffected: string
    currentWorkaround: string
    costOfInaction: string
    primaryObjective: string
    secondaryObjectives: string
    nonGoals: string
  }
  section3: {
    primaryKpi: string
    targetValue: string
    measurementMethod: string
    performanceMetrics: PerformanceMetricRow[]
    acceptanceCriterion1: string
    acceptanceCriterion2: string
    acceptanceCriterion3: string
    definitionOfDone: {
      primaryKpiMet: boolean
      acceptanceVerified: boolean
      evalReportSigned: boolean
      stakeholderAccepted: boolean
      deploymentChecklist: boolean
      documentationHandover: boolean
    }
  }
  section4: {
    stakeholders: StakeholderRow[]
    elicitationSummary: string
    assumptions: AssumptionRow[]
    artifactLinks: string
  }
  section5: {
    dataRequired: string
    dataOwnerAccess: string
    dataCurrentState: string
    dataVolume: string
    dataReadiness: {
      availableNow: boolean
      accessNeedsArrangement: boolean
      partiallyAvailable: boolean
      doesNotExist: boolean
      qualityUnknown: boolean
      syntheticNeeded: boolean
    }
    dataSensitivity: string
    aiWorkTypes: {
      promptEngineering: boolean
      fineTuning: boolean
      customTraining: boolean
      rag: boolean
      agentic: boolean
      classicalMl: boolean
      computerVision: boolean
      nlp: boolean
      dataPipeline: boolean
      other: boolean
    }
    aiWorkOther: string
    techStackConstraints: string
    deploymentTarget: string
    latencyRequirement: string
    throughputRequirement: string
    costPerCall: string
    uptimeSla: string
    infrastructureConstraints: string
    acceptableErrorRate: string
    whenModelWrong: string
    whenUnavailable: string
    biasFairness: string
  }
  section6A: {
    clientName: string
    clientPoc: string
    contractScope: string
    writtenConfirmation: string
    deliverableFormat: string
    clientApprover: string
    infrastructureDependencies: string
    commercialConstraints: string
    dependencies: string
    artifactLinks: string
  }
  section6B: {
    productArea: string
    roadmapStatus: 'on-roadmap' | 'proposing' | 'hotfix' | 'spike' | ''
    internalStakeholder: string
    userResearchEvidence: string
    appetite: 'small' | 'medium' | 'large' | 'spike' | ''
    dependencies: string
    artifactLinks: string
  }
  section7: {
    timeConstraints: string
    resourceConstraints: string
    technologyConstraints: string
    budgetConstraints: string
    risks: RiskRow[]
    openQuestions: OpenQuestionRow[]
  }
  section8: {
    definitionOfReady: Record<string, boolean>
    gateDecision: GateDecision
    gateReviewNotes: string
    signatures: SignatureRow[]
  }
}
