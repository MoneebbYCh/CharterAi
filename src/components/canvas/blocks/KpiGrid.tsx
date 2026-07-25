import { createReactBlockSpec } from '@blocknote/react'

export interface KpiItem {
  metric: string
  target: string
  method: string
}

export function parseKpiItems(raw: string): KpiItem[] {
  try {
    const parsed = JSON.parse(raw || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => ({
      metric: String(item?.metric ?? ''),
      target: String(item?.target ?? ''),
      method: String(item?.method ?? ''),
    }))
  } catch {
    return []
  }
}

export const createKpiGrid = createReactBlockSpec(
  {
    type: 'kpiGrid',
    propSchema: {
      itemsJson: {
        default: '[]',
      },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const items = parseKpiItems(String(props.block.props.itemsJson || '[]'))
      const shown = items.length > 0 ? items : [{ metric: 'Metric', target: '—', method: '—' }]

      return (
        <div className="rg-kpi" contentEditable={false}>
          <div className="rg-block-caption">
            <span className="rg-block-caption-id">KPI</span>
            <span className="rg-block-caption-title">Success metrics</span>
          </div>
          <table className="rg-kpi-table">
            <thead>
              <tr>
                <th scope="col">Metric</th>
                <th scope="col">Target</th>
                <th scope="col">Measurement</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((item, i) => (
                <tr key={`${item.metric}-${i}`}>
                  <td className="rg-kpi-metric">{item.metric || '—'}</td>
                  <td className="rg-kpi-target">{item.target || '—'}</td>
                  <td className="rg-kpi-method">{item.method || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
  },
)
