import { describe, expect, it } from 'vitest'
import { UNIT_CATEGORIES, convertUnits } from '../shared/calc/units.ts'

describe('convertUnits', () => {
  it('converts length', () => {
    expect(convertUnits('length', 1, 'km', 'm')).toBeCloseTo(1000, 6)
    expect(convertUnits('length', 10, 'km', 'mi')).toBeCloseTo(6.213712, 4)
  })
  it('converts temperature with offsets', () => {
    expect(convertUnits('temperature', 100, 'c', 'f')).toBeCloseTo(212, 6)
    expect(convertUnits('temperature', 32, 'f', 'c')).toBeCloseTo(0, 6)
    expect(convertUnits('temperature', 0, 'c', 'k')).toBeCloseTo(273.15, 6)
  })
  it('converts data sizes', () => {
    expect(convertUnits('data', 1024, 'mb', 'gb')).toBeCloseTo(1.024, 6)
    expect(convertUnits('data', 1, 'gib', 'mib')).toBeCloseTo(1024, 6)
  })
  it('returns null for unknown units', () => {
    expect(convertUnits('length', 1, 'zz', 'm')).toBeNull()
    expect(convertUnits('nope', 1, 'm', 'km')).toBeNull()
  })
  it('every category has at least two units', () => {
    for (const category of UNIT_CATEGORIES) expect(category.units.length).toBeGreaterThanOrEqual(2)
  })
})
