import {
  BlockNoteSchema,
  defaultBlockSpecs,
  filterSuggestionItems,
  insertOrUpdateBlockForSlashMenu,
  type BlockNoteEditor,
  type PartialBlock,
} from '@blocknote/core'
import type { DefaultReactSuggestionItem } from '@blocknote/react'
import { createCallout } from './blocks/Callout'
import { createKpiGrid } from './blocks/KpiGrid'
import { createStakeholderTable } from './blocks/StakeholderTable'
import { createRiskList } from './blocks/RiskList'
import { createScopeBounds } from './blocks/ScopeBounds'

export const canvasSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    callout: createCallout(),
    kpiGrid: createKpiGrid(),
    scopeBounds: createScopeBounds(),
    stakeholderTable: createStakeholderTable(),
    riskList: createRiskList(),
  },
})

type CanvasEditor = BlockNoteEditor<
  typeof canvasSchema.blockSchema,
  typeof canvasSchema.inlineContentSchema,
  typeof canvasSchema.styleSchema
>

function insert(editor: CanvasEditor, block: PartialBlock) {
  insertOrUpdateBlockForSlashMenu(editor, block)
}

export function getCanvasSlashMenuItems(editor: CanvasEditor): DefaultReactSuggestionItem[] {
  return [
    {
      title: 'Callout',
      subtext: 'Highlighted note / warning / summary',
      aliases: ['alert', 'note', 'info', 'warn'],
      group: 'Charter shapes',
      onItemClick: () =>
        insert(editor, {
          type: 'callout',
          props: { variant: 'info', title: 'Note' },
          content: 'Write the callout body…',
        }),
    },
    {
      title: 'KPI Grid',
      subtext: 'Objectives & measurable success criteria',
      aliases: ['kpi', 'metrics', 'targets', 'objectives'],
      group: 'Charter shapes',
      onItemClick: () =>
        insert(editor, {
          type: 'kpiGrid',
          props: {
            itemsJson: JSON.stringify([
              { metric: 'Primary objective', target: 'Measurable target', method: 'How verified' },
            ]),
          },
        }),
    },
    {
      title: 'Scope Bounds',
      subtext: 'In scope vs explicit exclusions',
      aliases: ['scope', 'in scope', 'out of scope', 'exclusions'],
      group: 'Charter shapes',
      onItemClick: () =>
        insert(editor, {
          type: 'scopeBounds',
          props: {
            inScopeJson: JSON.stringify(['In-scope item']),
            outOfScopeJson: JSON.stringify(['Explicit exclusion']),
          },
        }),
    },
    {
      title: 'Stakeholder Table',
      subtext: 'Sponsor, owner, interest & influence',
      aliases: ['stakeholders', 'people', 'roles', 'sponsor'],
      group: 'Charter shapes',
      onItemClick: () =>
        insert(editor, {
          type: 'stakeholderTable',
          props: {
            rowsJson: JSON.stringify([
              { nameRole: 'Name / Role', interest: 'H', influence: 'M', concern: 'Concern' },
            ]),
          },
        }),
    },
    {
      title: 'Risk List',
      subtext: 'High-level risks with L × I',
      aliases: ['risks', 'risk', 'mitigation'],
      group: 'Charter shapes',
      onItemClick: () =>
        insert(editor, {
          type: 'riskList',
          props: {
            rowsJson: JSON.stringify([
              { risk: 'Risk', likelihood: 'M', impact: 'H', mitigation: 'Mitigation' },
            ]),
          },
        }),
    },
  ]
}

export { filterSuggestionItems }
