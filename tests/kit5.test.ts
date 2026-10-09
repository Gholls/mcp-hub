import { describe, expect, it } from 'vitest'
import { compound, loan } from '../shared/calc/finance.ts'
import { decodeResistor, formatOhms } from '../shared/calc/resistor.ts'
import { diffLines, diffStats } from '../shared/calc/difflib.ts'
import { toTable } from '../shared/calc/table.ts'

describe('finance', () => {
  it('computes a loan', () => {
    const r = loan(120000, 0, 12)
    expect(r.monthly).toBe(10000)
    expect(r.totalInterest).toBe(0)
    const withInterest = loan(100000, 12, 12)
    expect(withInterest.monthly).toBeGreaterThan(8333)
    expect(withInterest.totalInterest).toBeGreaterThan(0)
  })
  it('projects compound growth', () => {
    const series = compound(1000, 10, 2, 1)
    expect(series[0].value).toBe(1000)
    expect(series[2].value).toBe(1210)
  })
})

describe('resistor', () => {
  it('decodes four bands', () => {
    expect(decodeResistor(['brown', 'black', 'red', 'gold'])?.ohms).toBe(1000)
    expect(formatOhms(1000)).toBe('1 kΩ')
    expect(formatOhms(1000000)).toBe('1 MΩ')
    expect(decodeResistor(['brown', 'black'])).toBeNull()
  })
})

describe('diff', () => {
  it('diffs lines', () => {
    const lines = diffLines('a\nb\nc', 'a\nx\nc')
    const stats = diffStats(lines)
    expect(stats.added).toBe(1)
    expect(stats.removed).toBe(1)
    expect(lines.some((l) => l.type === 'same' && l.text === 'a')).toBe(true)
  })
})

describe('table', () => {
  it('converts arrays of objects', () => {
    const t = toTable([{ a: 1, b: 2 }, { a: 3, b: 4 }])
    expect(t.columns).toEqual(['a', 'b'])
    expect(t.rows).toEqual([['1', '2'], ['3', '4']])
  })
  it('converts objects and arrays of arrays', () => {
    expect(toTable({ x: 1 }).rows).toEqual([['x', '1']])
    expect(toTable([[1, 2], [3, 4]]).columns).toEqual(['#1', '#2'])
  })
})
