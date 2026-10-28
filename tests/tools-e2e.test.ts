import { afterEach, describe, expect, it, vi } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createMcpServer, type AppHtmlResolver } from '../shared/mcp/server.ts'
import { TOOLS } from '../shared/tools.ts'

const APP_HTML = '<!doctype html><html><body>card</body></html>'
const withHtml: AppHtmlResolver = async () => APP_HTML

const open: Array<{ client: Client; server: ReturnType<typeof createMcpServer> }> = []

async function setup() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const server = createMcpServer('https://mcp.gholl.com', withHtml)
  const client = new Client({ name: 'tools-e2e', version: '1.0.0' })
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  open.push({ client, server })
  return client
}

afterEach(async () => {
  vi.unstubAllGlobals()
  while (open.length) {
    const { client, server } = open.pop()!
    await client.close().catch(() => undefined)
    await server.close().catch(() => undefined)
  }
})

/** One accepted call per tool: the payload an agent would realistically send. */
const VALID_CASES: Array<[string, Record<string, unknown>]> = [
  ['vram-calc', { modelParamsB: 70, precision: 'int4', contextLength: 32768, batchSize: 4 }],
  ['cron-debugger', { cron: '*/5 * * * *', regex: '\\d+', text: 'a1b2' }],
  ['schema-viewer', { json: '{"@type":"Product","name":"Widget","offers":{"@type":"Offer"}}' }],
  ['api-uptime', { endpoint: 'https://api.example.com/health', method: 'GET' }],
  ['chrono-energy', { birthDate: '1990-06-15', birthTime: '10:30', gender: 'female' }],
  ['jwt-decoder', { token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.7eK3pQdGZ0dJm2rZsYH1TnD3rJ0k1Q2uZ3X5Y8aBcDe' }],
  ['hash-generator', { text: 'hello world', algorithms: ['sha256', 'md5'] }],
  ['color-studio', { color: '#6366f1' }],
  ['gomoku', { moves: '7,7 8,8 6,8 8,6', size: 15 }],
  ['echarts', { option: { xAxis: { type: 'category', data: ['a', 'b'] }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: [1, 2] }] } }],
  ['function-grapher', { family: 'quadratic', params: { a: 1, b: 0, c: -4 } }],
  ['trig-lab', { func: 'cos', A: 2, omega: 1, unit: 'rad' }],
  ['geometry-lab', { shape: 'triangle', points: [[0, 0], [4, 0], [0, 3]] }],
  ['conic-sections', { type: 'hyperbola', a: 3, b: 2 }],
  ['unit-converter', { value: 5, from: 'km', to: 'mi', category: 'length' }],
  ['css-effects', { tab: 'shadow', x: 0, y: 12, blur: 24 }],
  ['dice-roller', { count: 3, sides: 20 }],
  ['world-clock', { zones: ['Asia/Shanghai', 'Europe/London'] }],
  ['statistics', { data: '4, 8, 15, 16, 23, 42' }],
  ['color-palette', { color: '#22d3ee' }],
  ['bit-visualizer', { value: 202, bits: 16 }],
  ['matrix-calculator', { a: '1,2;3,4', b: '5,6;7,8', op: 'multiply' }],
  ['chinese-money', { amount: 1234.56 }],
  ['color-blindness', { color: '#e11d48' }],
  ['random-picker', { items: ['red', 'green', 'blue'] }],
  ['qr-generator', { text: 'https://mcp.gholl.com' }],
  ['loan-calculator', { principal: 500000, rate: 4.5, months: 240 }],
  ['compound-interest', { principal: 10000, rate: 7, years: 20, compounds: 12 }],
  ['password-strength', { password: 'Tr0ub4dor&3xtra' }],
  ['resistor-color', { bands: ['brown', 'black', 'red', 'gold'] }],
  ['text-diff', { a: 'line one\nline two', b: 'line one\nline three' }],
  ['reaction-test', {}],
  ['typing-test', {}],
  ['csv-chart', { csv: 'week,clicks\n1,10\n2,25\n3,40' }],
  ['totp-generator', { secret: 'JBSWY3DPEHPK3PXP', digits: 6, period: 30 }],
  ['image-to-base64', {}],
  ['image-compressor', {}],
  ['icon-generator', { size: 512 }],
  ['favicon-generator', {}],
  ['dns-lookup', { name: 'example.com', type: 'A' }],
  ['http-inspector', { url: 'https://example.com/' }],
  ['quiz', { title: 'Onboarding', questions: [{ id: 'q1', prompt: '1+1?', options: ['1', '2', '3'], answer: 1 }] }],
]

/**
 * Stubs both planes the network tools touch: Cloudflare DoH (host verification)
 * and the probe target, so the suite stays deterministic and offline.
 */
function stubNetwork(options: { dns?: Array<{ type: number; data: string }>; httpStatus?: number } = {}) {
  const { dns = [{ type: 1, data: '93.184.216.34' }], httpStatus = 200 } = options
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = String(input)
      if (url.startsWith('https://cloudflare-dns.com/dns-query')) {
        return new Response(JSON.stringify({ Status: 0, Answer: dns }), {
          headers: { 'content-type': 'application/dns-json' },
        })
      }
      return new Response([204, 205, 304].includes(httpStatus) ? null : '{"ok":true}', {
        status: httpStatus,
        headers: { 'content-type': 'application/json', 'x-served-by': 'e2e' },
      })
    }),
  )
}

describe('every tool answers through the MCP surface', () => {
  it('has an accepted-call case for each registered tool', () => {
    const covered = VALID_CASES.map(([id]) => id).sort()
    expect(covered).toEqual(TOOLS.map((t) => t.id).sort())
  })

  for (const [id, args] of VALID_CASES) {
    it(`tools/call ${id}`, async () => {
      if (['api-uptime', 'dns-lookup', 'http-inspector'].includes(id)) stubNetwork()
      const client = await setup()
      const result = await client.callTool({ name: id, arguments: args })
      expect(result.isError, JSON.stringify(result)).toBeFalsy()
      expect(result.content?.[0]).toMatchObject({ type: 'text' })
      expect((result.content as Array<{ text: string }>)[0].text.trim().length).toBeGreaterThan(0)
      expect(result.structuredContent).toBeTruthy()
      expect(result._meta).toMatchObject({ ui: { resourceUri: `ui://gholl/${id}` } })
    })
  }
})

describe('tool error contracts', () => {
  const REJECTS: Array<[string, Record<string, unknown>, RegExp]> = [
    ['statistics', { data: 'no digits here' }, /No numbers provided/i],
    ['random-picker', { items: [] }, /No items provided/i],
    ['resistor-color', { bands: ['purple'] }, /Invalid resistor bands/i],
    ['matrix-calculator', { a: '1,2;3,4', b: '1,2;3,4;5,6', op: 'multiply' }, /dimensions do not match/i],
    ['geometry-lab', { shape: 'triangle', points: [[0, 0], [1, 1]] }, /needs 3 points/i],
    ['chrono-energy', { birthDate: '15/06/1990' }, /YYYY-MM-DD/],
    ['function-grapher', { family: 'nope' }, /Unknown function family/i],
    ['schema-viewer', {}, /json.*url|Provide either/i],
    ['dns-lookup', { name: 'not a domain' }, /Invalid domain name/i],
    ['conic-sections', { type: 'blobfish' }, /Invalid|unknown/i],
  ]

  for (const [id, args, message] of REJECTS) {
    it(`${id} rejects ${JSON.stringify(args)}`, async () => {
      const client = await setup()
      await expect(client.callTool({ name: id, arguments: args })).rejects.toThrow(message)
    })
  }

  it('returns a card hint instead of failing for UI-only tools', async () => {
    const client = await setup()
    const result = await client.callTool({ name: 'image-compressor', arguments: {} })
    expect(result.isError).toBeFalsy()
    expect((result.content as Array<{ text: string }>)[0].text).toMatch(/card/i)
  })

  it('surfaces a quiz parse error as structured content', async () => {
    const client = await setup()
    const result = await client.callTool({ name: 'quiz', arguments: { questions: [] } })
    expect(result.structuredContent).toMatchObject({ error: /No questions provided/i })
  })
})

describe('network tools stay honest about what they saw', () => {
  it('api-uptime reports the stubbed status', async () => {
    stubNetwork({ httpStatus: 204 })
    const client = await setup()
    const result = await client.callTool({
      name: 'api-uptime',
      arguments: { endpoint: 'https://status.example.com', method: 'GET' },
    })
    expect(result.structuredContent).toMatchObject({ reachable: true, status: 204 })
  })

  it('dns-lookup returns the stubbed answer set', async () => {
    stubNetwork()
    const client = await setup()
    const result = await client.callTool({ name: 'dns-lookup', arguments: { name: 'example.com' } })
    expect(result.structuredContent).toMatchObject({ name: 'example.com', type: 'A' })
  })

  it('http-inspector follows to the final status', async () => {
    stubNetwork({ httpStatus: 404 })
    const client = await setup()
    const result = await client.callTool({ name: 'http-inspector', arguments: { url: 'https://example.com/missing' } })
    expect(result.structuredContent).toMatchObject({ status: 404 })
  })

  it('rejects a host that resolves into private space', async () => {
    stubNetwork({ dns: [{ type: 1, data: '10.0.0.5' }] })
    const client = await setup()
    await expect(
      client.callTool({ name: 'http-inspector', arguments: { url: 'https://rebind.example.com/' } }),
    ).rejects.toThrow(/private or reserved/i)
  })
})
