import { describe, expect, it } from 'vitest'
import { decodeJwt } from '../shared/calc/jwt.ts'

const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxOTAwMDAwMDAwfQ.sig'

describe('decodeJwt', () => {
  it('decodes header and payload', () => {
    const result = decodeJwt(SAMPLE)
    expect(result.valid).toBe(true)
    expect(result.header).toMatchObject({ alg: 'HS256', typ: 'JWT' })
    expect(result.payload).toMatchObject({ sub: '1234567890', name: 'Ada' })
    expect(result.claims?.iat).toBe(1516239022)
  })

  it('detects expiry relative to a reference time', () => {
    const before = decodeJwt(SAMPLE, 1_600_000_000_000)
    expect(before.expired).toBe(false)
    const after = decodeJwt(SAMPLE, 2_000_000_000_000)
    expect(after.expired).toBe(true)
    expect(after.expiresInSeconds).toBeLessThan(0)
  })

  it('reports invalid tokens', () => {
    expect(decodeJwt('').valid).toBe(false)
    expect(decodeJwt('a.b').valid).toBe(false)
    expect(decodeJwt('not-a-jwt').valid).toBe(false)
  })

  it('decodes unicode payloads', () => {
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ name: '八字' }))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    const token = `eyJhbGciOiJub25lIn0.${payload}.`
    const result = decodeJwt(token)
    expect(result.valid).toBe(true)
    expect(result.payload?.name).toBe('八字')
  })
})
