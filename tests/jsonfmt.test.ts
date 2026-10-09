import { describe, expect, it } from 'vitest'
import { jsonStats, sortJson, transformJson } from '../shared/calc/jsonfmt.ts'

describe('transformJson', () => {
  it('pretty-prints and reports stats', () => {
    const result = transformJson('{"b":1,"a":[1,2]}', 'format')
    expect(result.ok).toBe(true)
    expect(result.text).toContain('\n')
    expect(result.stats?.nodes).toBeGreaterThan(0)
  })
  it('minifies', () => {
    const result = transformJson('{\n  "a": 1\n}', 'minify')
    expect(result.text).toBe('{"a":1}')
  })
  it('reports invalid input', () => {
    const result = transformJson('{bad}', 'format')
    expect(result.ok).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('sortJson', () => {
  it('sorts keys recursively', () => {
    const result = sortJson('{"b":1,"a":{"d":1,"c":2}}')
    expect(result.text.indexOf('"a"')).toBeLessThan(result.text.indexOf('"b"'))
    expect(result.text.indexOf('"c"')).toBeLessThan(result.text.indexOf('"d"'))
  })
})

describe('jsonStats', () => {
  it('computes depth and nodes', () => {
    const stats = jsonStats({ a: { b: { c: 1 } }, d: [1, 2] })
    expect(stats.depth).toBe(3)
    expect(stats.nodes).toBeGreaterThan(0)
    expect(stats.bytes).toBeGreaterThan(0)
  })
})
