export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-512'

export const HASH_ALGORITHMS: HashAlgorithm[] = ['SHA-1', 'SHA-256', 'SHA-512']

export interface HashResult {
  algorithm: HashAlgorithm
  hex: string
  base64: string
  bits: number
}

const BITS: Record<HashAlgorithm, number> = { 'SHA-1': 160, 'SHA-256': 256, 'SHA-512': 512 }

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

/** Computes cryptographic digests of the given text using the Web Crypto API. */
export async function hashText(
  text: string,
  algorithms: HashAlgorithm[] = HASH_ALGORITHMS,
): Promise<HashResult[]> {
  const data = new TextEncoder().encode(text)
  const results: HashResult[] = []
  for (const algorithm of algorithms) {
    const digest = await crypto.subtle.digest(algorithm, data)
    results.push({
      algorithm,
      hex: toHex(digest),
      base64: toBase64(digest),
      bits: BITS[algorithm],
    })
  }
  return results
}
