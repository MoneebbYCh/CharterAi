import { createReactBlockSpec } from '@blocknote/react'

export interface StakeholderRow {
  nameRole: string
  interest: string
  influence: string
  concern: string
}

function normalizeLevel(value: string): 'H' | 'M' | 'L' | string {
  const v = value.trim().toUpperCase()
  if (v === 'H' || v === 'HIGH') return 'H'
  if (v === 'M' || v === 'MED' || v === 'MEDIUM') return 'M'
  if (v === 'L' || v === 'LOW') return 'L'
  return value.trim() || '—'
}

function levelLabel(level: string): string {
  if (level === 'H') return 'High'
  if (level === 'M') return 'Med'
  if (level === 'L') return 'Low'
  return level
}

export function parseStakeholderRows(raw: string): StakeholderRow[] {
  try {
    const parsed = JSON.parse(raw || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.map((row) => ({
      nameRole: String(row?.nameRole ?? ''),
      interest: String(row?.interest ?? ''),
      influence: String(row?.influence ?? ''),
      concern: String(row?.concern ?? ''),
    }))
  } catch {
    return []
  }
}

export const createStakeholderTable = createReactBlockSpec(
  {
    type: 'stakeholderTable',
    propSchema: {
      rowsJson: {
        default: '[]',
      },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const rows = parseStakeholderRows(String(props.block.props.rowsJson || '[]'))
      const shown =
        rows.length > 0
          ? rows
          : [{ nameRole: 'Name / Role', interest: 'H', influence: 'M', concern: '—' }]

      return (
        <div className="rg-panel" contentEditable={false}>
          <div className="rg-block-caption">
            <span className="rg-block-caption-id">STAKEHOLDERS</span>
            <span className="rg-block-caption-title">Interest & influence</span>
          </div>
          <table className="rg-exec-table">
            <thead>
              <tr>
                <th scope="col">Name / Role</th>
                <th scope="col">Interest</th>
                <th scope="col">Influence</th>
                <th scope="col">Primary concern</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row, i) => {
                const interest = normalizeLevel(row.interest)
                const influence = normalizeLevel(row.influence)
                return (
                  <tr key={`${row.nameRole}-${i}`}>
                    <td className="rg-exec-primary">{row.nameRole || '—'}</td>
                    <td>
                      <span className={`rg-level rg-level--${String(interest).toLowerCase()}`}>
                        {levelLabel(interest)}
                      </span>
                    </td>
                    <td>
                      <span className={`rg-level rg-level--${String(influence).toLowerCase()}`}>
                        {levelLabel(influence)}
                      </span>
                    </td>
                    <td className="rg-exec-muted">{row.concern || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    },
  },
)
