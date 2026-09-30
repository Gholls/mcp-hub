import { describe, expect, it } from 'vitest'
import { isValidHttpUrl, summarize, synthesizeSeries } from '../shared/calc/uptime.ts'

describe('synthesizeSeries', () => {
  it('is deterministic for a given seed', () => {
    const a = synthesizeSeries('api.example.com', 24, 30, 1_700_000_000_000)
    const b = synthesizeSeries('api.example.com', 24, 30, 1_700_000_000_000)
    expect(a).toEqual(b)
    expect(a).toHaveLength(48)
  })

  it('differs across seeds', () => {
    const a = synthesizeSeries('a.example.com', 24, 60, 1_700_000_000_000)
    const b = synthesizeSeries('b.example.com', 24, 60, 1_700_000_000_000)
    expect(a).not.toEqual(b)
  })

  it('produces mostly healthy samples with positive latency', () => {
    const samples = synthesizeSeries('x', 24, 30, 1_700_000_000_000)
    expect(samples.every((s) => s.latencyMs > 0)).toBe(true)
    const okCount = samples.filter((s) => s.ok).length
    expect(okCount / samples.length).toBeGreaterThan(0.8)
  })
})

describe('summarize', () => {
  it('computes uptime and latency stats', () => {
    const summary = summarize([
      { t: 1, latencyMs: 100, ok: true },
      { t: 2, latencyMs: 200, ok: true },
      { t: 3, latencyMs: 0, ok: false },
    ])
    expect(summary.uptimePercent).toBeCloseTo(66.67, 1)
    expect(summary.avgLatencyMs).toBe(150)
    expect(summary.failures).toBe(1)
    expect(summary.samples).toBe(3)
  })

  it('handles empty input', () => {
    expect(summarize([]).uptimePercent).toBe(100)
    expect(summarize([]).samples).toBe(0)
  })
})

describe('isValidHttpUrl', () => {
  it('accepts http(s) and rejects others', () => {
    expect(isValidHttpUrl('https://example.com')).toBe(true)
    expect(isValidHttpUrl('http://example.com')).toBe(true)
    expect(isValidHttpUrl('ftp://example.com')).toBe(false)
    expect(isValidHttpUrl('not a url')).toBe(false)
  })
})
