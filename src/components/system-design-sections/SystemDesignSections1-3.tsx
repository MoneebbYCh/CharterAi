import type { SystemDesignFormData } from '../../types/systemDesignForm'
import { DynamicTable, SectionHeader, SubSection, TextField } from '../FormFields'

interface Props {
  data: SystemDesignFormData
  update: (updater: (prev: SystemDesignFormData) => SystemDesignFormData) => void
}

export function SystemDesignSection1({ data, update }: Props) {
  const s = data.section1
  return (
    <section className="form-section">
      <SectionHeader
        number="01"
        title="Architecture Overview"
        subtitle="Components · Data Flow · Key Decisions"
        callout="Describe the high-level architecture. A new engineer should understand the system shape from this section."
      />
      <SubSection title="1.1 Architecture Summary">
        <TextField
          label="How is the system structured?"
          value={s.architectureSummary}
          onChange={(v) => update((p) => ({ ...p, section1: { ...p.section1, architectureSummary: v } }))}
          required
          multiline
          rows={4}
          hint="Describe the major layers/services and how they fit together."
        />
      </SubSection>
      <SubSection title="1.2 Components" note="List the main components/services and what each is responsible for.">
        <DynamicTable
          columns={[
            { key: 'name', label: 'Component', required: true },
            { key: 'responsibility', label: 'Responsibility', multiline: true, required: true },
            { key: 'technology', label: 'Technology' },
          ]}
          rows={s.components}
          onChange={(i, key, value) =>
            update((p) => {
              const components = [...p.section1.components]
              components[i] = { ...components[i], [key]: value }
              return { ...p, section1: { ...p.section1, components } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section1: {
                ...p.section1,
                components: [...p.section1.components, { name: '', responsibility: '', technology: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section1: { ...p.section1, components: p.section1.components.filter((_, idx) => idx !== i) },
            }))
          }
          requireCompleteRow
        />
      </SubSection>
      <SubSection title="1.3 Data Flow">
        <TextField
          label="How does data move through the system?"
          value={s.dataFlow}
          onChange={(v) => update((p) => ({ ...p, section1: { ...p.section1, dataFlow: v } }))}
          required
          multiline
          rows={4}
          hint="Describe request/response and data flow between components."
        />
      </SubSection>
      <SubSection title="1.4 Key Design Decisions">
        <DynamicTable
          columns={[
            { key: 'decision', label: 'Decision', multiline: true, required: true },
            { key: 'rationale', label: 'Rationale', multiline: true, required: true },
            { key: 'alternatives', label: 'Alternatives Considered', multiline: true },
          ]}
          rows={s.keyDecisions}
          onChange={(i, key, value) =>
            update((p) => {
              const keyDecisions = [...p.section1.keyDecisions]
              keyDecisions[i] = { ...keyDecisions[i], [key]: value }
              return { ...p, section1: { ...p.section1, keyDecisions } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section1: {
                ...p.section1,
                keyDecisions: [...p.section1.keyDecisions, { decision: '', rationale: '', alternatives: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section1: { ...p.section1, keyDecisions: p.section1.keyDecisions.filter((_, idx) => idx !== i) },
            }))
          }
        />
      </SubSection>
    </section>
  )
}

export function SystemDesignSection2({ data, update }: Props) {
  const s = data.section2
  return (
    <section className="form-section">
      <SectionHeader
        number="02"
        title="Data Design"
        subtitle="Stores · Models · Retention"
        callout="Define where and how data is stored, modeled, and retained."
      />
      <SubSection title="2.1 Data Stores">
        <DynamicTable
          columns={[
            { key: 'store', label: 'Store', required: true },
            { key: 'type', label: 'Type (SQL, NoSQL, cache…)', required: true },
            { key: 'purpose', label: 'Purpose', multiline: true },
          ]}
          rows={s.dataStores}
          onChange={(i, key, value) =>
            update((p) => {
              const dataStores = [...p.section2.dataStores]
              dataStores[i] = { ...dataStores[i], [key]: value }
              return { ...p, section2: { ...p.section2, dataStores } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section2: {
                ...p.section2,
                dataStores: [...p.section2.dataStores, { store: '', type: '', purpose: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section2: { ...p.section2, dataStores: p.section2.dataStores.filter((_, idx) => idx !== i) },
            }))
          }
          requireCompleteRow
        />
      </SubSection>
      <SubSection title="2.2 Data Models">
        <DynamicTable
          columns={[
            { key: 'entity', label: 'Entity', required: true },
            { key: 'fields', label: 'Key Fields', multiline: true },
            { key: 'notes', label: 'Notes', multiline: true },
          ]}
          rows={s.dataModels}
          onChange={(i, key, value) =>
            update((p) => {
              const dataModels = [...p.section2.dataModels]
              dataModels[i] = { ...dataModels[i], [key]: value }
              return { ...p, section2: { ...p.section2, dataModels } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section2: {
                ...p.section2,
                dataModels: [...p.section2.dataModels, { entity: '', fields: '', notes: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section2: { ...p.section2, dataModels: p.section2.dataModels.filter((_, idx) => idx !== i) },
            }))
          }
          requireCompleteRow
        />
      </SubSection>
      <SubSection title="2.3 Data Flow Details">
        <TextField
          label="Detailed data flow / lifecycle"
          value={s.dataFlowDetails}
          onChange={(v) => update((p) => ({ ...p, section2: { ...p.section2, dataFlowDetails: v } }))}
          multiline
          rows={3}
        />
      </SubSection>
      <SubSection title="2.4 Retention Policy">
        <TextField
          label="Data retention & deletion policy"
          value={s.retentionPolicy}
          onChange={(v) => update((p) => ({ ...p, section2: { ...p.section2, retentionPolicy: v } }))}
          multiline
          rows={3}
        />
      </SubSection>
    </section>
  )
}

export function SystemDesignSection3({ data, update }: Props) {
  const s = data.section3
  const field = (key: keyof SystemDesignFormData['section3'], label: string, hint: string) => (
    <TextField
      label={label}
      value={s[key]}
      onChange={(v) => update((p) => ({ ...p, section3: { ...p.section3, [key]: v } }))}
      required={key === 'modelSelection' || key === 'evalStrategy'}
      multiline
      rows={3}
      hint={hint}
    />
  )
  return (
    <section className="form-section">
      <SectionHeader
        number="03"
        title="Model & AI Design"
        subtitle="Selection · Training · Eval · Fallback"
        callout="Define the AI/ML approach. If the project has no AI component, note that here and keep entries minimal."
      />
      <SubSection title="3.1 Model Selection">
        {field('modelSelection', 'Which model(s) will be used?', 'e.g. DeepSeek, GPT, a fine-tuned model, or a classical ML model.')}
      </SubSection>
      <SubSection title="3.2 Selection Rationale">
        {field('modelRationale', 'Why this model?', 'Trade-offs: cost, latency, quality, privacy.')}
      </SubSection>
      <SubSection title="3.3 Training / Fine-tuning Approach">
        {field('trainingApproach', 'Training or fine-tuning approach', 'Leave brief if using an off-the-shelf model.')}
      </SubSection>
      <SubSection title="3.4 Evaluation Strategy">
        {field('evalStrategy', 'How will model quality be measured?', 'Metrics, benchmarks, and acceptance thresholds.')}
      </SubSection>
      <SubSection title="3.5 Fallback Behavior">
        {field('fallbackBehavior', 'What happens on failure or low confidence?', 'Degradation, retries, human-in-the-loop.')}
      </SubSection>
      <SubSection title="3.6 Prompt / Interaction Strategy">
        {field('promptStrategy', 'Prompting or interaction strategy', 'System prompts, tools, context construction.')}
      </SubSection>
    </section>
  )
}
