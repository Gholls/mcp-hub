export interface JwtClaims {
  iss?: string
  sub?: string
  aud?: unknown
  exp?: number
  iat?: number
  nbf?: number
  jti?: string
}

export interface JwtResult {
  valid: boolean
  error?: string
  header?: Record<string, unknown>
  payload?: Record<string, unknown>
  signature?: string
  claims?: JwtClaims
  expiresAt?: string
  issuedAt?: string
  notBefore?: string
  /** True when `exp` is in the past relative to `now`. */
  expired?: boolean
  /** Seconds until expiry (negative when expired). */
  expiresInSeconds?: number
}

function base64UrlToUtf8(input: string): string {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4))
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function decodeSegment(segment: string): Record<string, unknown> {
  const parsed = JSON.parse(base64UrlToUtf8(segment))
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Segment is not a JSON object')
  }
  return parsed as Record<string, unknown>
}

export function decodeJwt(token: string, now: number = Date.now()): JwtResult {
  const trimmed = token.trim()
  if (!trimmed) return { valid: false, error: 'Empty token' }

  const parts = trimmed.split('.')
  if (parts.length !== 3) {
    return { valid: false, error: `Expected 3 segments, got ${parts.length}` }
  }

  try {
    const header = decodeSegment(parts[0])
    const payload = decodeSegment(parts[1])
    const claims: JwtClaims = {
      iss: typeof payload.iss === 'string' ? payload.iss : undefined,
      sub: typeof payload.sub === 'string' ? payload.sub : undefined,
      aud: payload.aud,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
      iat: typeof payload.iat === 'number' ? payload.iat : undefined,
      nbf: typeof payload.nbf === 'number' ? payload.nbf : undefined,
      jti: typeof payload.jti === 'string' ? payload.jti : undefined,
    }

    const result: JwtResult = {
      valid: true,
      header,
      payload,
      signature: parts[2],
      claims,
    }

    if (claims.exp !== undefined) {
      result.expiresAt = new Date(claims.exp * 1000).toISOString()
      result.expired = claims.exp * 1000 < now
      result.expiresInSeconds = Math.round(claims.exp - now / 1000)
    }
    if (claims.iat !== undefined) result.issuedAt = new Date(claims.iat * 1000).toISOString()
    if (claims.nbf !== undefined) result.notBefore = new Date(claims.nbf * 1000).toISOString()
    return result
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : String(err) }
  }
}
