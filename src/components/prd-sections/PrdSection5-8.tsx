import type { FormData } from '../../types/form'
import type { PrdFormData } from '../../types/prdForm'
import {
  DynamicTable,
  SectionHeader,
  SubSection,
  TextField,
} from '../FormFields'
import { EditableChoiceGroup } from '../EditableChoiceGroup'
import { useShowValidation } from '../../context/ValidationContext'

interface Props {
  data: PrdFormData
  update: (updater: (prev: PrdFormData) => PrdFormData) => void
  charterData?: FormData | null
  onProceedToSystemDesign?: () => void
}

function nfrTable(
  _label: string,
  rows: PrdFormData['section5']['performanceRequirements'],
  onChange: (rows: PrdFormData['section5']['performanceRequirements']) => void,
) {
  return (
    <DynamicTable
      columns={[
        { key: 'requirement', label: 'Requirement', multiline: true, required: true },
        { key: 'specification', label: 'Specification / Target', multiline: true },
      ]}
      rows={rows}
      onChange={(i, key, value) => {
        const next = [...rows]
        next[i] = { ...next[i], [key]: value }
        onChange(next)
      }}
      onAddRow={() => onChange([...rows, { requirement: '', specification: '' }])}
      onRemoveRow={(i) => onChange(rows.filter((_, idx) => idx !== i))}
    />
  )
}

export function PrdSection5({ data, update }: Props) {
  const s = data.section5
  return (
    <section className="form-section">
      <SectionHeader
        number="05"
        title="Non-Functional Requirements"
        subtitle="Performance · Security · Scalability · Compliance"
        callout="These constrain how the system is built and operated."
      />
      <SubSection title="5.1 Performance Requirements">
        {nfrTable('Performance', s.performanceRequirements, (rows) =>
          update((p) => ({ ...p, section5: { ...p.section5, performanceRequirements: rows } })))}
      </SubSection>
      <SubSection title="5.2 Security Requirements">
        {nfrTable('Security', s.securityRequirements, (rows) =>
          update((p) => ({ ...p, section5: { ...p.section5, securityRequirements: rows } })))}
      </SubSection>
      <SubSection title="5.3 Scalability Requirements">
        {nfrTable('Scalability', s.scalabilityRequirements, (rows) =>
          update((p) => ({ ...p, section5: { ...p.section5, scalabilityRequirements: rows } })))}
      </SubSection>
      <SubSection title="5.4 Compliance & Regulatory">
        {nfrTable('Compliance', s.complianceRequirements, (rows) =>
          update((p) => ({ ...p, section5: { ...p.section5, complianceRequirements: rows } })))}
      </SubSection>
      <SubSection title="5.5 Usability & Accessibility">
        {nfrTable('Usability', s.usabilityRequirements, (rows) =>
          update((p) => ({ ...p, section5: { ...p.section5, usabilityRequirements: rows } })))}
      </SubSection>
    </section>
  )
}

export function PrdSection6({ data, update, charterData }: Props) {
  const s = data.section6
  const requiresAi = charterData?.section1.includesAiWork ?? true

  return (
    <section className="form-section">
      <SectionHeader
        number="06"
        title="Data & AI Requirements"
        subtitle="Data Sources · Model Criteria · Evaluation"
        callout={requiresAi ? 'Define data needs and AI-specific criteria for this project.' : 'Define data needs. AI-specific fields are optional for this project.'}
      />
      <SubSection title="6.1 Data Sources">
        <DynamicTable
          columns={[
            { key: 'source', label: 'Data Source', multiline: true, required: true },
            { key: 'type', label: 'Type (DB / API / File / Feed)', required: true },
            { key: 'volume', label: 'Est. Volume' },
            { key: 'accessMethod', label: 'Access Method', multiline: true },
          ]}
          rows={s.dataSources}
          onChange={(i, key, value) =>
            update((p) => {
              const dataSources = [...p.section6.dataSources]
              dataSources[i] = { ...dataSources[i], [key]: value }
              return { ...p, section6: { ...p.section6, dataSources } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section6: {
                ...p.section6,
                dataSources: [...p.section6.dataSources, { source: '', type: '', volume: '', accessMethod: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section6: {
                ...p.section6,
                dataSources: p.section6.dataSources.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
        <TextField
          label="Data schema / format expected"
          value={s.dataSchemaFormat}
          onChange={(v) => update((p) => ({ ...p, section6: { ...p.section6, dataSchemaFormat: v } }))}
          multiline
          rows={2}
          hint="File formats, schema structure, field definitions."
        />
        <TextField
          label="Estimated data volume"
          value={s.dataVolumeEstimate}
          onChange={(v) => update((p) => ({ ...p, section6: { ...p.section6, dataVolumeEstimate: v } }))}
          multiline
          hint="Rows, GB/TB, growth rate, retention needs."
        />
      </SubSection>
      <SubSection title="6.2 Data Access Requirements">
        <DynamicTable
          columns={[
            { key: 'role', label: 'Role / Actor', required: true },
            { key: 'accessLevel', label: 'Access Level (Read / Write / Admin)', required: true },
            { key: 'condition', label: 'Conditions / Constraints', multiline: true },
          ]}
          rows={s.dataAccessRequirements}
          onChange={(i, key, value) =>
            update((p) => {
              const dataAccessRequirements = [...p.section6.dataAccessRequirements]
              dataAccessRequirements[i] = { ...dataAccessRequirements[i], [key]: value }
              return { ...p, section6: { ...p.section6, dataAccessRequirements } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section6: {
                ...p.section6,
                dataAccessRequirements: [...p.section6.dataAccessRequirements, { role: '', accessLevel: '', condition: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section6: {
                ...p.section6,
                dataAccessRequirements: p.section6.dataAccessRequirements.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>

      {requiresAi && (
        <SubSection title="6.3 AI Model Requirements">
          <TextField
            label="Model selection criteria"
            value={s.aiModelSelectionCriteria}
            onChange={(v) => update((p) => ({ ...p, section6: { ...p.section6, aiModelSelectionCriteria: v } }))}
            required
            multiline
            rows={2}
            hint="Constraints on model type (LLM, classifier, etc.), size, cost, latency."
          />
          <TextField
            label="Evaluation criteria"
            value={s.aiEvalCriteria}
            onChange={(v) => update((p) => ({ ...p, section6: { ...p.section6, aiEvalCriteria: v } }))}
            required
            multiline
            rows={2}
            hint="Accuracy, precision/recall, offline eval dataset, human eval plan."
          />
          <TextField
            label="Fallback behaviour when model fails"
            value={s.aiFallbackBehavior}
            onChange={(v) => update((p) => ({ ...p, section6: { ...p.section6, aiFallbackBehavior: v } }))}
            multiline
            rows={2}
            hint="Degraded mode, static response, human-in-the-loop, circuit breaker."
          />
          <TextField
            label="Labeling / annotation needs"
            value={s.aiLabelingAnnotationNeeds}
            onChange={(v) => update((p) => ({ ...p, section6: { ...p.section6, aiLabelingAnnotationNeeds: v } }))}
            multiline
            rows={2}
            hint="Do we need labelled data? Who will label? Estimated volume and cost."
          />
          <TextField
            label="Bias, fairness & ethical considerations"
            value={s.aiBiasFairness}
            onChange={(v) => update((p) => ({ ...p, section6: { ...p.section6, aiBiasFairness: v } }))}
            multiline
            rows={2}
            hint="Known biases in training data, protected attributes, fairness metrics."
          />
        </SubSection>
      )}
    </section>
  )
}

export function PrdSection7({ data, update }: Props) {
  const s = data.section7
  return (
    <section className="form-section">
      <SectionHeader
        number="07"
        title="Rollout & Integrations"
        subtitle="Integration Points · Release Plan · Risks"
        callout="Define how this work integrates with existing systems and how it will be released."
      />
      <SubSection title="7.1 Integration Points">
        <DynamicTable
          columns={[
            { key: 'system', label: 'System / API', multiline: true, required: true },
            { key: 'integrationType', label: 'Integration Type', required: true },
            { key: 'protocol', label: 'Protocol / Method', multiline: true },
          ]}
          rows={s.integrationPoints}
          onChange={(i, key, value) =>
            update((p) => {
              const integrationPoints = [...p.section7.integrationPoints]
              integrationPoints[i] = { ...integrationPoints[i], [key]: value }
              return { ...p, section7: { ...p.section7, integrationPoints } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section7: {
                ...p.section7,
                integrationPoints: [...p.section7.integrationPoints, { system: '', integrationType: '', protocol: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section7: {
                ...p.section7,
                integrationPoints: p.section7.integrationPoints.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>
      <SubSection title="7.2 Third-Party Dependencies">
        <DynamicTable
          columns={[
            { key: 'dependency', label: 'Dependency', multiline: true, required: true },
            { key: 'version', label: 'Version' },
            { key: 'notes', label: 'Notes / License / Status', multiline: true },
          ]}
          rows={s.thirdPartyDependencies}
          onChange={(i, key, value) =>
            update((p) => {
              const thirdPartyDependencies = [...p.section7.thirdPartyDependencies]
              thirdPartyDependencies[i] = { ...thirdPartyDependencies[i], [key]: value }
              return { ...p, section7: { ...p.section7, thirdPartyDependencies } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section7: {
                ...p.section7,
                thirdPartyDependencies: [...p.section7.thirdPartyDependencies, { dependency: '', version: '', notes: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section7: {
                ...p.section7,
                thirdPartyDependencies: p.section7.thirdPartyDependencies.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>
      <SubSection title="7.3 Release Strategy">
        <TextField
          label="Release strategy"
          value={s.releaseStrategy}
          onChange={(v) => update((p) => ({ ...p, section7: { ...p.section7, releaseStrategy: v } }))}
          required
          multiline
          rows={2}
          hint="Phased rollout, canary, feature flag, big bang. Who is exposed first?"
        />
      </SubSection>
      <SubSection title="7.4 Key Milestones">
        <DynamicTable
          columns={[
            { key: 'milestone', label: 'Milestone', multiline: true, required: true },
            { key: 'date', label: 'Date', required: true },
            { key: 'owner', label: 'Owner', required: true },
          ]}
          rows={s.keyMilestones}
          onChange={(i, key, value) =>
            update((p) => {
              const keyMilestones = [...p.section7.keyMilestones]
              keyMilestones[i] = { ...keyMilestones[i], [key]: value }
              return { ...p, section7: { ...p.section7, keyMilestones } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section7: {
                ...p.section7,
                keyMilestones: [...p.section7.keyMilestones, { milestone: '', date: '', owner: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section7: {
                ...p.section7,
                keyMilestones: p.section7.keyMilestones.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>
      <SubSection title="7.5 Rollback Plan">
        <TextField
          label="Rollback plan"
          value={s.rollbackPlan}
          onChange={(v) => update((p) => ({ ...p, section7: { ...p.section7, rollbackPlan: v } }))}
          multiline
          rows={2}
          hint="How do we undo this release? Feature flags, DB migration rollback, data restore."
        />
      </SubSection>
      <SubSection title="7.6 Risk Register">
        <DynamicTable
          columns={[
            { key: 'risk', label: 'Risk', multiline: true, required: true },
            { key: 'likelihood', label: 'Likelihood', type: 'select', optionKey: 'hml', required: true },
            { key: 'impact', label: 'Impact', type: 'select', optionKey: 'hml', required: true },
            { key: 'mitigation', label: 'Mitigation', multiline: true },
          ]}
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
      <SubSection title="7.7 Open Questions & Unknowns">
        <DynamicTable
          columns={[
            { key: 'question', label: 'Question / Unknown', multiline: true, required: true },
            { key: 'owner', label: 'Owner', required: true },
            { key: 'dueDate', label: 'Due Date', required: true },
            { key: 'status', label: 'Status', type: 'select', optionKey: 'questionStatus' },
          ]}
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

export function PrdSection8({ data, update, onProceedToSystemDesign }: Props) {
  const s = data.section8
  const showValidation = useShowValidation()
  const signaturesIncomplete =
    showValidation &&
    s.signatures.filter(
      (sig) => sig.name.trim().length > 0 && sig.role.trim().length > 0 && sig.date.trim().length > 0,
    ).length < 2
  const prdApproved = data.section8.prdStatus === 'approved' &&
    data.section8.signatures.filter(
      (sig) => sig.name.trim().length > 0 && sig.role.trim().length > 0 && sig.date.trim().length > 0,
    ).length >= 2

  return (
    <section className="form-section">
      <SectionHeader
        number="08"
        title="Review & Sign-off"
        subtitle="PRD Approval"
        callout="The PRD must be reviewed and approved before System Design begins."
      />

      {prdApproved && (
        <div className="validation-banner mb-4 text-left border-green-700 bg-green-50">
          <p className="mb-3">
            <strong>PRD approved.</strong> Phase 2 is complete. System Design can begin.
          </p>
          <button
            type="button"
            onClick={onProceedToSystemDesign}
            className="inline-block border-2 border-on-background bg-primary text-on-primary font-bold px-4 py-1.5 text-xs outset-button"
            style={{ fontFamily: 'var(--font-label)' }}
          >
            Proceed to System Design →
          </button>
        </div>
      )}

      <SubSection title="8.1 PRD Status">
        <EditableChoiceGroup
          label="PRD Status"
          value={s.prdStatus}
          onChange={(v) =>
            update((p) => ({
              ...p,
              section8: { ...p.section8, prdStatus: v as PrdFormData['section8']['prdStatus'] },
            }))
          }
          optionKey="prdStatus"
          required
        />
        <TextField
          label="Review Notes"
          value={s.reviewNotes}
          onChange={(v) => update((p) => ({ ...p, section8: { ...p.section8, reviewNotes: v } }))}
          multiline
          rows={4}
          hint="Review feedback, required changes, or approval comments."
        />
      </SubSection>

      <SubSection title="8.2 Signatures" note="Both parties must sign before the PRD is approved.">
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
