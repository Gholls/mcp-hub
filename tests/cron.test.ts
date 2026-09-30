import { describe, expect, it } from 'vitest'
import { describeCron, nextRuns, parseCron } from '../shared/calc/cron.ts'

describe('parseCron', () => {
  it('parses a standard expression', () => {
    const parsed = parseCron('30 9 * * 1-5')
    expect(parsed.valid).toBe(true)
    expect(parsed.fields[0].values).toEqual([30])
    expect(parsed.fields[1].values).toEqual([9])
    expect(parsed.fields[4].values).toEqual([1, 2, 3, 4, 5])
  })

  it('expands steps and lists', () => {
    const parsed = parseCron('*/15 0,12 1,15 * *')
    expect(parsed.fields[0].values).toEqual([0, 15, 30, 45])
    expect(parsed.fields[1].values).toEqual([0, 12])
    expect(parsed.fields[2].values).toEqual([1, 15])
  })

  it('rejects invalid expressions', () => {
    expect(parseCron('not a cron').valid).toBe(false)
    expect(parseCron('99 * * * *').valid).toBe(false)
    expect(parseCron('* * * *').valid).toBe(false)
  })
})

describe('describeCron', () => {
  it('describes a weekday schedule', () => {
    const text = describeCron(parseCron('30 9 * * 1-5'), 'en')
    expect(text).toContain('09:30')
    expect(text.toLowerCase()).toContain('monday')
  })

  it('describes in Chinese', () => {
    const text = describeCron(parseCron('0 0 * * *'), 'zh')
    expect(text).toContain('执行')
  })
})

describe('nextRuns', () => {
  it('returns weekday runs at the right time', () => {
    const from = new Date('2026-01-01T10:00:00') // Thursday
    const runs = nextRuns(parseCron('30 9 * * 1-5'), 5, from)
    expect(runs).toHaveLength(5)
    for (const run of runs) {
      expect(run.getHours()).toBe(9)
      expect(run.getMinutes()).toBe(30)
      const day = run.getDay()
      expect(day).toBeGreaterThanOrEqual(1)
      expect(day).toBeLessThanOrEqual(5)
      expect(run.getTime()).toBeGreaterThan(from.getTime())
    }
  })

  it('steps every 5 minutes', () => {
    const from = new Date('2026-01-01T10:02:00')
    const runs = nextRuns(parseCron('*/5 * * * *'), 3, from)
    expect(runs.map((r) => r.getMinutes())).toEqual([5, 10, 15])
  })

  it('handles monthly schedules', () => {
    const from = new Date('2026-01-15T00:00:00')
    const runs = nextRuns(parseCron('0 0 1 * *'), 2, from)
    expect(runs[0].getDate()).toBe(1)
    expect(runs[0].getMonth()).toBe(1) // February
  })

  it('returns nothing for invalid input', () => {
    expect(nextRuns(parseCron('bad'), 5)).toEqual([])
  })
})
