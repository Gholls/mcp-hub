import { describe, expect, it } from 'vitest'
import { testRegex } from '../shared/calc/regex.ts'

describe('testRegex', () => {
  it('finds global matches', () => {
    const result = testRegex('\\d+', 'g', 'a1 b22 c333')
    expect(result.valid).toBe(true)
    expect(result.matches.map((m) => m.value)).toEqual(['1', '22', '333'])
    expect(result.segments.filter((s) => s.match)).toHaveLength(3)
  })

  it('captures groups and indices', () => {
    const result = testRegex('(\\w+)@(\\w+)\\.com', 'g', 'mail ada@gholl.com now')
    expect(result.matches[0].value).toBe('ada@gholl.com')
    expect(result.matches[0].groups).toEqual(['ada', 'gholl'])
    expect(result.matches[0].index).toBe(5)
  })

  it('reports invalid patterns', () => {
    const result = testRegex('([', 'g', 'text')
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
    expect(result.matches).toEqual([])
  })

  it('handles zero-width matches without looping forever', () => {
    const result = testRegex('a*', 'g', 'bbb')
    expect(result.valid).toBe(true)
    expect(result.matches.length).toBeLessThan(20)
  })

  it('returns empty segments for empty input', () => {
    expect(testRegex('a', 'g', '').segments).toEqual([])
  })
})
