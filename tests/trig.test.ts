import { describe, expect, it } from 'vitest'
import {
  graphLatex,
  periodOf,
  sampleTrig,
  trigFeatures,
  unitCircle,
  waveY,
  type TrigParams,
} from '../shared/calc/trig.ts'

const base: TrigParams = { func: 'sin', A: 1, omega: 1, phi: 0, k: 0, unit: 'rad' }

describe('periodOf', () => {
  it('computes periods for sin/cos/tan in both units', () => {
    expect(periodOf('sin', 1, 'rad')).toBeCloseTo(Math.PI * 2, 6)
    expect(periodOf('cos', 2, 'rad')).toBeCloseTo(Math.PI, 6)
    expect(periodOf('tan', 1, 'rad')).toBeCloseTo(Math.PI, 6)
    expect(periodOf('sin', 1, 'deg')).toBe(360)
    expect(periodOf('tan', 1, 'deg')).toBe(180)
  })
})

describe('waveY', () => {
  it('evaluates a transformed sine', () => {
    expect(waveY(base, Math.PI / 2)).toBeCloseTo(1, 6)
    expect(waveY({ ...base, A: 2, k: 1 }, Math.PI / 2)).toBeCloseTo(3, 6)
    expect(waveY({ ...base, unit: 'deg' }, 90)).toBeCloseTo(1, 6)
  })
  it('returns null for tan at its asymptote', () => {
    expect(waveY({ ...base, func: 'tan' }, Math.PI / 2)).toBeNull()
  })
})

describe('sampleTrig', () => {
  it('spans two periods and only keeps finite points', () => {
    const points = sampleTrig(base, 60)
    expect(points[0].x).toBe(0)
    expect(points[points.length - 1].x).toBeCloseTo(Math.PI * 4, 6)
    expect(points.every((p) => p.y === null || Number.isFinite(p.y))).toBe(true)
  })
})

describe('trigFeatures', () => {
  it('reports amplitude, period, phase and range', () => {
    const facts = trigFeatures({ ...base, A: 2, omega: 2, k: 1 })
    const labels = facts.map((f) => f.label.en)
    expect(labels).toContain('Amplitude')
    expect(labels).toContain('Period')
    expect(labels).toContain('Range')
    const range = facts.find((f) => f.label.en === 'Range')!
    expect(range.latex).toContain('-1')
    expect(range.latex).toContain('3')
  })
})

describe('unitCircle', () => {
  it('returns sin/cos/tan and a null tan at 90°', () => {
    const v = unitCircle(Math.PI / 2)
    expect(v.sin).toBeCloseTo(1, 6)
    expect(v.cos).toBeCloseTo(0, 6)
    expect(v.tan).toBeNull()
  })
})

describe('graphLatex', () => {
  it('formats common cases', () => {
    expect(graphLatex(base)).toBe('y=\\sin(x)')
    expect(graphLatex({ ...base, A: 2 })).toBe('y=2\\sin(x)')
    expect(graphLatex({ ...base, A: -1, omega: 3 })).toBe('y=-\\sin(3x)')
  })
})
