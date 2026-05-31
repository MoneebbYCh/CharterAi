export interface Phase {
  id: string
  number: number
  title: string
  subtitle: string
  description: string
  path: string
  active: boolean
}

export const PHASES: Phase[] = [
  {
    id: 'pre-system-design',
    number: 1,
    title: 'Pre-System Design',
    subtitle: 'Requirements & Project Charter',
    description: 'Intake form, elicitation, gate review — must pass before design begins.',
    path: '/pre-system-design',
    active: true,
  },
  {
    id: 'prd',
    number: 2,
    title: 'PRD Creation',
    subtitle: 'Product Requirements Document',
    description: 'Turn approved charter into a detailed PRD with scope, user stories, and specs.',
    path: '/prd',
    active: false,
  },
  {
    id: 'system-design',
    number: 3,
    title: 'System Design',
    subtitle: 'Architecture & Technical Spec',
    description: 'Data flows, model selection, infrastructure, APIs, and deployment plan.',
    path: '/system-design',
    active: false,
  },
  {
    id: 'dev',
    number: 4,
    title: 'Development',
    subtitle: 'Build & Integrate',
    description: 'Implementation, code review, integration, and internal demo.',
    path: '/dev',
    active: false,
  },
  {
    id: 'qa',
    number: 5,
    title: 'QA',
    subtitle: 'Test & Validate',
    description: 'Acceptance criteria verification, model eval, regression, and sign-off.',
    path: '/qa',
    active: false,
  },
  {
    id: 'post-dev',
    number: 6,
    title: 'Post Dev',
    subtitle: 'Deploy & Handover',
    description: 'Production deployment, monitoring, documentation, and stakeholder handover.',
    path: '/post-dev',
    active: false,
  },
]

export function getPhaseById(id: string): Phase | undefined {
  return PHASES.find((p) => p.id === id)
}
