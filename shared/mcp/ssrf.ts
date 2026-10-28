import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js'

/**
 * SSRF guard for every server-side outbound fetch.
 *
 * Threat model: the MCP endpoint is unauthenticated, so any `url`-style tool
 * argument is attacker-controlled. We must never let one steer a Worker request
 * to loopback, private, link-local (including the cloud metadata address),
 * carrier-grade NAT, or reserved address space. Workers resolve DNS inside the
 * platform, so hostnames are pre-checked through Cloudflare DoH; that plus the
 * short (30s) positive cache narrows the DNS-rebinding window to the record TTL.
 */

const DOH_URL = 'https://cloudflare-dns.com/dns-query'
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const MAX_REDIRECT_HOPS = 6

const positiveDnsCache = new Map<string, { at: number; expiresAt: number }>()
const negativeDnsCache = new Map<string, number>()
const POSITIVE_TTL_MS = 30_000
const NEGATIVE_TTL_MS = 5_000

export function ipVersion(value: string): 4 | 6 | null {
  return value.includes(':') ? 6 : valueLooksIpv4(value) ? 4 : null
}

function valueLooksIpv4(value: string): boolean {
  const parts = value.split('.')
  if (parts.length === 0 || parts.length > 4) return false
  return parts.every((p) => /^(0x[0-9a-f]+|0\d+|\d+)$/i.test(p))
}

/**
 * Normalizes an IPv4 literal in dotted, mixed-radix (`0x` octets are hex;
 * leading-zero octets are octal — WHATWG rejects them but lower stacks parse
 * them), short-form, packed decimal, or packed hex notation into canonical
 * dotted-quad — or returns null when it is not one. WHATWG `new URL()` already
 * canonicalizes `0x7f.1` and `2130706433` to loopback forms; we normalize first
 * and block on the resulting address so no notation slips through.
 */
export function normalizeIpv4(hostname: string): string | null {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '')
  if (host === '') return null

  const parsePart = (part: string): number | null => {
    if (/^0x[0-9a-f]+$/.test(part)) {
      const n = Number.parseInt(part.slice(2), 16)
      return Number.isFinite(n) ? n : null
    }
    if (/^0\d+$/.test(part)) {
      const n = Number.parseInt(part.slice(1), 8)
      return Number.isFinite(n) ? n : null
    }
    if (/^\d+$/.test(part)) return Number.parseInt(part, 10)
    return null
  }

  const parts = host.split('.')
  if (parts.length > 4) return null
  const values: number[] = []
  for (const part of parts) {
    const n = parsePart(part)
    if (n === null || n < 0) return null
    values.push(n)
  }

  const octets = normalizeIpv4Parts(values)
  if (!octets) return null
  return octets.join('.')
}

function ipv4ToLong(dotted: string): number | null {
  const octets = dotted.split('.').map(Number)
  if (octets.length !== 4 || octets.some((n) => Number.isNaN(n))) return null
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0
}

function normalizeIpv4Parts(values: number[]): number[] | null {
  const tailBits = (4 - values.length + 1) * 8
  const tailMax = tailBits >= 32 ? 0xffffffff : (1 << tailBits) - 1
  const tail = values[values.length - 1]
  if (values.slice(0, -1).some((n) => n > 255)) return null
  if (tail > tailMax) return null
  const head = values.slice(0, -1)
  for (let shift = tailBits - 8; shift >= 0; shift -= 8) head.push((tail >>> shift) & 0xff)
  return head.length === 4 ? head : null
}

function inCidrPrefix(long: number, base: string, bits: number): boolean {
  const baseLong = ipv4ToLong(base)
  if (baseLong === null) return false
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0
  return (long & mask) === (baseLong & mask)
}

export function isPrivateIp(raw: string): boolean {
  let value = raw.trim().toLowerCase()
  const bracketed = /^\[(.*)\]$/.exec(value)
  if (bracketed) value = bracketed[1]
  if (value === '') return true

  if (value.includes(':')) {
    // IPv6 — unwrap IPv4-mapped (::ffff:a.b.c.d) and compatibility (::a.b.c.d) forms.
    const mapped = /^::(?:ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/.exec(value)
    if (mapped) return isPrivateIp(mapped[1])
    const sixtoFour = /^2002:([0-9a-f]{1,4}):([0-9a-f]{1,4})/.exec(value)
    if (sixtoFour) {
      const a = Number.parseInt(sixtoFour[1], 16)
      const b = Number.parseInt(sixtoFour[2], 16)
      return isPrivateIp(`${a >>> 8}.${a & 0xff}.${b >>> 8}.${b & 0xff}`)
    }
    if (
      value === '::1' ||
      value === '::' ||
      value.startsWith('::ffff:') ||
      /^f[cd][0-9a-f]{2}:/.test(value) || // fc00::/7 unique local
      /^fe[89ab][0-9a-f]:/.test(value) // fe80::/10 link-local
    ) {
      return true
    }
    return false
  }

  const dotted = valueLooksIpv4(value) ? normalizeIpv4(value) : null
  if (!dotted) return false
  const long = ipv4ToLong(dotted)
  if (long === null) return true
  const checks: Array<[string, number]> = [
    ['0.0.0.0', 8], // "this host"
    ['10.0.0.0', 8],
    ['100.64.0.0', 10], // carrier-grade NAT
    ['127.0.0.0', 8],
    ['169.254.0.0', 16], // link-local incl. cloud metadata
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.0.2.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15], // benchmarking
    ['203.0.113.0', 24],
    ['224.0.0.0', 4], // multicast
    ['240.0.0.0', 4], // reserved
  ]
  return checks.some(([base, bits]) => inCidrPrefix(long, base, bits))
}

async function resolveViaDoH(hostname: string, type: 'A' | 'AAAA'): Promise<string[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3_000)
  try {
    const response = await fetch(`${DOH_URL}?name=${encodeURIComponent(hostname)}&type=${type}`, {
      headers: { accept: 'application/dns-json' },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`DoH HTTP ${response.status}`)
    const data = (await response.json()) as { Status?: number; Answer?: Array<{ type: number; data: string }> }
    if (data.Status !== 0) return []
    return (data.Answer ?? []).filter((r) => r.type === (type === 'A' ? 1 : 28)).map((r) => r.data)
  } finally {
    clearTimeout(timer)
  }
}

/** Resolves the host via DoH and rejects it when it cannot be proven public. */
export async function assertPublicHost(hostname: string): Promise<void> {
  const now = Date.now()
  const cached = positiveDnsCache.get(hostname)
  if (cached && cached.expiresAt > now && now - cached.at < 60_000) return
  if ((negativeDnsCache.get(hostname) ?? 0) > now) {
    throw new McpError(ErrorCode.InvalidParams, `Host is not reachable or not allowed: ${hostname}`)
  }

  const isName =
    /^[a-z0-9.-]+$/i.test(hostname.replace(/^\[|\]$/g, '')) &&
    /[a-z]/i.test(hostname) &&
    !/^[0-9.]+$/.test(hostname)
  if (!isName) {
    // Bracketless raw IPv6 can reach here as "hostname without dots"; double-check.
    throw new McpError(ErrorCode.InvalidParams, 'Bare IP addresses are not allowed as hosts')
  }

  let records: string[]
  try {
    const [v4, v6] = await Promise.all([resolveViaDoH(hostname, 'A'), resolveViaDoH(hostname, 'AAAA')])
    records = [...v4, ...v6]
  } catch {
    // Fail closed but do not cache: a transient DoH outage must not poison the host.
    throw new McpError(ErrorCode.InternalError, `DNS verification failed for ${hostname}`)
  }
  if (records.length === 0) {
    negativeDnsCache.set(hostname, now + NEGATIVE_TTL_MS)
    throw new McpError(ErrorCode.InvalidParams, `Host does not resolve to a public address: ${hostname}`)
  }
  if (records.some(isPrivateIp)) {
    throw new McpError(ErrorCode.InvalidParams, `Host resolves to a private or reserved address: ${hostname}`)
  }
  positiveDnsCache.set(hostname, { at: now, expiresAt: now + POSITIVE_TTL_MS })
}

/** Validates a URL string and its resolved host; throws McpError (InvalidParams) otherwise. */
export async function parsePublicUrl(raw: string): Promise<URL> {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new McpError(ErrorCode.InvalidParams, `Invalid URL: ${raw}`)
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new McpError(ErrorCode.InvalidParams, 'Only http(s) URLs are supported')
  }
  const hostname = parsed.hostname
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    if (isPrivateIp(hostname)) throw privateHostError()
    return parsed
  }
  const literal = normalizeIpv4(hostname)
  if (literal) {
    if (isPrivateIp(literal)) throw privateHostError()
    return parsed
  }
  if (!/^[a-z0-9.-]+$/i.test(hostname) || !/[a-z]/i.test(hostname)) throw privateHostError()
  await assertPublicHost(hostname)
  return parsed
}

function privateHostError(): McpError {
  return new McpError(ErrorCode.InvalidParams, 'Private/loopback hosts are not allowed')
}

function validateRedirectLocation(current: URL, location: string): URL {
  let next: URL
  try {
    next = new URL(location, current)
  } catch {
    throw new McpError(ErrorCode.InvalidParams, `Invalid redirect target: ${location}`)
  }
  if (next.protocol !== 'http:' && next.protocol !== 'https:') {
    throw new McpError(ErrorCode.InvalidParams, 'Redirect targets only http(s) URLs')
  }
  return next
}

/**
 * Fetches a validated URL following redirects manually, re-validating every
 * hop (protocol, host, resolved IPs) so a public first URL cannot bounce the
 * request into private space.
 */
export async function fetchPublic(url: URL, init: RequestInit = {}, remainingHops = MAX_REDIRECT_HOPS): Promise<Response> {
  const current = url
  const response = await fetch(current.toString(), { redirect: 'manual', ...init })
  const location = response.headers.get('location')
  if (response.status >= 300 && response.status < 400 && location) {
    if (remainingHops <= 0) throw new McpError(ErrorCode.InvalidParams, 'Too many redirects')
    const next = validateRedirectLocation(current, location)
    await parsePublicUrl(next.toString())
    return fetchPublic(next, init, remainingHops - 1)
  }
  return response
}
