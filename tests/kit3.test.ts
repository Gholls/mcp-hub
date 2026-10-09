import { describe, expect, it } from 'vitest'
import { describe as describeStats, histogram, parseNumbers } from '../shared/calc/stats.ts'
import { bestForeground, paletteFrom } from '../shared/calc/palette.ts'
import { timeInZone } from '../shared/calc/worldclock.ts'
import { coinFlip } from '../shared/calc/random.ts'

describe('stats', () => {
  it('parses and describes numbers', () => {
    const nums = parseNumbers('1, 2 3 4 5')
    expect(nums).toEqual([1, 2, 3, 4, 5])
    const s = describeStats(nums)!
    expect(s.mean).toBe(3)
    expect(s.median).toBe(3)
    expect(s.min).toBe(1)
    expect(s.max).toBe(5)
  })
  it('builds a histogram', () => {
    const bins = histogram([1, 2, 3, 4, 5, 6, 7, 8], 4)
    expect(bins).toHaveLength(4)
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(8)
  })
})

describe('palette', () => {
  it('generates five colors and a foreground', () => {
    const palette = paletteFrom('#6366f1')
    expect(palette).toHaveLength(5)
    expect(palette.every((c) => /^#[0-9a-f]{6}$/.test(c))).toBe(true)
    expect(bestForeground('#ffffff')).toBe('#000000')
    expect(bestForeground('#000000')).toBe('#ffffff')
  })
})

describe('world & random', () => {
  it('reports a time for a zone', () => {
    const t = timeInZone('UTC', Date.UTC(2026, 0, 1, 12, 0, 0))
    expect(t.time).toBe('12:00')
    expect(t.isDay).toBe(true)
  })
  it('flips a coin', () => {
    expect(['heads', 'tails']).toContain(coinFlip())
  })
})
