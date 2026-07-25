import { createReactBlockSpec } from '@blocknote/react'

function parseList(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => String(item ?? '').trim()).filter(Boolean)
  } catch {
    return []
  }
}

export const createScopeBounds = createReactBlockSpec(
  {
    type: 'scopeBounds',
    propSchema: {
      inScopeJson: { default: '[]' },
      outOfScopeJson: { default: '[]' },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const inScope = parseList(String(props.block.props.inScopeJson || '[]'))
      const outOfScope = parseList(String(props.block.props.outOfScopeJson || '[]'))
      const inItems = inScope.length > 0 ? inScope : ['[Define what is included]']
      const outItems = outOfScope.length > 0 ? outOfScope : ['[Define what is explicitly excluded]']

      return (
        <div className="rg-panel rg-scope" contentEditable={false}>
          <div className="rg-block-caption">
            <span className="rg-block-caption-id">SCOPE</span>
            <span className="rg-block-caption-title">In bounds · out of bounds</span>
          </div>
          <div className="rg-scope-grid">
            <section className="rg-scope-col">
              <h3 className="rg-scope-heading">In scope</h3>
              <ul className="rg-scope-list">
                {inItems.map((item, i) => (
                  <li key={`in-${i}`}>{item}</li>
                ))}
              </ul>
            </section>
            <section className="rg-scope-col rg-scope-col--out">
              <h3 className="rg-scope-heading">Out of scope</h3>
              <ul className="rg-scope-list">
                {outItems.map((item, i) => (
                  <li key={`out-${i}`}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )
    },
  },
)
