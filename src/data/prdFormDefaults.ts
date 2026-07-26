import type { PrdFormData } from '../types/prdForm'

export const PRD_STORAGE_KEY = 'charter-ai-prd-v1'

export function createInitialPrdFormData(): PrdFormData {
  return {
    section1: {
      solutionOverview: '',
      scopeItems: [{ item: '', description: '', priority: '' }],
      keyDecisions: [{ decision: '', rationale: '', owner: '' }],
    },
    section2: {
      businessGoals: [{ goal: '', owner: '', priority: '' }],
      successMetrics: [{ metric: '', target: '', measurement: '' }],
      outOfScope: [{ item: '', rationale: '' }],
    },
    section3: {
      personas: [{ persona: '', description: '', goals: '', painPoints: '' }],
    },
    section4: {
      features: [{ epic: '', userStory: '', priority: '', acceptanceCriteria: '', notes: '' }],
    },
    section5: {
      performanceRequirements: [{ requirement: '', specification: '' }],
      securityRequirements: [{ requirement: '', specification: '' }],
      scalabilityRequirements: [{ requirement: '', specification: '' }],
      complianceRequirements: [{ requirement: '', specification: '' }],
      usabilityRequirements: [{ requirement: '', specification: '' }],
    },
    section6: {
      dataSources: [{ source: '', type: '', volume: '', accessMethod: '' }],
      dataSchemaFormat: '',
      dataVolumeEstimate: '',
      dataAccessRequirements: [{ role: '', accessLevel: '', condition: '' }],
      aiModelSelectionCriteria: '',
      aiEvalCriteria: '',
      aiFallbackBehavior: '',
      aiLabelingAnnotationNeeds: '',
      aiBiasFairness: '',
    },
    section7: {
      integrationPoints: [{ system: '', integrationType: '', protocol: '' }],
      thirdPartyDependencies: [{ dependency: '', version: '', notes: '' }],
      releaseStrategy: '',
      keyMilestones: [{ milestone: '', date: '', owner: '' }],
      rollbackPlan: '',
      risks: [{ risk: '', likelihood: '', impact: '', mitigation: '' }],
      openQuestions: [{ question: '', owner: '', dueDate: '', status: '' }],
    },
    section8: {
      prdStatus: '',
      reviewNotes: '',
      signatures: [
        { name: '', role: '', signature: '', date: '' },
        { name: '', role: '', signature: '', date: '' },
      ],
    },
  }
}
