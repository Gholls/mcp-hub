import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../shared/calc/markdown.ts'
import { numericColumnIndexes, parseCsv } from '../shared/calc/csv.ts'
import { base32Decode, totp } from '../shared/calc/totp.ts'

describe('markdown', () => {
  it('renders headings, bold, code and lists', () => {
    const html = renderMarkdown('# Hi\n\n**bold** and `code`\n\n- a\n- b')
    expect(html).toContain('<h1>Hi</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<code>code</code>')
    expect(html).toContain('<li>a</li>')
  })
  it('escapes HTML', () => {
    expect(renderMarkdown('<script>')).toContain('&lt;script&gt;')
  })
})

describe('csv', () => {
  it('parses rows and finds numeric columns', () => {
    const data = parseCsv('a,b,c\n1,2,x\n3,4,y')
    expect(data.headers).toEqual(['a', 'b', 'c'])
    expect(data.rows).toHaveLength(2)
    expect(numericColumnIndexes(data)).toEqual([0, 1])
  })
  it('handles quoted fields', () => {
    const data = parseCsv('name,note\n"a,b","he said ""hi"""')
    expect(data.rows[0][0]).toBe('a,b')
    expect(data.rows[0][1]).toBe('he said "hi"')
  })
})

describe('totp', () => {
  it('decodes base32 and generates a 6-digit code', async () => {
    const bytes = base32Decode('JBSWY3DPEHPK3PXP')
    expect(bytes.length).toBeGreaterThan(0)
    const code = await totp('JBSWY3DPEHPK3PXP', 0)
    expect(code).toMatch(/^\d{6}$/)
  })
  it('matches the RFC 6238 test vector (SHA-1)', async () => {
    // secret "12345678901234567890" base32-encoded
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
    const code = await totp(secret, 59 * 1000)
    expect(code).toBe('287082')
  })
})
