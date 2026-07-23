export const CHARTER_GUIDE = `PROJECT CHARTER FIELDS:

Section 1 - Project Identity (section1):
  projectName (string): Project name
  projectCode (string): Project code or ID
  dateSubmitted (string, YYYY-MM-DD): Date submitted
  submittedBy (string): Person who submitted
  aiTeamLead (string): AI team lead
  targetStartDate (string, YYYY-MM-DD): Target start date
  requestedDeliveryDate (string, YYYY-MM-DD): Requested delivery
  projectType ("client-services"|"internal-product"|""): Project type
  priority ("P0"|"P1"|"P2"|"P3"|""): Priority level
  priorityJustification (string): Why this priority was chosen
  budgetEstimate (string): Budget estimate
  teamSkillsRequired (string): Skills needed
  sponsorDecisionMaker (string): Decision maker
  keyMilestones (string): Key milestones
  includesAiWork (boolean): Does project include AI work?

Section 2 - Problem Statement (section2):
  coreProblem (string): Core problem to solve
  whoAffected (string): Who is affected
  currentWorkaround (string): Current workaround
  costOfInaction (string): Cost of not solving
  primaryObjective (string): Primary objective
  secondaryObjectives (string): Secondary objectives
  nonGoals (string): Non-goals

Section 3 - KPIs & Acceptance (section3):
  primaryKpi (string): Primary KPI
  targetValue (string): Target value
  measurementMethod (string): Measurement method
  performanceMetrics (array of {metric, minimumThreshold, target, measurementMethod})
  acceptanceCriterion1/2/3 (string): Acceptance criteria
  definitionOfDone: {primaryKpiMet, acceptanceVerified, evalReportSigned, stakeholderAccepted, deploymentChecklist, documentationHandover} (all boolean)

Section 4 - Stakeholders (section4):
  stakeholders (array of {nameRole, interestLevel (H|M|L), influence (H|M|L), keyConcern})
  elicitationSummary (string): Summary
  assumptions (array of {assumption, classification (KNOWN|UNKNOWN|RISKY), ifWrongImpact})
  artifactLinks (string): Links

Section 5 - Data & AI (section5):
  dataRequired (string): Data required
  dataOwnerAccess (string): Data owners
  dataCurrentState (string): Current state
  dataVolume (string): Volume
  dataReadiness (object of booleans): availableNow, accessNeedsArrangement, partiallyAvailable, doesNotExist, qualityUnknown, syntheticNeeded
  dataSensitivity (string): Sensitivity
  aiWorkTypes (object of booleans): promptEngineering, fineTuning, customTraining, rag, agentic, classicalMl, computerVision, nlp, dataPipeline, other
  aiWorkOther (string): Other AI work
  techStackConstraints (string): Tech constraints
  deploymentTarget (string): Deployment target
  latencyRequirement (string): Latency
  throughputRequirement (string): Throughput
  costPerCall (string): Cost per call
  uptimeSla (string): Uptime SLA
  infrastructureConstraints (string): Infra constraints
  acceptableErrorRate (string): Error tolerance
  whenModelWrong (string): Fallback when model is wrong
  whenUnavailable (string): Fallback when unavailable
  biasFairness (string): Bias & fairness

Section 6A - Client Services (section6A):
  clientName (string): Client name
  clientPoc (string): Client POC
  contractScope (string): Contract scope
  writtenConfirmation (string): Written confirmation
  deliverableFormat (string): Deliverable format
  clientApprover (string): Client approver
  infrastructureDependencies (string): Infra dependencies
  commercialConstraints (string): Commercial constraints
  dependencies (string): Dependencies
  artifactLinks (string): Links

Section 6B - Internal Product (section6B):
  productArea (string): Product area
  roadmapStatus ("on-roadmap"|"proposing"|"hotfix"|"spike"|""): Roadmap status
  internalStakeholder (string): Internal stakeholder
  userResearchEvidence (string): User research
  appetite ("small"|"medium"|"large"|"spike"|""): Appetite
  dependencies (string): Dependencies
  artifactLinks (string): Links

Section 7 - Constraints & Risks (section7):
  timeConstraints (string): Time constraints
  resourceConstraints (string): Resource constraints
  technologyConstraints (string): Technology constraints
  budgetConstraints (string): Budget constraints
  risks (array of {risk, likelihood (H|M|L), impact (H|M|L), mitigation})
  openQuestions (array of {question, owner, dueDate, status})

Section 8 - Gate Review (section8):
  definitionOfReady (object of booleans with arbitrary keys)
  gateDecision ("approved"|"needs-revision"|"rejected"|""): Decision
  gateReviewNotes (string): Review notes
  signatures (array of {name, role, signature, date})`

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
