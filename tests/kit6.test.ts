import { describe, expect, it } from 'vitest'
import { numericColumnIndexes, parseCsv } from '../shared/calc/csv.ts'
import { base32Decode, totp } from '../shared/calc/totp.ts'

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
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
    const code = await totp(secret, 59 * 1000)
    expect(code).toBe('287082')
  })
})
