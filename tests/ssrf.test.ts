import { afterEach, describe, expect, it, vi } from 'vitest'
import { assertPublicHost, fetchPublic, isPrivateIp, normalizeIpv4, parsePublicUrl } from '@shared/mcp/ssrf.ts'

function mockDoh(handler: (name: string, type: string) => Array<{ type: number; data: string }> | null) {
  const calls: Array<{ name: string; type: string }> = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input))
      const name = url.searchParams.get('name') ?? ''
      const type = url.searchParams.get('type') ?? ''
      calls.push({ name, type })
      const answer = handler(name, type)
      return new Response(
        JSON.stringify({ Status: answer === null ? 3 : 0, Answer: answer ?? undefined }),
        { headers: { 'content-type': 'application/dns-json' } },
      )
    }),
  )
  return calls
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('normalizeIpv4', () => {
  it('parses canonical and short-form notations', () => {
    expect(normalizeIpv4('127.0.0.1')).toBe('127.0.0.1')
    expect(normalizeIpv4('10.1')).toBe('10.0.0.1')
    expect(normalizeIpv4('192.168.2')).toBe('192.168.0.2')
    expect(normalizeIpv4('2130706433')).toBe('127.0.0.1')
    expect(normalizeIpv4('0x7f000001')).toBe('127.0.0.1')
    expect(normalizeIpv4('0x7f.1')).toBe('127.0.0.1')
    expect(normalizeIpv4('0177.0.0.1')).toBe('127.0.0.1')
    expect(normalizeIpv4('010.0.0.1')).toBe('8.0.0.1')
  })

  it('rejects non-IPv4 hosts', () => {
    expect(normalizeIpv4('example.com')).toBeNull()
    expect(normalizeIpv4('1.2.3.4.5')).toBeNull()
    expect(normalizeIpv4('999.1.1.1')).toBeNull()
    expect(normalizeIpv4('')).toBeNull()
  })
})

describe('isPrivateIp', () => {
  const blocked = [
    '127.0.0.1',
    '127.1',
    '10.10.10.10',
    '0177.0.0.1',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '0.1.2.3',
    '2130706433',
    '0x7f000001',
    '224.0.0.1',
    '240.0.0.1',
    '::1',
    '::',
    '[::1]',
    '::ffff:127.0.0.1',
    'fe80::1',
    'fd12::34',
    '2002:7f00:0001::',
  ]
  const allowed = ['93.184.216.34', '8.8.8.8', '172.15.0.1', '172.32.0.1', '100.63.0.1', '2001:4860:4860::8888']

  it('blocks private, loopback, link-local, CGNAT and reserved ranges', () => {
    for (const value of blocked) expect(isPrivateIp(value), value).toBe(true)
  })

  it('allows public addresses', () => {
    for (const value of allowed) expect(isPrivateIp(value), value).toBe(false)
  })
})

describe('parsePublicUrl', () => {
  it('rejects non-http protocols', async () => {
    mockDoh(() => [])
    await expect(parsePublicUrl('ftp://example.com/pub')).rejects.toThrow(/http\(s\)/)
  })

  it('rejects literal private hosts in any notation', async () => {
    mockDoh(() => [])
    for (const url of [
      'http://127.0.0.1/x',
      'http://2130706433/x',
      'http://0x7f000001/x',
      'http://169.254.169.254/latest/meta-data',
      'http://[::1]/x',
      'http://[::ffff:10.0.0.1]/x',
    ]) {
      await expect(parsePublicUrl(url), url).rejects.toThrow(/Private|not allowed/i)
    }
  })

  it('requires the hostname to resolve to public addresses', async () => {
    mockDoh((name, type) =>
      type === 'A' && name === 'ok.example.com' ? [{ type: 1, data: '93.184.216.34' }] : [],
    )
    await expect(parsePublicUrl('https://ok.example.com/x')).resolves.toBeInstanceOf(URL)
  })

  it('rejects hosts that resolve to private space (DNS rebinding style)', async () => {
    mockDoh((_, type) => (type === 'A' ? [{ type: 1, data: '10.0.0.5' }] : []))
    await expect(parsePublicUrl('https://rebind.example.com/x')).rejects.toThrow(/private or reserved/i)
  })

  it('rejects hosts with no records', async () => {
    mockDoh(() => [])
    await expect(parsePublicUrl('https://nx.example.com/x')).rejects.toThrow(/does not resolve/i)
  })

  it('fails closed when DoH is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })))
    await expect(parsePublicUrl('https://doh-down.example.com/x')).rejects.toThrow(/verification failed/i)
  })

  it('assertPublicHost rejects bare digit hosts', async () => {
    mockDoh(() => [])
    await expect(assertPublicHost('12345678')).rejects.toThrow(/not allowed/i)
  })
})

describe('fetchPublic', () => {
  it('re-validates every redirect hop', async () => {
    const seen: string[] = []
    mockDoh(() => [{ type: 1, data: '93.184.216.34' }])
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input)
        seen.push(url)
        if (url.startsWith('https://cloudflare-dns.com')) {
          return new Response(JSON.stringify({ Status: 0, Answer: [{ type: 1, data: '93.184.216.34' }] }), {
            headers: { 'content-type': 'application/dns-json' },
          })
        }
        if (url === 'https://start.example.com/') {
          return new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data' } })
        }
        return new Response('{}')
      }),
    )
    const url = await parsePublicUrl('https://start.example.com/')
    await expect(fetchPublic(url)).rejects.toThrow(/Private|not allowed/i)
    expect(seen).not.toContain('http://169.254.169.254/latest/meta-data')
  })

  it('follows public redirect chains and returns the final response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input)
        if (url.startsWith('https://cloudflare-dns.com')) {
          return new Response(JSON.stringify({ Status: 0, Answer: [{ type: 1, data: '93.184.216.34' }] }), {
            headers: { 'content-type': 'application/dns-json' },
          })
        }
        if (url === 'https://start.example.com/') {
          return new Response(null, { status: 301, headers: { location: 'https://final.example.com/ok' } })
        }
        return new Response('final-body')
      }),
    )
    const url = await parsePublicUrl('https://start.example.com/')
    const response = await fetchPublic(url)
    expect(await response.text()).toBe('final-body')
  })
})
