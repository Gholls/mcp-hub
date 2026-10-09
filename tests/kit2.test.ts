import { describe, expect, it } from 'vitest'
import { bmi, bmiCategory } from '../shared/calc/bmi.ts'
import { rollDice, rollDie, sum } from '../shared/calc/dice.ts'
import { findStatus, categoryOf } from '../shared/calc/httpstatus.ts'

describe('bmi', () => {
  it('computes and categorizes', () => {
    expect(bmi(70, 175)).toBeCloseTo(22.86, 1)
    expect(bmiCategory(17).key).toBe('under')
    expect(bmiCategory(22).key).toBe('normal')
    expect(bmiCategory(26).key).toBe('over')
    expect(bmiCategory(31).key).toBe('obese')
  })
})

describe('dice', () => {
  it('rolls within range deterministically with a stub rng', () => {
    expect(rollDie(6, () => 0)).toBe(1)
    expect(rollDie(6, () => 0.999)).toBe(6)
    const values = rollDice(3, 6, () => 0.5)
    expect(values).toHaveLength(3)
    expect(values.every((v) => v >= 1 && v <= 6)).toBe(true)
    expect(sum(values)).toBe(values.reduce((a, b) => a + b, 0))
  })
})

describe('http status', () => {
  it('filters and categorizes', () => {
    expect(findStatus('404').some((s) => s.code === 404)).toBe(true)
    expect(findStatus('not found').some((s) => s.code === 404)).toBe(true)
    expect(categoryOf(404).en).toBe('Client error')
    expect(categoryOf(503).en).toBe('Server error')
  })
})
