import type { PrdFormData } from '../../types/prdForm'
import {
  DynamicTable,
  SectionHeader,
  SubSection,
  TextField,
} from '../FormFields'

interface Props {
  data: PrdFormData
  update: (updater: (prev: PrdFormData) => PrdFormData) => void
}

export function PrdSection1({ data, update }: Props) {
  const s = data.section1
  return (
    <section className="form-section">
      <SectionHeader
        number="01"
        title="Executive Summary"
        subtitle="Solution Overview · Scope · Key Decisions"
        callout="Summarise the proposed solution. This section should be understandable by any stakeholder."
      />
      <SubSection title="1.1 Solution Overview">
        <TextField
          label="What is the proposed solution?"
          value={s.solutionOverview}
          onChange={(v) => update((p) => ({ ...p, section1: { ...p.section1, solutionOverview: v } }))}
          required
          multiline
          rows={4}
          hint="Describe what will be built. Focus on the 'what' and 'why' — not implementation details."
        />
      </SubSection>
      <SubSection title="1.2 Scope Items" note="What is explicitly in scope for this release?">
        <DynamicTable
          columns={[
            { key: 'item', label: 'Scope Item', multiline: true, required: true },
            { key: 'description', label: 'Description', multiline: true, required: true },
            { key: 'priority', label: 'Priority', type: 'select', optionKey: 'hml' },
          ]}
          rows={s.scopeItems}
          onChange={(i, key, value) =>
            update((p) => {
              const scopeItems = [...p.section1.scopeItems]
              scopeItems[i] = { ...scopeItems[i], [key]: value }
              return { ...p, section1: { ...p.section1, scopeItems } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section1: {
                ...p.section1,
                scopeItems: [...p.section1.scopeItems, { item: '', description: '', priority: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section1: {
                ...p.section1,
                scopeItems: p.section1.scopeItems.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>
      <SubSection title="1.3 Key Decisions">
        <DynamicTable
          columns={[
            { key: 'decision', label: 'Decision', multiline: true, required: true },
            { key: 'rationale', label: 'Rationale', multiline: true, required: true },
            { key: 'owner', label: 'Owner / Driver', required: true },
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
                keyDecisions: [...p.section1.keyDecisions, { decision: '', rationale: '', owner: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section1: {
                ...p.section1,
                keyDecisions: p.section1.keyDecisions.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>
    </section>
  )
}

export function PrdSection2({ data, update }: Props) {
  const s = data.section2
  return (
    <section className="form-section">
      <SectionHeader
        number="02"
        title="Goals & Scope"
        subtitle="Business Goals · Success Metrics · Out-of-Scope"
        callout="Refine and expand the goals established in the Project Charter."
      />
      <SubSection title="2.1 Business Goals">
        <DynamicTable
          columns={[
            { key: 'goal', label: 'Goal', multiline: true, required: true },
            { key: 'owner', label: 'Owner', required: true },
            { key: 'priority', label: 'Priority', type: 'select', optionKey: 'hml' },
          ]}
          rows={s.businessGoals}
          onChange={(i, key, value) =>
            update((p) => {
              const businessGoals = [...p.section2.businessGoals]
              businessGoals[i] = { ...businessGoals[i], [key]: value }
              return { ...p, section2: { ...p.section2, businessGoals } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section2: {
                ...p.section2,
                businessGoals: [...p.section2.businessGoals, { goal: '', owner: '', priority: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section2: {
                ...p.section2,
                businessGoals: p.section2.businessGoals.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>
      <SubSection title="2.2 Success Metrics">
        <DynamicTable
          columns={[
            { key: 'metric', label: 'Metric', multiline: true, required: true },
            { key: 'target', label: 'Target Value', required: true },
            { key: 'measurement', label: 'How Measured', multiline: true },
          ]}
          rows={s.successMetrics}
          onChange={(i, key, value) =>
            update((p) => {
              const successMetrics = [...p.section2.successMetrics]
              successMetrics[i] = { ...successMetrics[i], [key]: value }
              return { ...p, section2: { ...p.section2, successMetrics } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section2: {
                ...p.section2,
                successMetrics: [...p.section2.successMetrics, { metric: '', target: '', measurement: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section2: {
                ...p.section2,
                successMetrics: p.section2.successMetrics.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>
      <SubSection title="2.3 Out of Scope">
        <DynamicTable
          columns={[
            { key: 'item', label: 'Item', multiline: true, required: true },
            { key: 'rationale', label: 'Rationale', multiline: true },
          ]}
          rows={s.outOfScope}
          onChange={(i, key, value) =>
            update((p) => {
              const outOfScope = [...p.section2.outOfScope]
              outOfScope[i] = { ...outOfScope[i], [key]: value }
              return { ...p, section2: { ...p.section2, outOfScope } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section2: {
                ...p.section2,
                outOfScope: [...p.section2.outOfScope, { item: '', rationale: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section2: {
                ...p.section2,
                outOfScope: p.section2.outOfScope.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>
    </section>
  )
}

export function PrdSection3({ data, update }: Props) {
  const s = data.section3
  return (
    <section className="form-section">
      <SectionHeader
        number="03"
        title="User Personas"
        subtitle="Actors · Archetypes · Goals"
        callout="Define who will use this system. Every feature should map to at least one persona."
      />
      <SubSection title="3.1 Persona Register">
        <DynamicTable
          columns={[
            { key: 'persona', label: 'Persona / Role', multiline: true, required: true },
            { key: 'description', label: 'Description', multiline: true, required: true },
            { key: 'goals', label: 'Goals & Needs', multiline: true },
            { key: 'painPoints', label: 'Pain Points', multiline: true },
          ]}
          rows={s.personas}
          onChange={(i, key, value) =>
            update((p) => {
              const personas = [...p.section3.personas]
              personas[i] = { ...personas[i], [key]: value }
              return { ...p, section3: { ...p.section3, personas } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section3: {
                ...p.section3,
                personas: [...p.section3.personas, { persona: '', description: '', goals: '', painPoints: '' }],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section3: {
                ...p.section3,
                personas: p.section3.personas.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>
    </section>
  )
}

export function PrdSection4({ data, update }: Props) {
  const s = data.section4
  return (
    <section className="form-section">
      <SectionHeader
        number="04"
        title="Functional Requirements"
        subtitle="Epics · User Stories · Acceptance Criteria"
        callout="This is the core of the PRD. Every story should link to a persona and a business goal."
      />
      <SubSection title="4.1 Feature / Story Register" note='Format: "As a [persona], I want [capability] so that [benefit]."'>
        <DynamicTable
          columns={[
            { key: 'epic', label: 'Epic / Feature', multiline: true, required: true },
            { key: 'userStory', label: 'User Story', multiline: true, required: true },
            { key: 'priority', label: 'Priority', type: 'select', optionKey: 'hml' },
            { key: 'acceptanceCriteria', label: 'Acceptance Criteria', multiline: true },
            { key: 'notes', label: 'Notes / References', multiline: true },
          ]}
          rows={s.features}
          onChange={(i, key, value) =>
            update((p) => {
              const features = [...p.section4.features]
              features[i] = { ...features[i], [key]: value }
              return { ...p, section4: { ...p.section4, features } }
            })
          }
          onAddRow={() =>
            update((p) => ({
              ...p,
              section4: {
                ...p.section4,
                features: [
                  ...p.section4.features,
                  { epic: '', userStory: '', priority: '', acceptanceCriteria: '', notes: '' },
                ],
              },
            }))
          }
          onRemoveRow={(i) =>
            update((p) => ({
              ...p,
              section4: {
                ...p.section4,
                features: p.section4.features.filter((_, idx) => idx !== i),
              },
            }))
          }
        />
      </SubSection>
    </section>
  )
}
