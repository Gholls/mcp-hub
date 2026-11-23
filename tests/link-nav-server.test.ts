import { afterEach, describe, expect, it } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createMcpServer, type AppHtmlResolver } from '../shared/mcp/server.ts'

const withHtml: AppHtmlResolver = async () => '<!doctype html><html><body>ok</body></html>'

type LinkNavStructured = {
  title?: string
  subtitle?: string
  sites: Array<{ name: string; url: string; description?: string; icon?: string; category?: string }>
  categories: string[]
  dropped: number
}

type LinkNavResult = {
  content: Array<{ type: 'text'; text: string }>
  structuredContent?: LinkNavStructured
  _meta?: { ui?: { resourceUri?: string } }
}

const open: Array<{ client: Client; server: ReturnType<typeof createMcpServer> }> = []

afterEach(async () => {
  while (open.length) {
    const { client, server } = open.pop()!
    await client.close().catch(() => undefined)
    await server.close().catch(() => undefined)
  }
})

async function setup() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const server = createMcpServer('https://mcp.gholl.com', withHtml)
  const client = new Client({ name: 'test-client', version: '1.0.0' })
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  open.push({ client, server })
  return { client }
}

describe('link-nav MCP tool', () => {
  it('is discoverable and points at its UI resource', async () => {
    const { client } = await setup()
    const { tools } = await client.listTools()
    const tool = tools.find((item) => item.name === 'link-nav')
    expect(tool).toBeDefined()
    expect(tool?.inputSchema.required).toContain('sites')
    expect(tool?._meta).toMatchObject({ ui: { resourceUri: 'ui://gholl/link-nav' } })
  })

  it('returns the normalized directory as structured content', async () => {
    const { client } = await setup()
    const result = (await client.callTool({
      name: 'link-nav',
      arguments: {
        title: 'Dev toolkit',
        sites: [
          { name: 'GitHub', url: 'github.com', description: 'Code hosting', icon: '🐙', category: 'Code' },
          { name: 'MDN', url: 'https://developer.mozilla.org', category: 'Docs' },
          { name: 'Bad', url: 'javascript:alert(1)' },
        ],
      },
    })) as unknown as LinkNavResult

    const structured = result.structuredContent
    expect(structured?.title).toBe('Dev toolkit')
    expect(structured?.sites.map((site) => site.name)).toEqual(['GitHub', 'MDN'])
    expect(structured?.sites[0]?.url).toBe('https://github.com/')
    expect(structured?.categories).toEqual(['Code', 'Docs'])
    expect(structured?.dropped).toBe(1)
    expect(result.content[0]?.text).toContain('2 sites')
    expect(result.content[0]?.text).toContain('GitHub')
    expect(result._meta?.ui?.resourceUri).toBe('ui://gholl/link-nav')
  })

  it('explains how to pass sites when the list is empty', async () => {
    const { client } = await setup()
    const result = (await client.callTool({ name: 'link-nav', arguments: {} })) as unknown as LinkNavResult
    expect(result.structuredContent?.sites).toEqual([])
    expect(result.content[0]?.text).toContain('sites')
  })
})
