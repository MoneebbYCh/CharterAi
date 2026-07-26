import type { SystemDesignFormData } from '../types/systemDesignForm'

export const SYSTEM_DESIGN_STORAGE_KEY = 'charter-ai-system-design-v1'

export function createInitialSystemDesignFormData(): SystemDesignFormData {
  return {
    section1: {
      architectureSummary: '',
      components: [{ name: '', responsibility: '', technology: '' }],
      dataFlow: '',
      keyDecisions: [{ decision: '', rationale: '', alternatives: '' }],
    },
    section2: {
      dataStores: [{ store: '', type: '', purpose: '' }],
      dataModels: [{ entity: '', fields: '', notes: '' }],
      dataFlowDetails: '',
      retentionPolicy: '',
    },
    section3: {
      modelSelection: '',
      modelRationale: '',
      trainingApproach: '',
      evalStrategy: '',
      fallbackBehavior: '',
      promptStrategy: '',
    },
    section4: {
      endpoints: [{ method: '', path: '', purpose: '', auth: '' }],
      externalIntegrations: [{ service: '', purpose: '', protocol: '' }],
      contracts: '',
    },
    section5: {
      hostingEnvironment: '',
      scalingStrategy: '',
      cicdPipeline: '',
      monitoring: '',
      securityMeasures: [{ measure: '', description: '' }],
      estimatedCost: '',
    },
    section6: {
      designStatus: '',
      reviewNotes: '',
      signatures: [
        { name: '', role: '', signature: '', date: '' },
        { name: '', role: '', signature: '', date: '' },
      ],
    },
  }
}
