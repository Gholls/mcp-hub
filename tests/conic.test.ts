import { describe, expect, it } from 'vitest'
import { conicCurve, conicEquation, conicFeatures, type ConicParams } from '../shared/calc/conic.ts'

const P = (over: Partial<ConicParams>): ConicParams => ({ type: 'ellipse', a: 3, b: 2, p: 2, ...over })

describe('conicEquation', () => {
  it('formats each conic type', () => {
    expect(conicEquation(P({ type: 'circle', a: 2 }))).toBe('x^{2}+y^{2}=4')
    expect(conicEquation(P({ type: 'ellipse' }))).toContain('\\dfrac{x^{2}}{9}')
    expect(conicEquation(P({ type: 'parabola', p: 2 }))).toBe('y^{2}=4x')
    expect(conicEquation(P({ type: 'hyperbola' }))).toContain('-\\dfrac{y^{2}}{4}')
  })
})

describe('conicFeatures', () => {
  it('reports eccentricity and foci for an ellipse', () => {
    const facts = conicFeatures(P({ type: 'ellipse', a: 5, b: 3 }))
    const byLabel = Object.fromEntries(facts.map((f) => [f.label.en, f.latex]))
    expect(byLabel.Foci).toContain('4')
    expect(byLabel.Eccentricity).toContain('0.8')
  })
  it('reports directrix for a parabola and asymptotes for a hyperbola', () => {
    expect(conicFeatures(P({ type: 'parabola', p: 2 })).some((f) => f.label.en === 'Directrix')).toBe(true)
    expect(conicFeatures(P({ type: 'hyperbola' })).some((f) => f.label.en === 'Asymptotes')).toBe(true)
    expect(conicFeatures(P({ type: 'circle' }))[0].latex).toBe('(0,0)')
  })
})

describe('conicCurve', () => {
  it('samples an ellipse satisfying its equation', () => {
    const a = 5
    const b = 3
    const curve = conicCurve(P({ type: 'ellipse', a, b }))
    const failed = curve.series[0].filter((pt) => {
      if (pt.y === null) return false
      return Math.abs((pt.x * pt.x) / (a * a) + (pt.y * pt.y) / (b * b) - 1) > 1e-6
    })
    expect(failed).toHaveLength(0)
  })

  it('returns two branches for a hyperbola', () => {
    expect(conicCurve(P({ type: 'hyperbola' })).series).toHaveLength(2)
  })
})
