import type { SystemDesignFormData } from '../../types/systemDesignForm'
import { DynamicTable, SectionHeader, SelectField, SubSection, TextField } from '../FormFields'
import { validateSections1to5 } from '../../utils/systemDesignValidation'

interface Props {
  data: SystemDesignFormData
  update: (updater: (prev: SystemDesignFormData) => SystemDesignFormData) => void
}

export function SystemDesignSection4({ data, update }: Props) {
  const s = data.section4
  return (
    <section className="form-section">
      <SectionHeader
        number="04"
        title="APIs & Interfaces"
        subtitle="Endpoints · Integrations · Contracts"
        callout="Define the interfaces the system exposes and consumes."
      />
      <SubSection title="4.1 Endpoints">
        <DynamicTable
          columns={[
            { key: 'method', label: 'Method', required: true, width: '90px' },
            { key: 'path', label: 'Path', required: true },
            { key: 'purpose', label: 'Purpose', multiline: true },
            { key: 'auth', label: 'Auth' },
          ]}
          rows={s.endpoints}
          onChange={(i, key, value) =>
            update((p) => {
              const endpoints = [...p.section4.endpoints]
              endpoints[i] = { ...endpoints[i], [key]: value }
              return { ...p, section4: { ...p.section4, endpoints } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section4: {
                ...p.section4,
                endpoints: [...p.section4.endpoints, { method: '', path: '', purpose: '', auth: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section4: { ...p.section4, endpoints: p.section4.endpoints.filter((_, idx) => idx !== i) },
            }))
          }
          requireCompleteRow
        />
      </SubSection>
      <SubSection title="4.2 External Integrations">
        <DynamicTable
          columns={[
            { key: 'service', label: 'Service', required: true },
            { key: 'purpose', label: 'Purpose', multiline: true },
            { key: 'protocol', label: 'Protocol' },
          ]}
          rows={s.externalIntegrations}
          onChange={(i, key, value) =>
            update((p) => {
              const externalIntegrations = [...p.section4.externalIntegrations]
              externalIntegrations[i] = { ...externalIntegrations[i], [key]: value }
              return { ...p, section4: { ...p.section4, externalIntegrations } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section4: {
                ...p.section4,
                externalIntegrations: [
                  ...p.section4.externalIntegrations,
                  { service: '', purpose: '', protocol: '' },
                ],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section4: {
                ...p.section4,
                externalIntegrations: p.section4.externalIntegrations.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>
      <SubSection title="4.3 Data Contracts">
        <TextField
          label="Request/response contracts & schemas"
          value={s.contracts}
          onChange={(v) => update((p) => ({ ...p, section4: { ...p.section4, contracts: v } }))}
          multiline
          rows={3}
        />
      </SubSection>
    </section>
  )
}

export function SystemDesignSection5({ data, update }: Props) {
  const s = data.section5
  const field = (key: keyof SystemDesignFormData['section5'], label: string, required = false) => (
    <TextField
      label={label}
      value={s[key] as string}
      onChange={(v) => update((p) => ({ ...p, section5: { ...p.section5, [key]: v } }))}
      required={required}
      multiline
      rows={3}
    />
  )
  return (
    <section className="form-section">
      <SectionHeader
        number="05"
        title="Infrastructure & Deployment"
        subtitle="Hosting · Scaling · CI/CD · Security"
        callout="Define how the system is deployed, scaled, secured, and operated."
      />
      <SubSection title="5.1 Hosting Environment">
        {field('hostingEnvironment', 'Where will this run?', true)}
      </SubSection>
      <SubSection title="5.2 Scaling Strategy">{field('scalingStrategy', 'How will it scale?', true)}</SubSection>
      <SubSection title="5.3 CI/CD Pipeline">{field('cicdPipeline', 'Build & deployment pipeline')}</SubSection>
      <SubSection title="5.4 Monitoring & Observability">
        {field('monitoring', 'Logging, metrics, alerting')}
      </SubSection>
      <SubSection title="5.5 Security Measures">
        <DynamicTable
          columns={[
            { key: 'measure', label: 'Measure', required: true },
            { key: 'description', label: 'Description', multiline: true },
          ]}
          rows={s.securityMeasures}
          onChange={(i, key, value) =>
            update((p) => {
              const securityMeasures = [...p.section5.securityMeasures]
              securityMeasures[i] = { ...securityMeasures[i], [key]: value }
              return { ...p, section5: { ...p.section5, securityMeasures } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section5: {
                ...p.section5,
                securityMeasures: [...p.section5.securityMeasures, { measure: '', description: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section5: {
                ...p.section5,
                securityMeasures: p.section5.securityMeasures.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>
      <SubSection title="5.6 Estimated Cost">{field('estimatedCost', 'Rough infrastructure cost estimate')}</SubSection>
    </section>
  )
}

export function SystemDesignSection6({ data, update }: Props) {
  const s = data.section6
  const locked = !validateSections1to5(data)
  return (
    <section className="form-section">
      <SectionHeader
        number="06"
        title="Review & Sign-off"
        subtitle="Approval"
        callout="Confirm the design is reviewed and approved before development begins."
      />
      {locked && (
        <div className="note-banner">
          Complete sections 1–5 before marking the design as approved.
        </div>
      )}
      <SubSection title="6.1 Design Status">
        <SelectField
          label="Design Status"
          value={s.designStatus}
          onChange={(v) =>
            update((p) => ({
              ...p,
              section6: { ...p.section6, designStatus: v as SystemDesignFormData['section6']['designStatus'] },
            }))
          }
          required
          options={[
            { value: 'draft', label: 'Draft' },
            { value: 'in-review', label: 'In Review' },
            { value: 'approved', label: 'Approved' },
            { value: 'needs-revision', label: 'Needs Revision' },
          ]}
        />
      </SubSection>
      <SubSection title="6.2 Review Notes">
        <TextField
          label="Review notes"
          value={s.reviewNotes}
          onChange={(v) => update((p) => ({ ...p, section6: { ...p.section6, reviewNotes: v } }))}
          multiline
          rows={3}
        />
      </SubSection>
      <SubSection title="6.3 Sign-off">
        <DynamicTable
          columns={[
            { key: 'name', label: 'Name', required: true },
            { key: 'role', label: 'Role', required: true },
            { key: 'signature', label: 'Signature' },
            { key: 'date', label: 'Date', required: true },
          ]}
          rows={s.signatures}
          onChange={(i, key, value) =>
            update((p) => {
              const signatures = [...p.section6.signatures]
              signatures[i] = { ...signatures[i], [key]: value }
              return { ...p, section6: { ...p.section6, signatures } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section6: {
                ...p.section6,
                signatures: [...p.section6.signatures, { name: '', role: '', signature: '', date: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section6: { ...p.section6, signatures: p.section6.signatures.filter((_, idx) => idx !== i) },
            }))
          }
          minRows={2}
        />
      </SubSection>
    </section>
  )
}
