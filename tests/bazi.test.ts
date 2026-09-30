import { describe, expect, it } from 'vitest'
import { computeBazi, type BaziInput } from '../shared/calc/bazi.ts'

const base: BaziInput = { year: 1990, month: 6, day: 15, hour: 10, minute: 30, gender: 'male' }

describe('computeBazi', () => {
  it('computes the four pillars', () => {
    const result = computeBazi(base)
    expect(result.pillars.map((p) => p.ganZhi)).toEqual(['庚午', '壬午', '辛亥', '癸巳'])
    expect(result.dayMasterGan).toBe('辛')
    expect(result.dayMasterElement).toBe('Metal')
  })

  it('counts the five elements across all eight characters', () => {
    const result = computeBazi(base)
    const total = Object.values(result.elementCounts).reduce((a, b) => a + b, 0)
    expect(total).toBe(8)
    // Wood is absent in this chart.
    expect(result.elementCounts.Wood).toBe(0)
    expect(result.missing).toContain('Wood')
  })

  it('derives a strength and favorable set', () => {
    const result = computeBazi(base)
    expect(['strong', 'weak', 'balanced']).toContain(result.strength)
    expect(result.favorable.length).toBeGreaterThan(0)
    expect(result.favorable.length + result.unfavorable.length).toBe(5)
  })

  it('produces ordered luck cycles', () => {
    const result = computeBazi(base)
    expect(result.daYun.length).toBeGreaterThan(5)
    for (let i = 1; i < result.daYun.length; i++) {
      expect(result.daYun[i].startAge).toBeGreaterThan(result.daYun[i - 1].startAge)
    }
  })

  it('handles a different birth', () => {
    const result = computeBazi({ ...base, year: 1985, month: 3, day: 20, gender: 'female' })
    expect(result.pillars).toHaveLength(4)
    expect(result.zodiac).toBeTruthy()
  })
})
