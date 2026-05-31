import type { FormData, RACIRow } from '../types/form'

const RACI_ACTIVITIES = [
  'Problem Definition',
  'Data Access & Prep',
  'Model Design',
  'Evaluation Criteria',
  'Client/Stakeholder Sign-off',
  'Deployment Decision',
] as const

export const STORAGE_KEY = 'ascen-project-charter-v1'

export const SECTION_LABELS = [
  { id: 1, title: 'Project Identity', subtitle: 'Classification' },
  { id: 2, title: 'Problem Statement', subtitle: 'Business Context' },
  { id: 3, title: 'Success Metrics', subtitle: 'Acceptance Criteria' },
  { id: 4, title: 'BABOK Elicitation', subtitle: 'Stakeholder Alignment' },
  { id: 5, title: 'AI Requirements', subtitle: 'Data · Model · Fallback' },
  { id: 6, title: 'Project Context', subtitle: '6A / 6B Branching' },
  { id: 7, title: 'Constraints & Risks', subtitle: 'Open Questions' },
  { id: 8, title: 'Gate Review', subtitle: 'Definition of Ready' },
] as const

export const GATE_REQUIREMENTS = {
  requirementsCompleteness: [
    { id: 'problemConfirmed', label: 'Problem statement is written in clear, non-technical language and has been confirmed by the requestor' },
    { id: 'smartObjectives', label: 'Business objectives are SMART and linked to a measurable outcome' },
    { id: 'nonGoalsAgreed', label: 'Non-goals are explicitly listed and agreed upon by the stakeholder' },
    { id: 'mandatoryFields', label: 'All mandatory fields (*) in this document are completed' },
    { id: 'successMetrics', label: 'Success metrics are defined, measurable, and agreed upon before design begins' },
    { id: 'acceptanceCriteria', label: 'Acceptance criteria are written in testable, unambiguous language' },
  ],
  aiReadiness: [
    { id: 'dataSource', label: 'Data source is identified, access is confirmed or access timeline is agreed upon' },
    { id: 'dataQuality', label: 'Data quality has been assessed or a data audit is scheduled as the first task' },
    { id: 'performanceThresholds', label: 'Model performance thresholds (Section 3.2) are defined and agreed upon' },
    { id: 'fallbackBehavior', label: 'Fallback behavior when the model fails is explicitly defined and approved' },
    { id: 'latencyThroughput', label: 'Latency, throughput, and cost constraints are documented' },
    { id: 'compliance', label: 'Compliance and data sensitivity requirements have been reviewed' },
    { id: 'biasFairness', label: 'Bias and fairness considerations have been discussed and documented' },
  ],
  stakeholderAlignment: [
    { id: 'elicitationSession', label: 'At least one structured elicitation session has been completed and documented (Section 4)' },
    { id: 'stakeholdersIdentified', label: 'All key stakeholders are identified in the stakeholder register (Section 4.1)' },
    { id: 'assumptionsChallenged', label: 'All high-risk assumptions have been challenged and either validated or escalated' },
    { id: 'openQuestionsOwned', label: 'Open questions in Section 7.4 have owners and due dates assigned' },
    { id: 'stakeholderReviewed', label: 'Client or internal stakeholder has reviewed this document and confirmed accuracy' },
    { id: 'raciFilled', label: 'RACI is filled and all parties understand their role' },
  ],
  commercialContractual: [
    { id: 'writtenConfirmation', label: 'Written client confirmation of the request has been received and attached' },
    { id: 'scopeConfirmed', label: 'Scope is confirmed as in-contract, or a new SOW has been initiated' },
    { id: 'clientPoc', label: 'Client POC and approval authority are identified' },
    { id: 'deliverableAgreed', label: 'Deliverable format and completion criteria are agreed upon in writing' },
  ],
} as const

function createRaciRows(): RACIRow[] {
  return RACI_ACTIVITIES.map((activity) => ({
    activity,
    aiLead: '',
    aiEng1: '',
    aiEng2: '',
    stakeholder: '',
  }))
}

function createGateChecklist() {
  const toRecord = (items: readonly { id: string }[]) =>
    Object.fromEntries(items.map((item) => [item.id, false]))

  return {
    requirementsCompleteness: toRecord(GATE_REQUIREMENTS.requirementsCompleteness),
    aiReadiness: toRecord(GATE_REQUIREMENTS.aiReadiness),
    stakeholderAlignment: toRecord(GATE_REQUIREMENTS.stakeholderAlignment),
    commercialContractual: toRecord(GATE_REQUIREMENTS.commercialContractual),
  }
}

export function createInitialFormData(): FormData {
  return {
    section1: {
      projectName: '',
      projectCode: '',
      dateSubmitted: new Date().toISOString().split('T')[0],
      submittedBy: '',
      aiTeamLead: '',
      targetStartDate: '',
      requestedDeliveryDate: '',
      projectType: '',
      priority: '',
      priorityJustification: '',
    },
    section2: {
      coreProblem: '',
      whoAffected: '',
      currentWorkaround: '',
      costOfInaction: '',
      primaryObjective: '',
      secondaryObjectives: '',
      nonGoals: '',
    },
    section3: {
      primaryKpi: '',
      targetValue: '',
      measurementMethod: '',
      performanceMetrics: [{ metric: '', minimumThreshold: '', target: '', measurementMethod: '' }],
      acceptanceCriterion1: '',
      acceptanceCriterion2: '',
      acceptanceCriterion3: '',
      definitionOfDone: {
        primaryKpiMet: false,
        acceptanceVerified: false,
        evalReportSigned: false,
        stakeholderAccepted: false,
        deploymentChecklist: false,
        documentationHandover: false,
      },
    },
    section4: {
      stakeholders: [{ nameRole: '', interestLevel: '', influence: '', keyConcern: '' }],
      techniques: {
        structuredInterview: false,
        workshop: false,
        fiveWhys: false,
        jtbd: false,
        assumptionMapping: false,
        processWalkthrough: false,
        documentAnalysis: false,
        observation: false,
      },
      elicitationSummary: '',
      assumptions: [{ assumption: '', classification: '', ifWrongImpact: '' }],
    },
    section5: {
      dataRequired: '',
      dataOwnerAccess: '',
      dataCurrentState: '',
      dataVolume: '',
      dataReadiness: {
        availableNow: false,
        accessNeedsArrangement: false,
        partiallyAvailable: false,
        doesNotExist: false,
        qualityUnknown: false,
        syntheticNeeded: false,
      },
      dataSensitivity: '',
      aiWorkTypes: {
        promptEngineering: false,
        fineTuning: false,
        customTraining: false,
        rag: false,
        agentic: false,
        classicalMl: false,
        computerVision: false,
        nlp: false,
        dataPipeline: false,
        other: false,
      },
      aiWorkOther: '',
      techStackConstraints: '',
      deploymentTarget: '',
      latencyRequirement: '',
      throughputRequirement: '',
      costPerCall: '',
      uptimeSla: '',
      infrastructureConstraints: '',
      acceptableErrorRate: '',
      whenModelWrong: '',
      whenUnavailable: '',
      confidenceHandling: {
        confidenceScore: false,
        lowConfidenceReview: false,
        lowConfidenceReject: false,
        allLogged: false,
        userFeedback: false,
        autoApproved: false,
      },
      biasFairness: '',
    },
    section6A: {
      clientName: '',
      clientPoc: '',
      contractScope: '',
      writtenConfirmation: '',
      deliverableFormat: '',
      clientApprover: '',
      infrastructureDependencies: '',
      commercialConstraints: '',
    },
    section6B: {
      productArea: '',
      roadmapStatus: '',
      internalStakeholder: '',
      userResearchEvidence: '',
      appetite: '',
    },
    section7: {
      timeConstraints: '',
      resourceConstraints: '',
      technologyConstraints: '',
      budgetConstraints: '',
      risks: [{ risk: '', likelihood: '', impact: '', mitigation: '' }],
      raci: createRaciRows(),
      openQuestions: [{ question: '', owner: '', dueDate: '', status: '' }],
    },
    section8: {
      ...createGateChecklist(),
      gateDecision: '',
      gateReviewNotes: '',
      signatures: [
        { name: '', role: '', signature: '', date: '' },
        { name: '', role: '', signature: '', date: '' },
        { name: '', role: '', signature: '', date: '' },
      ],
    },
  }
}
