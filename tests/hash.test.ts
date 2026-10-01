import { describe, expect, it } from 'vitest'
import { hashText } from '../shared/calc/hash.ts'

describe('hashText', () => {
  it('computes known SHA-256 and SHA-512 digests', async () => {
    const [sha256, sha512] = await hashText('abc', ['SHA-256', 'SHA-512'])
    expect(sha256.hex).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
    expect(sha512.hex).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a' +
        '2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    )
    expect(sha256.bits).toBe(256)
  })

  it('computes SHA-1', async () => {
    const [sha1] = await hashText('abc', ['SHA-1'])
    expect(sha1.hex).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
  })

  it('returns base64 alongside hex', async () => {
    const [result] = await hashText('abc', ['SHA-256'])
    expect(result.base64).toBeTruthy()
    const decoded = atob(result.base64)
    expect(decoded.length).toBe(32)
  })

  it('handles empty input', async () => {
    const [result] = await hashText('', ['SHA-256'])
    expect(result.hex).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })
})
