import type { FormData } from '../../types/form'
import { Link } from 'react-router-dom'
import {
  CheckboxGroup,
  DynamicTable,
  GateChecklist,
  SectionHeader,
  SubSection,
  TextField,
} from '../FormFields'
import { EditableChoiceGroup } from '../EditableChoiceGroup'
import { EditableSelect } from '../EditableSelect'
import { useShowValidation } from '../../context/ValidationContext'
import { GATE_REQUIREMENTS } from '../../data/formDefaults'
import { isRaciFilled, isGateApproved, validateSection8 } from '../../utils/validation'

interface Props {
  data: FormData
  update: (updater: (prev: FormData) => FormData) => void
}

export function Section4({ data, update }: Props) {
  const s = data.section4

  return (
    <section className="form-section">
      <SectionHeader
        number="04"
        title="BABOK Elicitation — Stakeholder Alignment"
        subtitle="Structured Techniques for Requirements Discovery"
        callout="This section is completed by the AI Lead AFTER running an elicitation session with the requestor."
      />

      <SubSection title="4.1 Stakeholder Register">
        <DynamicTable
          columns={[
            { key: 'nameRole', label: 'Name & Role', multiline: true, required: true },
            { key: 'interestLevel', label: 'Interest (H/M/L)', type: 'select', optionKey: 'hml', required: true },
            { key: 'influence', label: 'Influence (H/M/L)', type: 'select', optionKey: 'hml', required: true },
            { key: 'keyConcern', label: 'Key Concern / Need', multiline: true },
          ]}
          requireCompleteRow
          rows={s.stakeholders}
          onChange={(i, key, value) =>
            update((p) => {
              const stakeholders = [...p.section4.stakeholders]
              stakeholders[i] = { ...stakeholders[i], [key]: value }
              return { ...p, section4: { ...p.section4, stakeholders } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section4: {
                ...p.section4,
                stakeholders: [
                  ...p.section4.stakeholders,
                  { nameRole: '', interestLevel: '', influence: '', keyConcern: '' },
                ],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section4: {
                ...p.section4,
                stakeholders: p.section4.stakeholders.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>

      <SubSection title="4.2 Elicitation Techniques Used" note="At least two techniques must be used for any non-trivial project.">
        <CheckboxGroup
          label="Select all that apply"
          required
          minChecked={2}
          hint="At least two techniques must be used for any non-trivial project."
          items={[
            { key: 'structuredInterview', label: 'Structured Interview (1-on-1 with key stakeholder)', checked: s.techniques.structuredInterview },
            { key: 'workshop', label: 'Workshop / Focus Group (multiple stakeholders)', checked: s.techniques.workshop },
            { key: 'fiveWhys', label: '5 Whys Root Cause Analysis', checked: s.techniques.fiveWhys },
            { key: 'jtbd', label: 'Jobs-to-be-Done (JTBD) Mapping', checked: s.techniques.jtbd },
            { key: 'assumptionMapping', label: 'Assumption Mapping / Pre-mortem', checked: s.techniques.assumptionMapping },
            { key: 'processWalkthrough', label: 'Process / Journey Walkthrough', checked: s.techniques.processWalkthrough },
            { key: 'documentAnalysis', label: 'Document Analysis (existing specs, reports)', checked: s.techniques.documentAnalysis },
            { key: 'observation', label: 'Observation (shadowing the current workflow)', checked: s.techniques.observation },
          ]}
          onChange={(key, checked) =>
            update((p) => ({
              ...p,
              section4: {
                ...p.section4,
                techniques: { ...p.section4.techniques, [key]: checked },
              },
            }))
          }
        />
        <TextField
          label="Summary of Elicitation Session"
          value={s.elicitationSummary}
          onChange={(v) => update((p) => ({ ...p, section4: { ...p.section4, elicitationSummary: v } }))}
          required
          multiline
          rows={4}
          hint="Date held, who attended, key findings, any surprises or contradictions discovered."
        />
      </SubSection>

      <SubSection title="4.3 Assumption Register" note="Classify each as KNOWN, UNKNOWN, or RISKY. The AI Lead must challenge every assumption in the risky column.">
        <DynamicTable
          columns={[
            { key: 'assumption', label: 'Assumption', multiline: true, required: true },
            { key: 'classification', label: 'Classification', type: 'select', optionKey: 'assumptionClass', required: true },
            { key: 'ifWrongImpact', label: 'If Wrong — Impact', multiline: true },
          ]}
          requireCompleteRow
          rows={s.assumptions}
          onChange={(i, key, value) =>
            update((p) => {
              const assumptions = [...p.section4.assumptions]
              assumptions[i] = { ...assumptions[i], [key]: value }
              return { ...p, section4: { ...p.section4, assumptions } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section4: {
                ...p.section4,
                assumptions: [
                  ...p.section4.assumptions,
                  { assumption: '', classification: '', ifWrongImpact: '' },
                ],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section4: {
                ...p.section4,
                assumptions: p.section4.assumptions.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>
    </section>
  )
}

export function Section5({ data, update }: Props) {
  const s = data.section5

  return (
    <section className="form-section">
      <SectionHeader
        number="05"
        title="AI-Specific Requirements"
        subtitle="Data · Model · Infrastructure · Fallback"
        callout="This section is purpose-built for AI/ML projects and must be completed for every engagement."
      />

      <SubSection title="5.1 Data Requirements">
        <TextField label="What data is required to build or run this system?" value={s.dataRequired} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, dataRequired: v } }))} required multiline rows={3} />
        <TextField label="Who owns this data, and how is it accessed?" value={s.dataOwnerAccess} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, dataOwnerAccess: v } }))} required multiline rows={2} />
        <TextField label="What is the current state of the data?" value={s.dataCurrentState} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, dataCurrentState: v } }))} required multiline rows={2} />
        <TextField label="What is the estimated data volume?" value={s.dataVolume} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, dataVolume: v } }))} />
        <CheckboxGroup
          label="Data Readiness Assessment"
          items={[
            { key: 'availableNow', label: 'Data is available and accessible right now', checked: s.dataReadiness.availableNow },
            { key: 'accessNeedsArrangement', label: 'Data exists but access needs to be arranged', checked: s.dataReadiness.accessNeedsArrangement },
            { key: 'partiallyAvailable', label: 'Data is partially available — gaps need to be filled', checked: s.dataReadiness.partiallyAvailable },
            { key: 'doesNotExist', label: 'Data does not exist — needs to be collected or labeled', checked: s.dataReadiness.doesNotExist },
            { key: 'qualityUnknown', label: 'Data quality is unknown — audit required', checked: s.dataReadiness.qualityUnknown },
            { key: 'syntheticNeeded', label: 'Synthetic / augmented data may be needed', checked: s.dataReadiness.syntheticNeeded },
          ]}
          onChange={(key, checked) =>
            update((p) => ({
              ...p,
              section5: {
                ...p.section5,
                dataReadiness: { ...p.section5.dataReadiness, [key]: checked },
              },
            }))
          }
        />
        <TextField label="Data Sensitivity & Compliance" value={s.dataSensitivity} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, dataSensitivity: v } }))} required multiline rows={2} />
      </SubSection>

      <SubSection title="5.2 Model & Approach Requirements">
        <CheckboxGroup
          label="What type of AI work is this?"
          required
          items={[
            { key: 'promptEngineering', label: 'Prompt engineering / LLM integration (API-based)', checked: s.aiWorkTypes.promptEngineering },
            { key: 'fineTuning', label: 'Fine-tuning an existing model', checked: s.aiWorkTypes.fineTuning },
            { key: 'customTraining', label: 'Training a custom model from scratch', checked: s.aiWorkTypes.customTraining },
            { key: 'rag', label: 'RAG (Retrieval-Augmented Generation)', checked: s.aiWorkTypes.rag },
            { key: 'agentic', label: 'Agentic / multi-agent pipeline', checked: s.aiWorkTypes.agentic },
            { key: 'classicalMl', label: 'Classical ML (classification, regression, clustering)', checked: s.aiWorkTypes.classicalMl },
            { key: 'computerVision', label: 'Computer vision', checked: s.aiWorkTypes.computerVision },
            { key: 'nlp', label: 'NLP / text processing (non-LLM)', checked: s.aiWorkTypes.nlp },
            { key: 'dataPipeline', label: 'Data pipeline / analytics infrastructure', checked: s.aiWorkTypes.dataPipeline },
            { key: 'other', label: 'Other (describe below)', checked: s.aiWorkTypes.other },
          ]}
          onChange={(key, checked) =>
            update((p) => ({
              ...p,
              section5: {
                ...p.section5,
                aiWorkTypes: { ...p.section5.aiWorkTypes, [key]: checked },
              },
            }))
          }
        />
        {s.aiWorkTypes.other && (
          <TextField label='If "Other" — describe the type of work' value={s.aiWorkOther} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, aiWorkOther: v } }))} multiline />
        )}
        <TextField label="Are there technology stack constraints?" value={s.techStackConstraints} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, techStackConstraints: v } }))} multiline rows={2} />
        <TextField label="What is the deployment target?" value={s.deploymentTarget} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, deploymentTarget: v } }))} required multiline rows={2} />
      </SubSection>

      <SubSection title="5.3 Performance & Infrastructure Constraints">
        <div className="field-row">
          <TextField label="Latency Requirement" value={s.latencyRequirement} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, latencyRequirement: v } }))} />
          <TextField label="Throughput Requirement" value={s.throughputRequirement} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, throughputRequirement: v } }))} />
        </div>
        <div className="field-row">
          <TextField label="Cost Per Call Constraint" value={s.costPerCall} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, costPerCall: v } }))} />
          <TextField label="Uptime / Availability SLA" value={s.uptimeSla} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, uptimeSla: v } }))} />
        </div>
        <TextField label="Infrastructure Constraints" value={s.infrastructureConstraints} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, infrastructureConstraints: v } }))} multiline rows={2} />
      </SubSection>

      <SubSection title="5.4 Error Handling & Fallback Behavior" note="AI systems fail probabilistically. This section must be agreed upon BEFORE design begins.">
        <TextField label="What is the acceptable error rate?" value={s.acceptableErrorRate} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, acceptableErrorRate: v } }))} required multiline rows={2} />
        <TextField label="What happens when the model is wrong?" value={s.whenModelWrong} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, whenModelWrong: v } }))} required multiline rows={3} />
        <TextField label="What happens when the system is unavailable?" value={s.whenUnavailable} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, whenUnavailable: v } }))} required multiline rows={2} />
        <CheckboxGroup
          label="Confidence / Output Handling"
          items={[
            { key: 'confidenceScore', label: 'System returns confidence score with every output', checked: s.confidenceHandling.confidenceScore },
            { key: 'lowConfidenceReview', label: 'Low-confidence outputs are flagged for human review', checked: s.confidenceHandling.lowConfidenceReview },
            { key: 'lowConfidenceReject', label: 'Low-confidence outputs are rejected and fallback triggered', checked: s.confidenceHandling.lowConfidenceReject },
            { key: 'allLogged', label: 'All outputs are logged for post-hoc review', checked: s.confidenceHandling.allLogged },
            { key: 'userFeedback', label: 'User can provide feedback / correction on outputs', checked: s.confidenceHandling.userFeedback },
            { key: 'autoApproved', label: 'Outputs above a threshold are auto-approved', checked: s.confidenceHandling.autoApproved },
          ]}
          onChange={(key, checked) =>
            update((p) => ({
              ...p,
              section5: {
                ...p.section5,
                confidenceHandling: { ...p.section5.confidenceHandling, [key]: checked },
              },
            }))
          }
        />
        <TextField label="Bias, Fairness & Ethical Considerations" value={s.biasFairness} onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, biasFairness: v } }))} multiline rows={3} />
      </SubSection>
    </section>
  )
}

export function Section6({ data, update }: Props) {
  const type = data.section1.projectType

  if (!type) {
    return (
      <section className="form-section">
        <SectionHeader number="06" title="Project Context (Branching)" subtitle="Complete Section 6A OR Section 6B" />
        <div className="gate-locked-banner">
          Select a Project Type in Section 1 to unlock this section.
        </div>
      </section>
    )
  }

  if (type === 'client-services') {
    const s = data.section6A
    return (
      <section className="form-section">
        <SectionHeader number="06" title="Project Context — 6A Client Services" subtitle="Skip if Internal Product" />
        <SubSection title="6A — Client Services">
          <TextField label="Client Name" value={s.clientName} onChange={(v) => update((p) => ({ ...p, section6A: { ...p.section6A, clientName: v } }))} required />
          <TextField label="Client Point of Contact (Name & Email)" value={s.clientPoc} onChange={(v) => update((p) => ({ ...p, section6A: { ...p.section6A, clientPoc: v } }))} required />
          <TextField label="Is this in scope of an existing contract?" value={s.contractScope} onChange={(v) => update((p) => ({ ...p, section6A: { ...p.section6A, contractScope: v } }))} required multiline rows={2} />
          <TextField label="Has the client provided written confirmation of this request?" value={s.writtenConfirmation} onChange={(v) => update((p) => ({ ...p, section6A: { ...p.section6A, writtenConfirmation: v } }))} multiline rows={2} />
          <TextField label="What is the expected deliverable format?" value={s.deliverableFormat} onChange={(v) => update((p) => ({ ...p, section6A: { ...p.section6A, deliverableFormat: v } }))} required multiline rows={2} />
          <TextField label="Who approves completion on the client side?" value={s.clientApprover} onChange={(v) => update((p) => ({ ...p, section6A: { ...p.section6A, clientApprover: v } }))} required />
          <TextField label="Client Infrastructure & Access Dependencies" value={s.infrastructureDependencies} onChange={(v) => update((p) => ({ ...p, section6A: { ...p.section6A, infrastructureDependencies: v } }))} multiline rows={2} />
          <TextField label="Commercial Constraints" value={s.commercialConstraints} onChange={(v) => update((p) => ({ ...p, section6A: { ...p.section6A, commercialConstraints: v } }))} multiline rows={2} />
        </SubSection>
      </section>
    )
  }

  const s = data.section6B
  return (
    <section className="form-section">
      <SectionHeader number="06" title="Project Context — 6B Internal Product" subtitle="Skip if Client Services" />
      <SubSection title="6B — Internal Product">
        <TextField label="Which product area does this touch?" value={s.productArea} onChange={(v) => update((p) => ({ ...p, section6B: { ...p.section6B, productArea: v } }))} required />
        <EditableChoiceGroup
          label="Roadmap Status"
          value={s.roadmapStatus}
          onChange={(v) => update((p) => ({ ...p, section6B: { ...p.section6B, roadmapStatus: v as FormData['section6B']['roadmapStatus'] } }))}
          optionKey="roadmapStatus"
          required
        />
        <TextField label="Internal Stakeholder / Decision Maker" value={s.internalStakeholder} onChange={(v) => update((p) => ({ ...p, section6B: { ...p.section6B, internalStakeholder: v } }))} required />
        <TextField label="User Research or Evidence Backing This Request" value={s.userResearchEvidence} onChange={(v) => update((p) => ({ ...p, section6B: { ...p.section6B, userResearchEvidence: v } }))} multiline rows={3} />
        <EditableChoiceGroup
          label="Appetite (how much is this worth?)"
          value={s.appetite}
          onChange={(v) => update((p) => ({ ...p, section6B: { ...p.section6B, appetite: v as FormData['section6B']['appetite'] } }))}
          optionKey="appetite"
          required
        />
      </SubSection>
    </section>
  )
}

export function Section7({ data, update }: Props) {
  const s = data.section7
  const showValidation = useShowValidation()
  const raciIncomplete = showValidation && !isRaciFilled(s.raci)

  return (
    <section className="form-section">
      <SectionHeader number="07" title="Constraints, Risks & Open Questions" subtitle="PMI Risk Register + BABOK Dependency Analysis" />

      <SubSection title="7.1 Project Constraints">
        <TextField label="Time Constraints" value={s.timeConstraints} onChange={(v) => update((p) => ({ ...p, section7: { ...p.section7, timeConstraints: v } }))} required multiline rows={2} />
        <TextField label="Resource Constraints" value={s.resourceConstraints} onChange={(v) => update((p) => ({ ...p, section7: { ...p.section7, resourceConstraints: v } }))} required multiline rows={2} />
        <TextField label="Technology Constraints" value={s.technologyConstraints} onChange={(v) => update((p) => ({ ...p, section7: { ...p.section7, technologyConstraints: v } }))} multiline rows={2} />
        <TextField label="Budget Constraints" value={s.budgetConstraints} onChange={(v) => update((p) => ({ ...p, section7: { ...p.section7, budgetConstraints: v } }))} multiline rows={2} />
      </SubSection>

      <SubSection title="7.2 Risk Register">
        <DynamicTable
          columns={[
            { key: 'risk', label: 'Risk / Assumption', multiline: true, required: true },
            { key: 'likelihood', label: 'Likelihood', type: 'select', optionKey: 'hml', required: true },
            { key: 'impact', label: 'Impact', type: 'select', optionKey: 'hml', required: true },
            { key: 'mitigation', label: 'Mitigation Strategy', multiline: true, required: true },
          ]}
          requireCompleteRow
          rows={s.risks}
          onChange={(i, key, value) =>
            update((p) => {
              const risks = [...p.section7.risks]
              risks[i] = { ...risks[i], [key]: value }
              return { ...p, section7: { ...p.section7, risks } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section7: {
                ...p.section7,
                risks: [...p.section7.risks, { risk: '', likelihood: '', impact: '', mitigation: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section7: { ...p.section7, risks: p.section7.risks.filter((_, idx) => idx !== i) },
            }))
          }
        />
      </SubSection>

      <SubSection
        title="7.3 RACI Matrix"
        note="R = Responsible · A = Accountable · C = Consulted · I = Informed. At least one assignment (R/A/C/I) is required."
      >
        <div className={`dynamic-table-wrap ${raciIncomplete ? 'field-invalid' : ''}`}>
          <table className="dynamic-table raci-table">
            <thead>
              <tr>
                <th>Activity / Decision</th>
                <th>AI Lead</th>
                <th>AI Eng 1</th>
                <th>AI Eng 2</th>
                <th>Stakeholder</th>
              </tr>
            </thead>
            <tbody>
              {s.raci.map((row, i) => (
                <tr key={row.activity}>
                  <td className="raci-activity">{row.activity}</td>
                  {(['aiLead', 'aiEng1', 'aiEng2', 'stakeholder'] as const).map((col) => (
                    <td key={col}>
                      <EditableSelect
                        compact
                        optionKey="raci"
                        value={row[col]}
                        onChange={(v) =>
                          update((p) => {
                            const raci = [...p.section7.raci]
                            raci[i] = { ...raci[i], [col]: v as typeof row.aiLead }
                            return { ...p, section7: { ...p.section7, raci } }
                          })
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SubSection>

      <SubSection title="7.4 Open Questions & Unknowns">
        <DynamicTable
          columns={[
            { key: 'question', label: 'Question / Unknown', multiline: true, required: true },
            { key: 'owner', label: 'Owner', required: true },
            { key: 'dueDate', label: 'Due Date', required: true },
            { key: 'status', label: 'Status', type: 'select', optionKey: 'questionStatus' },
          ]}
          requireCompleteRow
          rows={s.openQuestions}
          onChange={(i, key, value) =>
            update((p) => {
              const openQuestions = [...p.section7.openQuestions]
              openQuestions[i] = { ...openQuestions[i], [key]: value }
              return { ...p, section7: { ...p.section7, openQuestions } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section7: {
                ...p.section7,
                openQuestions: [
                  ...p.section7.openQuestions,
                  { question: '', owner: '', dueDate: '', status: '' },
                ],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section7: {
                ...p.section7,
                openQuestions: p.section7.openQuestions.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>
    </section>
  )
}

interface IncompleteSection {
  id: number
  title: string
  missing: string[]
}

interface Section8Props extends Props {
  upstreamIncomplete?: boolean
  incompleteSections?: IncompleteSection[]
  onGoToSection?: (sectionId: number) => void
}

export function Section8({
  data,
  update,
  upstreamIncomplete = false,
  incompleteSections = [],
  onGoToSection,
}: Section8Props) {
  const s = data.section8
  const isClient = data.section1.projectType === 'client-services'
  const showValidation = useShowValidation()
  const signaturesIncomplete =
    showValidation &&
    s.signatures.filter(
      (sig) =>
        sig.name.trim().length > 0 && sig.role.trim().length > 0 && sig.date.trim().length > 0,
    ).length < 3
  const gateApproved = isGateApproved(data)
  const gateReview = validateSection8(data)
  const gateDecisionApprovedButIncomplete =
    s.gateDecision === 'approved' && !gateApproved && gateReview.missing.length > 0

  return (
    <section className="form-section">
      <SectionHeader
        number="08"
        title="Definition of Ready — Gate Review"
        subtitle="No project proceeds to System Design without passing this gate"
        callout="The AI Lead reviews every item on this checklist. If any mandatory item is unchecked, the project is returned for revision."
      />

      {gateApproved && (
        <div className="validation-banner mb-4 text-left border-green-700 bg-green-50">
          <p className="mb-3">
            <strong>Gate approved.</strong> Pre-System Design is complete. Phase 2 (PRD Creation) is now unlocked.
          </p>
          <Link
            to="/prd"
            className="inline-block border-2 border-on-background bg-primary text-on-primary font-bold px-4 py-1.5 text-xs no-underline outset-button"
            style={{ fontFamily: 'var(--font-label)' }}
          >
            Proceed to PRD Creation →
          </Link>
        </div>
      )}

      {gateDecisionApprovedButIncomplete && (
        <div className="validation-banner mb-4 text-left border-red-600 bg-red-50">
          <strong>Almost there.</strong> Gate decision is Approved, but these items are still required:{' '}
          {gateReview.missing.join(', ')}
        </div>
      )}

      {upstreamIncomplete && incompleteSections.length > 0 && (
        <div className="validation-banner mb-4 text-left border-red-600 bg-red-50">
          <p className="mb-2">
            <strong>Sections 1–7 are not complete yet.</strong> You can still work on this gate review, but fix the
            items below before final sign-off. Check the left sidebar for section scores (e.g. 4/5 means one item is
            still missing).
          </p>
          <ul className="space-y-3">
            {incompleteSections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  className="text-left font-bold text-primary underline bg-transparent border-0 cursor-pointer p-0"
                  onClick={() => onGoToSection?.(section.id)}
                >
                  Section {String(section.id).padStart(2, '0')}: {section.title}
                </button>
                <ul className="mt-1 ml-4 list-disc text-sm">
                  {section.missing.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      <GateChecklist
        title="8.1 Requirements Completeness"
        items={GATE_REQUIREMENTS.requirementsCompleteness}
        values={s.requirementsCompleteness}
        onChange={(id, checked) =>
          update((p) => ({
            ...p,
            section8: {
              ...p.section8,
              requirementsCompleteness: { ...p.section8.requirementsCompleteness, [id]: checked },
            },
          }))
        }
      />

      <GateChecklist
        title="8.2 AI Readiness"
        items={GATE_REQUIREMENTS.aiReadiness}
        values={s.aiReadiness}
        onChange={(id, checked) =>
          update((p) => ({
            ...p,
            section8: {
              ...p.section8,
              aiReadiness: { ...p.section8.aiReadiness, [id]: checked },
            },
          }))
        }
      />

      <GateChecklist
        title="8.3 Stakeholder Alignment"
        items={GATE_REQUIREMENTS.stakeholderAlignment}
        values={s.stakeholderAlignment}
        onChange={(id, checked) =>
          update((p) => ({
            ...p,
            section8: {
              ...p.section8,
              stakeholderAlignment: { ...p.section8.stakeholderAlignment, [id]: checked },
            },
          }))
        }
      />

      {isClient && (
        <GateChecklist
          title="8.4 Commercial & Contractual (Client Services only)"
          items={GATE_REQUIREMENTS.commercialContractual}
          values={s.commercialContractual}
          onChange={(id, checked) =>
            update((p) => ({
              ...p,
              section8: {
                ...p.section8,
                commercialContractual: { ...p.section8.commercialContractual, [id]: checked },
              },
            }))
          }
        />
      )}

      <SubSection title="8.5 Gate Decision">
        <EditableChoiceGroup
          label="Gate Decision"
          value={s.gateDecision}
          onChange={(v) =>
            update((p) => ({
              ...p,
              section8: { ...p.section8, gateDecision: v as FormData['section8']['gateDecision'] },
            }))
          }
          optionKey="gateDecision"
          required
        />
        <TextField
          label="Gate Review Notes"
          value={s.gateReviewNotes}
          onChange={(v) => update((p) => ({ ...p, section8: { ...p.section8, gateReviewNotes: v } }))}
          multiline
          rows={4}
          hint="If returning for revision, list exactly what needs to be corrected and by whom."
        />
      </SubSection>

      <SubSection title="8.6 Signatures" note="All three parties must sign before design begins.">
        <div className={`dynamic-table-wrap ${signaturesIncomplete ? 'field-invalid' : ''}`}>
          <table className="dynamic-table">
            <thead>
              <tr>
                <th>Name *</th>
                <th>Role *</th>
                <th>Signature</th>
                <th>Date *</th>
              </tr>
            </thead>
            <tbody>
              {s.signatures.map((row, i) => (
                <tr key={i}>
                  {(['name', 'role', 'signature', 'date'] as const).map((key) => {
                    const isRequired = key !== 'signature'
                    const cellInvalid = Boolean(showValidation && isRequired && !row[key].trim())

                    return (
                      <td key={key} className={cellInvalid ? 'field-invalid-cell' : undefined}>
                        <input
                          type={key === 'date' ? 'date' : 'text'}
                          value={row[key]}
                          onChange={(e) =>
                            update((p) => {
                              const signatures = [...p.section8.signatures]
                              signatures[i] = { ...signatures[i], [key]: e.target.value }
                              return { ...p, section8: { ...p.section8, signatures } }
                            })
                          }
                          aria-invalid={cellInvalid}
                          className={cellInvalid ? 'input-invalid' : undefined}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SubSection>
    </section>
  )
}
