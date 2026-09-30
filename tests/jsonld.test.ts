import { describe, expect, it } from 'vitest'
import { formatJson, parseJson, summarizeJsonLd } from '../shared/calc/jsonld.ts'

describe('parseJson', () => {
  it('parses valid JSON', () => {
    const result = parseJson('{"a":1}')
    expect(result.valid).toBe(true)
    expect(result.value).toEqual({ a: 1 })
  })

  it('flags empty and invalid input', () => {
    expect(parseJson('').valid).toBe(false)
    expect(parseJson('{a:1}').valid).toBe(false)
    expect(parseJson('{a:1}').errorLine).toBeDefined()
  })
})

describe('summarizeJsonLd', () => {
  it('detects JSON-LD context and types', () => {
    const summary = summarizeJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'X',
    })
    expect(summary.looksLikeJsonLd).toBe(true)
    expect(summary.types).toEqual(['Product'])
    expect(summary.context).toBe('https://schema.org')
    expect(summary.topLevelKeys).toContain('name')
    expect(summary.nodeCount).toBeGreaterThan(0)
  })

  it('collects nested and array types', () => {
    const summary = summarizeJsonLd({
      '@type': 'ItemList',
      itemListElement: [{ '@type': 'Thing' }, { '@type': ['Person', 'Author'] }],
    })
    expect(summary.types).toContain('ItemList')
    expect(summary.types).toContain('Thing')
    expect(summary.types).toContain('Person')
    expect(summary.types).toContain('Author')
  })

  it('reports plain JSON as not JSON-LD', () => {
    const summary = summarizeJsonLd({ a: 1, b: [1, 2] })
    expect(summary.looksLikeJsonLd).toBe(false)
  })
})

describe('formatJson', () => {
  it('pretty-prints valid JSON and returns input unchanged when invalid', () => {
    expect(formatJson('{"a":1}')).toContain('\n')
    expect(formatJson('oops')).toBe('oops')
  })
})
