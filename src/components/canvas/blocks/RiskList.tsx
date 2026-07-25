import { createReactBlockSpec } from '@blocknote/react'

export interface RiskRow {
  risk: string
  likelihood: string
  impact: string
  mitigation: string
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

export function parseRiskRows(raw: string): RiskRow[] {
  try {
    const parsed = JSON.parse(raw || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.map((row) => ({
      risk: String(row?.risk ?? ''),
      likelihood: String(row?.likelihood ?? ''),
      impact: String(row?.impact ?? ''),
      mitigation: String(row?.mitigation ?? ''),
    }))
  } catch {
    return []
  }
}

export const createRiskList = createReactBlockSpec(
  {
    type: 'riskList',
    propSchema: {
      rowsJson: {
        default: '[]',
      },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const rows = parseRiskRows(String(props.block.props.rowsJson || '[]'))
      const shown =
        rows.length > 0
          ? rows
          : [{ risk: 'Risk', likelihood: 'M', impact: 'H', mitigation: '—' }]

      return (
        <div className="rg-panel" contentEditable={false}>
          <div className="rg-block-caption">
            <span className="rg-block-caption-id">RISKS</span>
            <span className="rg-block-caption-title">Likelihood × impact</span>
          </div>
          <table className="rg-exec-table">
            <thead>
              <tr>
                <th scope="col">Risk</th>
                <th scope="col">Likelihood</th>
                <th scope="col">Impact</th>
                <th scope="col">Mitigation</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row, i) => {
                const likelihood = normalizeLevel(row.likelihood)
                const impact = normalizeLevel(row.impact)
                return (
                  <tr key={`${row.risk}-${i}`}>
                    <td className="rg-exec-primary">{row.risk || '—'}</td>
                    <td>
                      <span className={`rg-level rg-level--${String(likelihood).toLowerCase()}`}>
                        {levelLabel(likelihood)}
                      </span>
                    </td>
                    <td>
                      <span className={`rg-level rg-level--${String(impact).toLowerCase()}`}>
                        {levelLabel(impact)}
                      </span>
                    </td>
                    <td className="rg-exec-muted">{row.mitigation || '—'}</td>
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
