import { describe, expect, it } from 'vitest'
import {
  GRAPHER_FAMILIES,
  defaultParams,
  features,
  getFamily,
  sampleFamily,
  substitutedLatex,
} from '../shared/calc/grapher.ts'

describe('families', () => {
  it('has unique ids and defaults for every parameter', () => {
    const ids = GRAPHER_FAMILIES.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const family of GRAPHER_FAMILIES) {
      const params = defaultParams(family)
      for (const p of family.params) expect(params[p.name]).toBe(p.default)
    }
  })
})

describe('sampleFamily', () => {
  it('evaluates quadratic values', () => {
    const family = getFamily('quadratic')!
    const points = sampleFamily(family, { a: 1, b: -2, c: -3 }, 20)
    const atZero = points.find((p) => Math.abs(p.x) < 1e-9)
    expect(atZero?.y).toBeCloseTo(-3, 6)
  })

  it('breaks the inverse function at x=0', () => {
    const family = getFamily('inverse')!
    const points = sampleFamily(family, { k: 4 }, 40)
    const atZero = points.find((p) => Math.abs(p.x) < 1e-9)
    expect(atZero?.y).toBeNull()
  })

  it('only samples the logarithmic function for x>0', () => {
    const family = getFamily('logarithmic')!
    expect(family.domain[0]).toBeGreaterThan(0)
    expect(sampleFamily(family, { a: 2 }, 40).every((p) => p.x > 0)).toBe(true)
    expect(family.sample({ a: 2 }, 1)).toBeCloseTo(0, 6)
    expect(family.sample({ a: 2 }, 2)).toBeCloseTo(1, 6)
    expect(family.sample({ a: 2 }, -1)).toBeNull()
  })
})

describe('substitutedLatex', () => {
  it('formats a quadratic without redundant coefficients', () => {
    const family = getFamily('quadratic')!
    expect(substitutedLatex(family, { a: 1, b: -2, c: -3 })).toBe('y=x^{2}-2x-3')
  })
  it('formats linear and inverse forms', () => {
    expect(substitutedLatex(getFamily('linear')!, { k: -1, b: 0 })).toBe('y=-x')
    expect(substitutedLatex(getFamily('linear')!, { k: 0, b: 3 })).toBe('y=3')
    expect(substitutedLatex(getFamily('inverse')!, { k: 4 })).toBe('y=\\dfrac{4}{x}')
  })
})

describe('features', () => {
  it('reports vertex, axis and discriminant for a quadratic', () => {
    const family = getFamily('quadratic')!
    const facts = features(family, { a: 1, b: -2, c: -3 })
    const byLabel = Object.fromEntries(facts.map((f) => [f.label.en, f.latex]))
    expect(byLabel.Vertex).toContain('1')
    expect(byLabel['Axis of symmetry']).toBe('x=1')
    expect(byLabel.Discriminant).toContain('16')
  })
  it('reports monotonicity for exponential', () => {
    const facts = features(getFamily('exponential')!, { a: 2 })
    expect(facts.some((f) => /increasing/.test(f.latex))).toBe(true)
  })
})
