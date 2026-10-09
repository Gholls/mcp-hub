import { describe, expect, it } from 'vitest'
import { rollDice, rollDie, sum } from '../shared/calc/dice.ts'

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
