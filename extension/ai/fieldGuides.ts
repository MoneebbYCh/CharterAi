export const CHARTER_GUIDE = `PROJECT CHARTER — PMI-ALIGNED AUTHORIZATION DOCUMENT

Purpose of this document (not just a template):
A project charter formally authorizes the project to exist and gives the lead authority
to spend resources on it. Before the charter it is an idea; after it, it is a sanctioned
project with a named owner, a boundary, and a way to know if it worked.

DEFAULT DRAFTING BRIEF:
Draft a complete charter that answers: why authorize this, who owns it, what is in/out
of bounds, how success will be judged, and what could kill it.

Required sections on any full draft (in roughly this order):
1. Title + purpose/justification callout (business problem, not a feature list)
2. Objectives & success criteria → kpiGrid (specific & measurable)
3. High-level scope → scopeBounds (IN and explicit OUT — exclusions are mandatory)
4. Key stakeholders → stakeholderTable (sponsor, PM/owner, major stakeholders, concern/authority)
5. High-level milestones / timeline (heading + short bullets or numbered list — checkpoints only, not a full schedule)
6. High-level budget / resources (heading + paragraph or bullets)
7. Assumptions & constraints (heading + bullets; use warn callout for hard constraints)
8. High-level risks → riskList
9. Approval / sign-off (callout listing who must approve for this to be real)

Quality bar (what separates a good charter from a checkbox one):
- Specificity: success criteria that two people could agree on six months later.
  Bad: "modernize the platform." Good: "cut p95 checkout latency from 2.1s to <800ms."
- Honesty about scope boundaries: always state what is excluded.
- Authority: name who can spend / decide; do not leave ownership implied.

Elicitation behavior:
If the user gives a vague ask ("build X", "modernize Y"), ask or infer toward:
- What business problem fails if we do nothing?
- What measurable outcome proves success?
- What is explicitly out of scope?
- Who is sponsor vs delivery owner?
- What hard date, budget, or dependency constrains us?
Prefer filling a strong draft with clear placeholders over omitting required sections.`


export const PRD_GUIDE = `PRD FIELDS:

Section 1 - Executive Summary (section1):
  solutionOverview (string): Solution overview
  scopeItems (array of {item, description, priority (H|M|L)}): Scope items
  keyDecisions (array of {decision, rationale, owner}): Key decisions

Section 2 - Goals & Scope (section2):
  businessGoals (array of {goal, owner, priority (H|M|L)}): Business goals
  successMetrics (array of {metric, target, measurement}): Success metrics
  outOfScope (array of {item, rationale}): Out of scope items

Section 3 - User Personas (section3):
  personas (array of {persona, description, goals, painPoints}): User personas

Section 4 - Functional Requirements (section4):
  features (array of {epic, userStory, priority (H|M|L), acceptanceCriteria, notes}): Features & stories

Section 5 - Non-Functional Requirements (section5):
  performanceRequirements (array of {requirement, specification})
  securityRequirements (array of {requirement, specification})
  scalabilityRequirements (array of {requirement, specification})
  complianceRequirements (array of {requirement, specification})
  usabilityRequirements (array of {requirement, specification})

Section 6 - Data & AI (section6):
  dataSources (array of {source, type, volume, accessMethod})
  dataSchemaFormat (string): Schema format
  dataVolumeEstimate (string): Volume estimate
  dataAccessRequirements (array of {role, accessLevel, condition})
  aiModelSelectionCriteria (string): Model selection criteria
  aiEvalCriteria (string): Evaluation criteria
  aiFallbackBehavior (string): Fallback behavior
  aiLabelingAnnotationNeeds (string): Labeling needs
  aiBiasFairness (string): Bias & fairness

Section 7 - Rollout & Integrations (section7):
  integrationPoints (array of {system, integrationType, protocol}): Integration points
  thirdPartyDependencies (array of {dependency, version, notes}): Third-party deps
  releaseStrategy (string): Release strategy
  keyMilestones (array of {milestone, date, owner}): Milestones
  rollbackPlan (string): Rollback plan
  risks (array of {risk, likelihood (H|M|L), impact (H|M|L), mitigation}): Risks
  openQuestions (array of {question, owner, dueDate, status}): Open questions

Section 8 - Review & Sign-off (section8):
  prdStatus ("draft"|"in-review"|"approved"|"needs-revision"|""): PRD status
  reviewNotes (string): Review notes
  signatures (array of {name, role, signature, date}): Signatures`


export const SYSTEM_DESIGN_GUIDE = `SYSTEM DESIGN FIELDS:

Section 1 - Architecture Overview (section1):
  architectureSummary (string): High-level architecture description
  components (array of {name, responsibility, technology}): Main components/services
  dataFlow (string): How data moves through the system
  keyDecisions (array of {decision, rationale, alternatives}): Key design decisions

Section 2 - Data Design (section2):
  dataStores (array of {store, type, purpose}): Databases/caches/queues
  dataModels (array of {entity, fields, notes}): Core entities and their fields
  dataFlowDetails (string): Detailed data lifecycle
  retentionPolicy (string): Retention & deletion policy

Section 3 - Model & AI Design (section3):
  modelSelection (string): Which model(s) will be used
  modelRationale (string): Why this model
  trainingApproach (string): Training/fine-tuning approach
  evalStrategy (string): How model quality is measured
  fallbackBehavior (string): Behavior on failure/low confidence
  promptStrategy (string): Prompting/interaction strategy

Section 4 - APIs & Interfaces (section4):
  endpoints (array of {method, path, purpose, auth}): API endpoints
  externalIntegrations (array of {service, purpose, protocol}): External integrations
  contracts (string): Request/response contracts & schemas

Section 5 - Infrastructure & Deployment (section5):
  hostingEnvironment (string): Where it runs
  scalingStrategy (string): How it scales
  cicdPipeline (string): Build & deployment pipeline
  monitoring (string): Logging, metrics, alerting
  securityMeasures (array of {measure, description}): Security measures
  estimatedCost (string): Rough infra cost estimate

Section 6 - Review & Sign-off (section6):
  designStatus ("draft"|"in-review"|"approved"|"needs-revision"|""): Design status
  reviewNotes (string): Review notes
  signatures (array of {name, role, signature, date}): Signatures`


export function getFieldGuide(phase: string): string {
  if (phase === 'project-charter') return CHARTER_GUIDE
  if (phase === 'prd') return PRD_GUIDE
  if (phase === 'system-design') return SYSTEM_DESIGN_GUIDE
  return ''
}
