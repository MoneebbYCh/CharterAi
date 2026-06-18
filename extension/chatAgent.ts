import * as vscode from 'vscode'
import { loadCharter, saveCharter, loadPrd, savePrd } from './formStateManager'

export interface ChatResult {
  message: string
  formUpdated: boolean
}

const CHARTER_GUIDE = `PROJECT CHARTER FIELDS:

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

const PRD_GUIDE = `PRD FIELDS:

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

function getFieldGuide(phase: string): string {
  if (phase === 'project-charter') return CHARTER_GUIDE
  if (phase === 'prd') return PRD_GUIDE
  return ''
}

export async function processChatMessage(
  text: string,
  phase: string
): Promise<ChatResult> {
  let formData: unknown = null
  let phaseName = 'general project'

  if (phase === 'project-charter') {
    formData = await loadCharter()
    phaseName = 'Project Charter'
  } else if (phase === 'prd') {
    const result = await loadPrd()
    formData = result.prd
    phaseName = 'PRD'
  }

  const fieldGuide = getFieldGuide(phase)
  const formJson = formData
    ? JSON.stringify(formData, null, 2)
    : 'No form data yet.'

  const systemPrompt = 'You are an AI assistant for Req-Gath-Sys, a requirements gathering system. Be helpful and concise.'

  let userMsgText: string
  if (fieldGuide) {
    userMsgText = [
      `USER: ${text}`,
      '',
      'Available form fields:',
      fieldGuide,
      '',
      'CURRENT FORM DATA:',
      '```json',
      formJson,
      '```',
    ].join('\n')
  } else {
    userMsgText = `USER: ${text}`
  }

  console.log('[Req-Gath-Sys] chatAgent: vscode.lm available:', !!vscode.lm)

  if (!vscode.lm || typeof vscode.lm.selectChatModels !== 'function') {
    console.log('[Req-Gath-Sys] chatAgent: vscode.lm not available')
    return {
      message: 'AI chat requires VS Code 1.97+ with GitHub Copilot installed.',
      formUpdated: false,
    }
  }

  try {
    console.log('[Req-Gath-Sys] chatAgent: calling selectChatModels...')
    const models = await vscode.lm.selectChatModels()

    console.log('[Req-Gath-Sys] chatAgent: models returned:', models?.length ?? 0)

    if (!models || models.length === 0) {
      return {
        message:
          'No AI model available. Make sure GitHub Copilot is installed, signed in, and enabled.',
        formUpdated: false,
      }
    }

    const model = models[0]
    console.log('[Req-Gath-Sys] chatAgent: using model:', model.vendor, model.family, model.name)

    const messages = [
      new vscode.LanguageModelChatMessage('system', systemPrompt),
      vscode.LanguageModelChatMessage.User(userMsgText),
    ]

    console.log('[Req-Gath-Sys] chatAgent: calling sendRequest...')
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out after 25 seconds')), 25_000)
    )

    const response = await Promise.race([
      model.sendRequest(messages, {
        justification:
          'Req-Gath-Sys uses AI to help fill project requirements forms.',
      }),
      timeoutPromise,
    ])
    console.log('[Req-Gath-Sys] chatAgent: sendRequest returned, reading response...')
    console.log('[Req-Gath-Sys] chatAgent: response keys:', Object.keys(response))
    console.log('[Req-Gath-Sys] chatAgent: stream type:', typeof (response as any).stream)
    console.log('[Req-Gath-Sys] chatAgent: text type:', typeof (response as any).text)
    console.log('[Req-Gath-Sys] chatAgent: has text:', 'text' in response)

    let resultText = ''

    const textIter = (response as any).text as AsyncIterable<string> | undefined
    if (textIter) {
      for await (const chunk of textIter) {
        resultText += String(chunk)
      }
    }

    // fallback: try stream if text yielded nothing
    if (!resultText && (response as any).stream) {
      for await (const chunk of (response as any).stream) {
        if (typeof (chunk as any)?.value === 'string') resultText += (chunk as any).value
        else if (typeof (chunk as any)?.content === 'string') resultText += (chunk as any).content
      }
    }

    console.log('[Req-Gath-Sys] chatAgent: FULL RESPONSE:', JSON.stringify(resultText))

    const { replyText, updates } = parseResponse(resultText)

    if (
      updates &&
      Object.keys(updates).length > 0 &&
      formData &&
      typeof formData === 'object' &&
      !Array.isArray(formData)
    ) {
      deepMerge(formData as Record<string, any>, updates)

      if (phase === 'project-charter') {
        await saveCharter(formData)
      } else if (phase === 'prd') {
        await savePrd(formData)
      }

      return { message: replyText, formUpdated: true }
    }

    return { message: replyText, formUpdated: false }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)

    if (msg.includes('No response')) {
      return {
        message: 'The AI model did not return a response. Please try again.',
        formUpdated: false,
      }
    }
    if (msg.includes('not authenticated') || msg.includes('sign in')) {
      return {
        message:
          'Please sign in to GitHub Copilot to use the AI assistant.',
        formUpdated: false,
      }
    }

    return {
      message: `Sorry, I encountered an error: ${msg}`,
      formUpdated: false,
    }
  }
}

function parseResponse(
  text: string
): { replyText: string; updates: Record<string, any> | null } {
  const trimmed = text.trim()
  if (!trimmed) return { replyText: 'No response.', updates: null }

  // Check if the entire response is a JSON object with message+updates
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (typeof parsed.message === 'string') {
        return {
          replyText: parsed.message,
          updates:
            parsed.updates && typeof parsed.updates === 'object'
              ? parsed.updates
              : null,
        }
      }
    } catch {}
  }

  // Return raw text — model is just chatting
  return { replyText: trimmed, updates: null }
}

function deepMerge(
  target: Record<string, any>,
  updates: Record<string, any>
): void {
  for (const [path, value] of Object.entries(updates)) {
    const keys = path.split('.')
    let current = target
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] === undefined || current[keys[i]] === null) {
        current[keys[i]] = {}
      }
      if (
        typeof current[keys[i]] !== 'object' ||
        Array.isArray(current[keys[i]])
      ) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value
  }
}
