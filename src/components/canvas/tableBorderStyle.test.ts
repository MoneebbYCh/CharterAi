import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TABLE_BORDER,
  matchTableBorderPreset,
  parseTableBorder,
  serializeTableBorder,
  tableBorderCssVars,
} from './tableBorderStyle'

describe('tableBorderStyle', () => {
  it('round-trips through serialize/parse', () => {
    const style = { width: 3, color: '#112233', line: 'dashed' as const }
    expect(parseTableBorder(serializeTableBorder(style))).toEqual(style)
  })

  it('defaults when missing or invalid', () => {
    expect(parseTableBorder(undefined)).toEqual(DEFAULT_TABLE_BORDER)
    expect(parseTableBorder('not-json')).toEqual(DEFAULT_TABLE_BORDER)
  })

  it('matches presets and falls back to custom', () => {
    expect(matchTableBorderPreset({ width: 0, color: '#000000', line: 'none' })).toBe('invisible')
    expect(matchTableBorderPreset({ width: 2, color: '#000000', line: 'solid' })).toBe('medium')
    expect(matchTableBorderPreset({ width: 2, color: '#ff0000', line: 'solid' })).toBe('custom')
  })

  it('emits zero width when invisible', () => {
    const vars = tableBorderCssVars({ width: 0, color: '#000000', line: 'none' })
    expect(vars['--rg-table-border-width']).toBe('0px')
    expect(vars['--rg-table-border-style']).toBe('none')
  })
})
