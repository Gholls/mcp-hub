const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s|-/g, '')
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch)
    if (idx < 0) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return new Uint8Array(out)
}

export async function totp(secret: string, timestamp = Date.now(), digits = 6, period = 30): Promise<string> {
  const counter = Math.floor(timestamp / 1000 / period)
  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)
  view.setUint32(0, Math.floor(counter / 2 ** 32))
  view.setUint32(4, counter >>> 0)

  const keyBytes = base32Decode(secret) as unknown as BufferSource
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, buffer))
  const offset = signature[signature.length - 1] & 0x0f
  const code =
    (((signature[offset] & 0x7f) << 24) |
      (signature[offset + 1] << 16) |
      (signature[offset + 2] << 8) |
      signature[offset + 3]) %
    10 ** digits
  return String(code).padStart(digits, '0')
}

export function secondsRemaining(period = 30, timestamp = Date.now()): number {
  return period - Math.floor((timestamp / 1000) % period)
}
