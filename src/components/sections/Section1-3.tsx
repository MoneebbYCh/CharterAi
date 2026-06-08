import type { FormData } from '../../types/form'
import {
  CheckboxGroup,
  DynamicTable,
  SectionHeader,
  SubSection,
  TextField,
} from '../FormFields'
import { EditableChoiceGroup } from '../EditableChoiceGroup'

interface Props {
  data: FormData
  update: (updater: (prev: FormData) => FormData) => void
}

export function Section1({ data, update }: Props) {
  const s = data.section1

  return (
    <section className="form-section">
      <SectionHeader
        number="01"
        title="Project Identity & Classification"
        subtitle="Initiation · Budget · Team"
      />

      <SubSection title="1.1 Basic Information">
        <TextField
          label="Project Name"
          value={s.projectName}
          onChange={(v) => update((p) => ({ ...p, section1: { ...p.section1, projectName: v } }))}
          required
          hint='Short, descriptive. Avoid vague names like "AI Project".'
        />
        <TextField
          label="Project Code / ID"
          value={s.projectCode}
          onChange={(v) => update((p) => ({ ...p, section1: { ...p.section1, projectCode: v } }))}
          hint="Assign from your project register."
        />
        <div className="field-row">
          <TextField
            label="Date Submitted"
            type="date"
            value={s.dateSubmitted}
            onChange={(v) => update((p) => ({ ...p, section1: { ...p.section1, dateSubmitted: v } }))}
            required
          />
          <TextField
            label="Submitted By (Name & Role)"
            value={s.submittedBy}
            onChange={(v) => update((p) => ({ ...p, section1: { ...p.section1, submittedBy: v } }))}
            required
          />
        </div>
        <TextField
          label="AI Team Lead Assigned"
          value={s.aiTeamLead}
          onChange={(v) => update((p) => ({ ...p, section1: { ...p.section1, aiTeamLead: v } }))}
        />
        <div className="field-row">
          <TextField
            label="Target Start Date"
            type="date"
            value={s.targetStartDate}
            onChange={(v) => update((p) => ({ ...p, section1: { ...p.section1, targetStartDate: v } }))}
          />
          <TextField
            label="Requested Delivery Date / Deadline"
            type="date"
            value={s.requestedDeliveryDate}
            onChange={(v) =>
              update((p) => ({ ...p, section1: { ...p.section1, requestedDeliveryDate: v } }))
            }
            hint="If there is a hard deadline, state the business reason for it."
          />
        </div>
      </SubSection>

      <SubSection
        title="1.2 Project Type"
        note="Check the appropriate box. This determines which branch of Section 6 to complete."
      >
        <EditableChoiceGroup
          label="Select One"
          value={s.projectType}
          onChange={(v) =>
            update((p) => ({
              ...p,
              section1: { ...p.section1, projectType: v as FormData['section1']['projectType'] },
            }))
          }
          optionKey="projectType"
          required
        />
      </SubSection>

      <SubSection title="1.3 AI / ML Scope">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={s.includesAiWork}
            onChange={(e) =>
              update((p) => ({
                ...p,
                section1: { ...p.section1, includesAiWork: e.target.checked },
              }))
            }
            className="mt-0.5 w-4 h-4 border-2 border-on-background"
          />
          <div>
            <span className="font-bold text-sm">This project involves AI/ML work</span>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Uncheck for pure data pipelines, infrastructure, or non-AI automation projects. AI-specific fields in Section 5 will be optional.
            </p>
          </div>
        </label>
      </SubSection>

      <SubSection title="1.4 Budget & Resourcing">
        <div className="field-row">
          <TextField
            label="Budget Estimate / Cost Range"
            value={s.budgetEstimate}
            onChange={(v) => update((p) => ({ ...p, section1: { ...p.section1, budgetEstimate: v } }))}
            required
            hint="Ballpark is fine — e.g. $10k–20k, 2–3 weeks dev time"
          />
        </div>
        <TextField
          label="Team / Skills Required"
          value={s.teamSkillsRequired}
          onChange={(v) => update((p) => ({ ...p, section1: { ...p.section1, teamSkillsRequired: v } }))}
          multiline
          rows={2}
          hint="What roles are needed? E.g. 1 AI engineer, 1 data analyst, SME"
        />
        <TextField
          label="Sponsor / Decision Maker"
          value={s.sponsorDecisionMaker}
          onChange={(v) => update((p) => ({ ...p, section1: { ...p.section1, sponsorDecisionMaker: v } }))}
          required
          hint="Who approves this charter and makes go/no-go decisions?"
        />
        <TextField
          label="Key Milestones / High-Level Timeline"
          value={s.keyMilestones}
          onChange={(v) => update((p) => ({ ...p, section1: { ...p.section1, keyMilestones: v } }))}
          multiline
          rows={3}
          hint="E.g. Design by Week 2, Dev by Week 4, Demo by Week 6"
        />
      </SubSection>

      <SubSection title="1.4 Priority Classification">
        <EditableChoiceGroup
          label="Priority"
          value={s.priority}
          onChange={(v) =>
            update((p) => ({
              ...p,
              section1: { ...p.section1, priority: v as FormData['section1']['priority'] },
            }))
          }
          optionKey="priority"
          required
        />
        <TextField
          label="Justification for Priority Level"
          value={s.priorityJustification}
          onChange={(v) =>
            update((p) => ({ ...p, section1: { ...p.section1, priorityJustification: v } }))
          }
          required
          multiline
          hint="Why does this project belong at this priority? What is the cost of delay?"
        />
      </SubSection>
    </section>
  )
}

export function Section2({ data, update }: Props) {
  const s = data.section2

  return (
    <section className="form-section">
      <SectionHeader
        number="02"
        title="Problem Statement & Business Context"
        subtitle="PMI Charter — Business Need & Justification"
        callout="Before writing anything here, run the 5 Whys exercise with the requestor. The problem statement should reflect the root cause — not symptoms."
      />

      <SubSection title="2.1 Problem Statement">
        <TextField
          label="What is the core problem being solved?"
          value={s.coreProblem}
          onChange={(v) => update((p) => ({ ...p, section2: { ...p.section2, coreProblem: v } }))}
          required
          multiline
          rows={4}
          hint="Write 2–4 sentences. Describe the problem — not the solution. Do not mention technology here."
        />
        <TextField
          label="Who is experiencing this problem, and how does it affect them?"
          value={s.whoAffected}
          onChange={(v) => update((p) => ({ ...p, section2: { ...p.section2, whoAffected: v } }))}
          required
          multiline
          rows={3}
        />
        <TextField
          label="What is the current workaround or existing process?"
          value={s.currentWorkaround}
          onChange={(v) => update((p) => ({ ...p, section2: { ...p.section2, currentWorkaround: v } }))}
          multiline
          rows={3}
        />
        <TextField
          label="What is the cost of inaction — what happens if we do nothing?"
          value={s.costOfInaction}
          onChange={(v) => update((p) => ({ ...p, section2: { ...p.section2, costOfInaction: v } }))}
          required
          multiline
          rows={3}
        />
      </SubSection>

      <SubSection title="2.2 Business Objectives" note="Business objectives must be SMART: Specific, Measurable, Achievable, Relevant, Time-bound.">
        <TextField
          label="Primary Business Objective"
          value={s.primaryObjective}
          onChange={(v) => update((p) => ({ ...p, section2: { ...p.section2, primaryObjective: v } }))}
          required
          multiline
          rows={2}
        />
        <TextField
          label="Secondary Objectives (max 2)"
          value={s.secondaryObjectives}
          onChange={(v) => update((p) => ({ ...p, section2: { ...p.section2, secondaryObjectives: v } }))}
          multiline
          rows={3}
        />
        <TextField
          label="Non-Goals — What are we explicitly NOT trying to achieve?"
          value={s.nonGoals}
          onChange={(v) => update((p) => ({ ...p, section2: { ...p.section2, nonGoals: v } }))}
          required
          multiline
          rows={3}
          hint="This is as important as the goals. Non-goals prevent scope creep."
        />
      </SubSection>
    </section>
  )
}

export function Section3({ data, update }: Props) {
  const s = data.section3

  return (
    <section className="form-section">
      <SectionHeader
        number="03"
        title="Success Metrics & Acceptance Criteria"
        subtitle="PMI Charter — Measurable Project Objectives"
        callout="Success metrics must be agreed upon and written here BEFORE any technical design begins."
      />

      <SubSection title="3.1 Primary Success Metric">
        <TextField
          label="Primary KPI"
          value={s.primaryKpi}
          onChange={(v) => update((p) => ({ ...p, section3: { ...p.section3, primaryKpi: v } }))}
          required
          multiline
        />
        <div className="field-row">
          <TextField
            label="Target Value"
            value={s.targetValue}
            onChange={(v) => update((p) => ({ ...p, section3: { ...p.section3, targetValue: v } }))}
            required
          />
          <TextField
            label="Measurement Method"
            value={s.measurementMethod}
            onChange={(v) => update((p) => ({ ...p, section3: { ...p.section3, measurementMethod: v } }))}
            required
            multiline
          />
        </div>
      </SubSection>

      <SubSection title="3.2 AI Model Performance Thresholds" note="Minimum acceptable performance floor and target. Fill in collaboration with the AI Lead.">
        <DynamicTable
          columns={[
            { key: 'metric', label: 'Metric', multiline: true, required: true },
            { key: 'minimumThreshold', label: 'Minimum Threshold', multiline: true, required: true },
            { key: 'target', label: 'Target', multiline: true, required: true },
            { key: 'measurementMethod', label: 'Measurement Method', multiline: true },
          ]}
          requireCompleteRow
          rows={s.performanceMetrics}
          onChange={(i, key, value) =>
            update((p) => {
              const metrics = [...p.section3.performanceMetrics]
              metrics[i] = { ...metrics[i], [key]: value }
              return { ...p, section3: { ...p.section3, performanceMetrics: metrics } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section3: {
                ...p.section3,
                performanceMetrics: [
                  ...p.section3.performanceMetrics,
                  { metric: '', minimumThreshold: '', target: '', measurementMethod: '' },
                ],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section3: {
                ...p.section3,
                performanceMetrics: p.section3.performanceMetrics.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>

      <SubSection title="3.3 Acceptance Criteria" note='Use the format: "Given [context], when [action], then [outcome]."'>
        <TextField
          label="Acceptance Criterion 1"
          value={s.acceptanceCriterion1}
          onChange={(v) => update((p) => ({ ...p, section3: { ...p.section3, acceptanceCriterion1: v } }))}
          required
          multiline
        />
        <TextField
          label="Acceptance Criterion 2"
          value={s.acceptanceCriterion2}
          onChange={(v) => update((p) => ({ ...p, section3: { ...p.section3, acceptanceCriterion2: v } }))}
          multiline
        />
        <TextField
          label="Acceptance Criterion 3"
          value={s.acceptanceCriterion3}
          onChange={(v) => update((p) => ({ ...p, section3: { ...p.section3, acceptanceCriterion3: v } }))}
          multiline
        />
      </SubSection>

      <SubSection title="3.4 Definition of Done">
        <CheckboxGroup
          label="The project is considered complete when ALL of the following are true:"
          items={[
            { key: 'primaryKpiMet', label: 'Primary KPI has been measured and meets or exceeds target value', checked: s.definitionOfDone.primaryKpiMet },
            { key: 'acceptanceVerified', label: 'All acceptance criteria have been verified by the designated approver', checked: s.definitionOfDone.acceptanceVerified },
            { key: 'evalReportSigned', label: 'Model evaluation report has been produced and signed off', checked: s.definitionOfDone.evalReportSigned },
            { key: 'stakeholderAccepted', label: 'Client or internal stakeholder has formally accepted the deliverable', checked: s.definitionOfDone.stakeholderAccepted },
            { key: 'deploymentChecklist', label: 'Deployment checklist completed (monitoring, alerting, fallback active)', checked: s.definitionOfDone.deploymentChecklist },
            { key: 'documentationHandover', label: 'Documentation handed over (architecture, runbook, API spec)', checked: s.definitionOfDone.documentationHandover },
          ]}
          onChange={(key, checked) =>
            update((p) => ({
              ...p,
              section3: {
                ...p.section3,
                definitionOfDone: { ...p.section3.definitionOfDone, [key]: checked },
              },
            }))
          }
        />
      </SubSection>
    </section>
  )
}
