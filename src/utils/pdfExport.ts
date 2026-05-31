import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { FormData } from '../types/form'
import { GATE_REQUIREMENTS } from '../data/formDefaults'
import { OPTION_DEFAULTS } from '../data/optionDefaults'
import { getGateStatus } from './validation'

/* ── Layout (A4, mm) ─────────────────────────────────────────────── */
const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 22
const CONTENT_W = PAGE_W - MARGIN * 2
const HEADER_Y = 14
const FOOTER_Y = PAGE_H - 10
const BODY_START = 26
const BODY_START_FIRST = 32

/* ── Palette (formal monochrome) ─────────────────────────────────── */
const INK: [number, number, number] = [15, 15, 15]
const MUTED: [number, number, number] = [90, 90, 90]
const RULE: [number, number, number] = [30, 30, 30]
const HEAD_FILL: [number, number, number] = [242, 242, 242]
const LABEL_FILL: [number, number, number] = [248, 248, 248]
const ALT_FILL: [number, number, number] = [252, 252, 252]

const FONT_BODY = 'times'
const FONT_SANS = 'helvetica'

type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } }

interface FieldRow {
  label: string
  value: string
}

interface SectionEntry {
  number: string
  title: string
  page: number
}

const TECHNIQUE_LABELS: Record<keyof FormData['section4']['techniques'], string> = {
  structuredInterview: 'Structured Interview (1-on-1 with key stakeholder)',
  workshop: 'Workshop / Focus Group (multiple stakeholders)',
  fiveWhys: '5 Whys Root Cause Analysis',
  jtbd: 'Jobs-to-be-Done (JTBD) Mapping',
  assumptionMapping: 'Assumption Mapping / Pre-mortem',
  processWalkthrough: 'Process / Journey Walkthrough',
  documentAnalysis: 'Document Analysis (existing specs, reports)',
  observation: 'Observation (shadowing the current workflow)',
}

const AI_WORK_LABELS: Record<keyof FormData['section5']['aiWorkTypes'], string> = {
  promptEngineering: 'Prompt Engineering / Prompt Chains',
  fineTuning: 'Fine-tuning an Existing Model',
  customTraining: 'Custom Model Training',
  rag: 'Retrieval-Augmented Generation (RAG)',
  agentic: 'Agentic / Multi-step AI Workflow',
  classicalMl: 'Classical ML (non-LLM)',
  computerVision: 'Computer Vision',
  nlp: 'NLP (non-generative)',
  dataPipeline: 'Data Pipeline / Feature Engineering only',
  other: 'Other (specify)',
}

const DATA_READINESS_LABELS: Record<keyof FormData['section5']['dataReadiness'], string> = {
  availableNow: 'Data is available now',
  accessNeedsArrangement: 'Data exists but access needs to be arranged',
  partiallyAvailable: 'Partially available — subset exists',
  doesNotExist: 'Data does not exist yet — must be created or collected',
  qualityUnknown: 'Data quality is unknown — audit required',
  syntheticNeeded: 'Synthetic / simulated data may be needed',
}

const DEFINITION_OF_DONE_LABELS: Record<keyof FormData['section3']['definitionOfDone'], string> = {
  primaryKpiMet: 'Primary KPI has been measured and meets or exceeds target value',
  acceptanceVerified: 'All acceptance criteria have been verified by the designated approver',
  evalReportSigned: 'Model evaluation report has been produced and signed off',
  stakeholderAccepted: 'Client or internal stakeholder has formally accepted the deliverable',
  deploymentChecklist: 'Deployment checklist completed (monitoring, alerting, fallback active)',
  documentationHandover: 'Documentation handed over (architecture, runbook, API spec)',
}

const CONFIDENCE_LABELS: Record<keyof FormData['section5']['confidenceHandling'], string> = {
  confidenceScore: 'Return a confidence score with every prediction',
  lowConfidenceReview: 'Route low-confidence outputs to human review',
  lowConfidenceReject: 'Reject / withhold low-confidence outputs',
  allLogged: 'Log all predictions for audit and retraining',
  userFeedback: 'Collect user feedback on outputs (thumbs up/down)',
  autoApproved: 'Outputs above a threshold are auto-approved',
}

function dash(value: string | undefined | null): string {
  const trimmed = (value ?? '').trim()
  return trimmed.length > 0 ? trimmed : '—'
}

function choiceLabel(
  key: 'projectType' | 'priority' | 'roadmapStatus' | 'appetite' | 'gateDecision',
  value: string,
): string {
  if (!value) return '—'
  const match = OPTION_DEFAULTS[key].find((o) => o.value === value)
  return match?.label.replace(/^[^\w]+/, '').trim() || value
}

function gateDecisionLabel(decision: FormData['section8']['gateDecision']): string {
  switch (decision) {
    case 'approved':
      return 'APPROVED — Proceed to System Design'
    case 'needs-revision':
      return 'NEEDS REVISION — Return with comments'
    case 'rejected':
      return 'REJECTED — Project not viable at this time'
    default:
      return '—'
  }
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function checklistRows(
  items: readonly { id: string; label: string }[],
  values: Record<string, boolean>,
): string[][] {
  return items.map((item) => [values[item.id] ? 'Yes' : 'No', item.label])
}

function booleanRows<T extends string>(
  labels: Record<T, string>,
  values: Record<T, boolean>,
): string[][] {
  return (Object.keys(labels) as T[])
    .filter((key) => values[key])
    .map((key) => ['Selected', labels[key]])
}

class CharterPdfBuilder {
  private readonly doc: jsPDF
  private readonly data: FormData
  private y = BODY_START
  private page = 1
  private readonly sectionEntries: SectionEntry[] = []
  private tocPage = 0

  constructor(data: FormData) {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
    this.data = data
  }

  build(): jsPDF {
    this.drawCoverPage()
    this.doc.addPage()
    this.tocPage = this.doc.getNumberOfPages()
    this.drawTocPlaceholder()
    this.doc.addPage()
    this.page = this.doc.getNumberOfPages()
    this.y = BODY_START_FIRST

    this.buildSection1()
    this.buildSection2()
    this.buildSection3()
    this.buildSection4()
    this.buildSection5()
    this.buildSection6()
    this.buildSection7()
    this.buildSection8()

    this.finalizeToc()
    this.applyRunningHeadersFooters()
    return this.doc
  }

  save(): void {
    const doc = this.build()
    const name = this.data.section1.projectName
    const filename = name
      ? `Project-Charter-${name.replace(/[^a-z0-9]/gi, '-').slice(0, 48)}.pdf`
      : 'Project-Charter.pdf'
    doc.save(filename)
  }

  /* ── Page flow ─────────────────────────────────────────────────── */

  private ensureSpace(needed: number): void {
    if (this.y + needed <= FOOTER_Y - 4) return
    this.addPage()
  }

  private addPage(): void {
    this.doc.addPage()
    this.page = this.doc.getNumberOfPages()
    this.y = BODY_START
  }

  private afterTable(): void {
    const finalY = (this.doc as DocWithTable).lastAutoTable?.finalY
    this.y = (finalY ?? this.y) + 6
  }

  private recordSection(number: string, title: string): void {
    this.sectionEntries.push({ number, title, page: this.page })
  }

  private beginSection(number: string, title: string): void {
    this.ensureSpace(18)
    this.recordSection(number, title)

    this.doc.setFont(FONT_SANS, 'bold')
    this.doc.setFontSize(13)
    this.doc.setTextColor(...INK)
    this.doc.text(`${number}  ${title.toUpperCase()}`, MARGIN, this.y)

    this.y += 3
    this.doc.setDrawColor(...RULE)
    this.doc.setLineWidth(0.4)
    this.doc.line(MARGIN, this.y, MARGIN + CONTENT_W, this.y)
    this.y += 8
  }

  private beginSubsection(number: string, title: string): void {
    this.ensureSpace(12)
    this.doc.setFont(FONT_SANS, 'bold')
    this.doc.setFontSize(10.5)
    this.doc.setTextColor(...INK)
    this.doc.text(`${number}  ${title}`, MARGIN, this.y)
    this.y += 6
  }

  private paragraph(text: string): void {
    const body = dash(text)
    if (body === '—') return
    this.ensureSpace(10)
    this.doc.setFont(FONT_BODY, 'normal')
    this.doc.setFontSize(10)
    this.doc.setTextColor(...INK)
    const lines = this.doc.splitTextToSize(body, CONTENT_W)
    this.doc.text(lines, MARGIN, this.y)
    this.y += lines.length * 4.8 + 4
  }

  /* ── Cover & TOC ───────────────────────────────────────────────── */

  private drawCoverPage(): void {
    const s1 = this.data.section1
    const gate = getGateStatus(this.data)
    const generated = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    this.doc.setDrawColor(...RULE)
    this.doc.setLineWidth(0.6)
    this.doc.line(MARGIN, 48, MARGIN + CONTENT_W, 48)

    this.doc.setFont(FONT_SANS, 'normal')
    this.doc.setFontSize(9)
    this.doc.setTextColor(...MUTED)
    this.doc.text('PRE-SYSTEM DESIGN PHASE', MARGIN, 40)

    this.doc.setFont(FONT_SANS, 'bold')
    this.doc.setFontSize(22)
    this.doc.setTextColor(...INK)
    this.doc.text('AI Project Charter', MARGIN, 58)

    this.doc.setFont(FONT_BODY, 'normal')
    this.doc.setFontSize(12)
    this.doc.setTextColor(...MUTED)
    this.doc.text('Requirements Gathering, Elicitation & Definition-of-Ready Gate Review', MARGIN, 67)

    this.doc.setLineWidth(0.3)
    this.doc.line(MARGIN, 73, MARGIN + CONTENT_W, 73)

    this.doc.setFont(FONT_SANS, 'bold')
    this.doc.setFontSize(16)
    this.doc.setTextColor(...INK)
    const projectTitle = dash(s1.projectName)
    const titleLines = this.doc.splitTextToSize(projectTitle, CONTENT_W)
    this.doc.text(titleLines, MARGIN, 86)

    this.doc.setFont(FONT_BODY, 'normal')
    this.doc.setFontSize(11)
    this.doc.setTextColor(...MUTED)
    this.doc.text(`Document ID: ${dash(s1.projectCode)}`, MARGIN, 86 + titleLines.length * 6 + 4)

    autoTable(this.doc, {
      startY: 110,
      margin: { left: MARGIN, right: MARGIN },
      body: [
        ['Submitted By', dash(s1.submittedBy)],
        ['Date Submitted', formatDate(s1.dateSubmitted)],
        ['AI Team Lead', dash(s1.aiTeamLead)],
        ['Priority Classification', dash(s1.priority)],
        ['Project Type', choiceLabel('projectType', s1.projectType)],
        ['Target Start', formatDate(s1.targetStartDate)],
        ['Requested Delivery', formatDate(s1.requestedDeliveryDate)],
        ['Gate Status', gate.toUpperCase()],
      ],
      theme: 'grid',
      styles: {
        font: FONT_BODY,
        fontSize: 10,
        cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
        lineColor: RULE,
        lineWidth: 0.15,
        textColor: INK,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 52, fontStyle: 'bold', fillColor: LABEL_FILL },
        1: { cellWidth: CONTENT_W - 52 },
      },
    })

    const metaY = (this.doc as DocWithTable).lastAutoTable?.finalY ?? 170
    this.doc.setFont(FONT_BODY, 'italic')
    this.doc.setFontSize(9)
    this.doc.setTextColor(...MUTED)
    this.doc.text(`Document generated ${generated}.`, MARGIN, metaY + 14)
    this.doc.text('INTERNAL ENGINEERING DOCUMENT — NOT FOR EXTERNAL DISTRIBUTION', MARGIN, metaY + 20)
  }

  private drawTocPlaceholder(): void {
    this.doc.setFont(FONT_SANS, 'bold')
    this.doc.setFontSize(13)
    this.doc.setTextColor(...INK)
    this.doc.text('TABLE OF CONTENTS', MARGIN, 30)
    this.doc.setLineWidth(0.3)
    this.doc.setDrawColor(...RULE)
    this.doc.line(MARGIN, 33, MARGIN + CONTENT_W, 33)
  }

  private finalizeToc(): void {
    this.doc.setPage(this.tocPage)
    let y = 42
    this.doc.setFont(FONT_BODY, 'normal')
    this.doc.setFontSize(10)
    this.doc.setTextColor(...INK)

    for (const entry of this.sectionEntries) {
      const left = `${entry.number}  ${entry.title}`
      const right = String(entry.page)
      const dots = '.'.repeat(
        Math.max(4, Math.floor((CONTENT_W - this.doc.getTextWidth(left) - this.doc.getTextWidth(right)) / 1.8)),
      )
      this.doc.text(`${left} ${dots} ${right}`, MARGIN, y)
      y += 6
    }
  }

  private applyRunningHeadersFooters(): void {
    const total = this.doc.getNumberOfPages()
    const project = dash(this.data.section1.projectCode || this.data.section1.projectName)
    const generated = new Date().toLocaleDateString('en-GB')

    for (let i = 1; i <= total; i++) {
      this.doc.setPage(i)
      if (i === 1) continue

      this.doc.setDrawColor(...RULE)
      this.doc.setLineWidth(0.2)
      this.doc.line(MARGIN, 18, PAGE_W - MARGIN, 18)
      this.doc.line(MARGIN, FOOTER_Y - 4, PAGE_W - MARGIN, FOOTER_Y - 4)

      this.doc.setFont(FONT_SANS, 'normal')
      this.doc.setFontSize(7.5)
      this.doc.setTextColor(...MUTED)
      this.doc.text('AI PROJECT CHARTER', MARGIN, HEADER_Y)
      this.doc.text(project, PAGE_W - MARGIN, HEADER_Y, { align: 'right' })

      const footerLeft = i === this.tocPage ? 'Table of Contents' : this.currentSectionForPage(i)
      this.doc.text(footerLeft, MARGIN, FOOTER_Y)
      this.doc.text(`Page ${i} of ${total}`, PAGE_W / 2, FOOTER_Y, { align: 'center' })
      this.doc.text(generated, PAGE_W - MARGIN, FOOTER_Y, { align: 'right' })
    }
  }

  private currentSectionForPage(page: number): string {
    let current = 'AI Project Charter'
    for (const entry of this.sectionEntries) {
      if (entry.page <= page) current = `${entry.number}  ${entry.title}`
      else break
    }
    return current
  }

  /* ── Table helpers ─────────────────────────────────────────────── */

  private fieldTable(fields: FieldRow[]): void {
    if (fields.length === 0) return
    this.ensureSpace(12)
    autoTable(this.doc, {
      startY: this.y,
      margin: { left: MARGIN, right: MARGIN },
      body: fields.map((f) => [f.label, dash(f.value)]),
      theme: 'grid',
      styles: {
        font: FONT_BODY,
        fontSize: 9.5,
        cellPadding: { top: 2.5, right: 3.5, bottom: 2.5, left: 3.5 },
        lineColor: RULE,
        lineWidth: 0.12,
        textColor: INK,
        overflow: 'linebreak',
        valign: 'top',
      },
      columnStyles: {
        0: { cellWidth: 56, fontStyle: 'bold', fillColor: LABEL_FILL },
        1: { cellWidth: CONTENT_W - 56 },
      },
    })
    this.afterTable()
  }

  private dataTable(head: string[], body: string[][], emptyMessage = 'No entries recorded.'): void {
    this.ensureSpace(14)
    autoTable(this.doc, {
      startY: this.y,
      margin: { left: MARGIN, right: MARGIN },
      head: [head],
      body: body.length > 0 ? body : [[emptyMessage, ...Array(head.length - 1).fill('')]],
      theme: 'grid',
      headStyles: {
        fillColor: HEAD_FILL,
        textColor: INK,
        fontStyle: 'bold',
        fontSize: 9,
        lineColor: RULE,
        lineWidth: 0.15,
      },
      styles: {
        font: FONT_BODY,
        fontSize: 9,
        cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
        lineColor: RULE,
        lineWidth: 0.12,
        textColor: INK,
        overflow: 'linebreak',
        valign: 'top',
      },
      alternateRowStyles: { fillColor: ALT_FILL },
    })
    this.afterTable()
  }

  private checklistTable(
    items: readonly { id: string; label: string }[],
    values: Record<string, boolean>,
  ): void {
    this.dataTable(['Status', 'Requirement'], checklistRows(items, values))
  }

  /* ── Sections ──────────────────────────────────────────────────── */

  private buildSection1(): void {
    const s = this.data.section1
    this.beginSection('1', 'Project Identity & Classification')
    this.beginSubsection('1.1', 'Basic Information')
    this.fieldTable([
      { label: 'Project Name', value: s.projectName },
      { label: 'Project Code / ID', value: s.projectCode },
      { label: 'Date Submitted', value: formatDate(s.dateSubmitted) },
      { label: 'Submitted By (Name & Role)', value: s.submittedBy },
      { label: 'AI Team Lead Assigned', value: s.aiTeamLead },
      { label: 'Target Start Date', value: formatDate(s.targetStartDate) },
      { label: 'Requested Delivery Date', value: formatDate(s.requestedDeliveryDate) },
    ])
    this.beginSubsection('1.2', 'Project Type')
    this.fieldTable([{ label: 'Classification', value: choiceLabel('projectType', s.projectType) }])
    this.beginSubsection('1.3', 'Priority Classification')
    this.fieldTable([
      { label: 'Priority', value: choiceLabel('priority', s.priority) },
      { label: 'Priority Justification', value: s.priorityJustification },
    ])
  }

  private buildSection2(): void {
    const s = this.data.section2
    this.beginSection('2', 'Problem Statement & Business Context')
    this.beginSubsection('2.1', 'Problem Definition')
    this.fieldTable([
      { label: 'Core Problem', value: s.coreProblem },
      { label: 'Who is Affected', value: s.whoAffected },
      { label: 'Current Workaround', value: s.currentWorkaround },
      { label: 'Cost of Inaction', value: s.costOfInaction },
    ])
    this.beginSubsection('2.2', 'Business Objectives')
    this.fieldTable([
      { label: 'Primary Business Objective', value: s.primaryObjective },
      { label: 'Secondary Objectives', value: s.secondaryObjectives },
      { label: 'Non-Goals (Explicit Exclusions)', value: s.nonGoals },
    ])
  }

  private buildSection3(): void {
    const s = this.data.section3
    this.beginSection('3', 'Success Metrics & Acceptance Criteria')
    this.beginSubsection('3.1', 'Primary Success Metric')
    this.fieldTable([
      { label: 'Primary KPI', value: s.primaryKpi },
      { label: 'Target Value', value: s.targetValue },
      { label: 'Measurement Method', value: s.measurementMethod },
    ])
    this.beginSubsection('3.2', 'AI Model Performance Thresholds')
    this.dataTable(
      ['Metric', 'Minimum Threshold', 'Target', 'Measurement Method'],
      s.performanceMetrics.map((r) => [
        r.metric,
        r.minimumThreshold,
        r.target,
        r.measurementMethod,
      ]),
    )
    this.beginSubsection('3.3', 'Acceptance Criteria')
    this.fieldTable([
      { label: 'Acceptance Criterion 1', value: s.acceptanceCriterion1 },
      { label: 'Acceptance Criterion 2', value: s.acceptanceCriterion2 },
      { label: 'Acceptance Criterion 3', value: s.acceptanceCriterion3 },
    ])
    this.beginSubsection('3.4', 'Definition of Done')
    this.dataTable(
      ['Status', 'Completion Criterion'],
      checklistRows(
        Object.entries(DEFINITION_OF_DONE_LABELS).map(([id, label]) => ({ id, label })),
        s.definitionOfDone as unknown as Record<string, boolean>,
      ),
    )
  }

  private buildSection4(): void {
    const s = this.data.section4
    this.beginSection('4', 'BABOK Elicitation & Stakeholder Alignment')
    this.beginSubsection('4.1', 'Stakeholder Register')
    this.dataTable(
      ['Name & Role', 'Interest (H/M/L)', 'Influence (H/M/L)', 'Key Concern / Need'],
      s.stakeholders.map((r) => [r.nameRole, r.interestLevel, r.influence, r.keyConcern]),
    )
    this.beginSubsection('4.2', 'Elicitation Techniques Used')
    this.dataTable(
      ['Status', 'Technique'],
      checklistRows(
        Object.entries(TECHNIQUE_LABELS).map(([id, label]) => ({ id, label })),
        s.techniques as unknown as Record<string, boolean>,
      ),
    )
    this.beginSubsection('4.3', 'Elicitation Session Summary')
    this.paragraph(s.elicitationSummary)
    this.beginSubsection('4.4', 'Assumption Register')
    this.dataTable(
      ['Assumption', 'Classification', 'If Wrong — Impact'],
      s.assumptions.map((r) => [r.assumption, r.classification, r.ifWrongImpact]),
    )
  }

  private buildSection5(): void {
    const s = this.data.section5
    this.beginSection('5', 'AI-Specific Requirements')
    this.beginSubsection('5.1', 'Data Requirements')
    this.fieldTable([
      { label: 'Data Required', value: s.dataRequired },
      { label: 'Data Owner & Access', value: s.dataOwnerAccess },
      { label: 'Current State of Data', value: s.dataCurrentState },
      { label: 'Estimated Data Volume', value: s.dataVolume },
      { label: 'Data Sensitivity & Compliance', value: s.dataSensitivity },
    ])
    this.beginSubsection('5.2', 'Data Readiness')
    this.dataTable(
      ['Status', 'Condition'],
      checklistRows(
        Object.entries(DATA_READINESS_LABELS).map(([id, label]) => ({ id, label })),
        s.dataReadiness as unknown as Record<string, boolean>,
      ),
    )
    this.beginSubsection('5.3', 'AI Work Classification')
    const selectedWork = booleanRows(AI_WORK_LABELS, s.aiWorkTypes)
    this.dataTable(
      ['Status', 'Work Type'],
      selectedWork.length > 0 ? selectedWork : [['—', 'No work type selected']],
    )
    if (s.aiWorkTypes.other && s.aiWorkOther.trim()) {
      this.fieldTable([{ label: 'Other (Specify)', value: s.aiWorkOther }])
    }
    this.beginSubsection('5.4', 'Technical & Deployment Constraints')
    this.fieldTable([
      { label: 'Technology Stack Constraints', value: s.techStackConstraints },
      { label: 'Deployment Target', value: s.deploymentTarget },
      { label: 'Latency Requirement', value: s.latencyRequirement },
      { label: 'Throughput Requirement', value: s.throughputRequirement },
      { label: 'Cost per Call / Inference', value: s.costPerCall },
      { label: 'Uptime / SLA Requirement', value: s.uptimeSla },
      { label: 'Infrastructure Constraints', value: s.infrastructureConstraints },
    ])
    this.beginSubsection('5.5', 'Failure Modes & Fallback Behaviour')
    this.fieldTable([
      { label: 'Acceptable Error Rate', value: s.acceptableErrorRate },
      { label: 'When the Model is Wrong', value: s.whenModelWrong },
      { label: 'When the System is Unavailable', value: s.whenUnavailable },
    ])
    this.beginSubsection('5.6', 'Confidence Handling')
    this.dataTable(
      ['Status', 'Handling Strategy'],
      checklistRows(
        Object.entries(CONFIDENCE_LABELS).map(([id, label]) => ({ id, label })),
        s.confidenceHandling as unknown as Record<string, boolean>,
      ),
    )
    this.beginSubsection('5.7', 'Bias, Fairness & Ethical Considerations')
    this.paragraph(s.biasFairness)
  }

  private buildSection6(): void {
    this.beginSection('6', 'Project Context')
    if (this.data.section1.projectType === 'client-services') {
      const s = this.data.section6A
      this.beginSubsection('6A', 'Client Services')
      this.fieldTable([
        { label: 'Client Name', value: s.clientName },
        { label: 'Client Point of Contact', value: s.clientPoc },
        { label: 'Contract Scope', value: s.contractScope },
        { label: 'Written Confirmation Received', value: s.writtenConfirmation },
        { label: 'Expected Deliverable Format', value: s.deliverableFormat },
        { label: 'Client Approver', value: s.clientApprover },
        { label: 'Infrastructure & Access Dependencies', value: s.infrastructureDependencies },
        { label: 'Commercial Constraints', value: s.commercialConstraints },
      ])
    } else if (this.data.section1.projectType === 'internal-product') {
      const s = this.data.section6B
      this.beginSubsection('6B', 'Internal Product')
      this.fieldTable([
        { label: 'Product Area', value: s.productArea },
        { label: 'Roadmap Status', value: choiceLabel('roadmapStatus', s.roadmapStatus) },
        { label: 'Internal Stakeholder / Decision Maker', value: s.internalStakeholder },
        { label: 'User Research or Evidence', value: s.userResearchEvidence },
        { label: 'Appetite', value: choiceLabel('appetite', s.appetite) },
      ])
    } else {
      this.paragraph('Project type not selected — Section 6 not applicable.')
    }
  }

  private buildSection7(): void {
    const s = this.data.section7
    this.beginSection('7', 'Constraints, Risks & Open Questions')
    this.beginSubsection('7.1', 'Project Constraints')
    this.fieldTable([
      { label: 'Time Constraints', value: s.timeConstraints },
      { label: 'Resource Constraints', value: s.resourceConstraints },
      { label: 'Technology Constraints', value: s.technologyConstraints },
      { label: 'Budget Constraints', value: s.budgetConstraints },
    ])
    this.beginSubsection('7.2', 'Risk Register')
    this.dataTable(
      ['Risk / Assumption', 'Likelihood', 'Impact', 'Mitigation Strategy'],
      s.risks.map((r) => [r.risk, r.likelihood, r.impact, r.mitigation]),
    )
    this.beginSubsection('7.3', 'RACI Matrix')
    this.doc.setFont(FONT_BODY, 'italic')
    this.doc.setFontSize(8.5)
    this.doc.setTextColor(...MUTED)
    this.ensureSpace(6)
    this.doc.text('R = Responsible · A = Accountable · C = Consulted · I = Informed', MARGIN, this.y)
    this.y += 5
    this.dataTable(
      ['Activity / Decision', 'AI Lead', 'AI Eng 1', 'AI Eng 2', 'Stakeholder'],
      s.raci.map((r) => [r.activity, r.aiLead, r.aiEng1, r.aiEng2, r.stakeholder]),
    )
    this.beginSubsection('7.4', 'Open Questions & Unknowns')
    this.dataTable(
      ['Question / Unknown', 'Owner', 'Due Date', 'Status'],
      s.openQuestions.map((r) => [r.question, r.owner, formatDate(r.dueDate), r.status]),
    )
  }

  private buildSection8(): void {
    const s = this.data.section8
    this.beginSection('8', 'Definition of Ready — Gate Review')
    this.beginSubsection('8.1', 'Requirements Completeness')
    this.checklistTable(GATE_REQUIREMENTS.requirementsCompleteness, s.requirementsCompleteness)
    this.beginSubsection('8.2', 'AI Readiness')
    this.checklistTable(GATE_REQUIREMENTS.aiReadiness, s.aiReadiness)
    this.beginSubsection('8.3', 'Stakeholder Alignment')
    this.checklistTable(GATE_REQUIREMENTS.stakeholderAlignment, s.stakeholderAlignment)
    if (this.data.section1.projectType === 'client-services') {
      this.beginSubsection('8.4', 'Commercial & Contractual')
      this.checklistTable(GATE_REQUIREMENTS.commercialContractual, s.commercialContractual)
    }
    this.beginSubsection('8.5', 'Gate Decision')
    this.fieldTable([
      { label: 'Decision', value: gateDecisionLabel(s.gateDecision) },
      { label: 'Gate Review Notes', value: s.gateReviewNotes },
    ])
    this.beginSubsection('8.6', 'Authorisation & Signatures')
    this.dataTable(
      ['Name', 'Role', 'Signature', 'Date'],
      s.signatures.map((r) => [r.name, r.role, r.signature, formatDate(r.date)]),
    )
  }
}

export function exportToPdf(data: FormData): void {
  new CharterPdfBuilder(data).save()
}
