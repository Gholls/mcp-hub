import { afterEach, describe, expect, it } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createMcpServer, type AppHtmlResolver } from '../shared/mcp/server.ts'
import { TOOLS } from '../shared/tools.ts'

const APP_HTML = '<!doctype html><html><head><title>widget</title></head><body>ok</body></html>'
const withHtml: AppHtmlResolver = async () => APP_HTML
const withoutHtml: AppHtmlResolver = async () => undefined

async function connect(resolveAppHtml?: AppHtmlResolver) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const server = createMcpServer('https://mcp.gholl.com', resolveAppHtml)
  const client = new Client({ name: 'test-client', version: '1.0.0' })
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  return { client, server }
}

const open: Array<{ client: Client; server: ReturnType<typeof createMcpServer> }> = []

afterEach(async () => {
  while (open.length) {
    const { client, server } = open.pop()!
    await client.close().catch(() => undefined)
    await server.close().catch(() => undefined)
  }
})

async function setup(resolveAppHtml?: AppHtmlResolver) {
  const conn = await connect(resolveAppHtml)
  open.push(conn)
  return conn
}

describe('MCP server', () => {
  it('advertises every tool with a ui resource uri', async () => {
    const { client } = await setup(withHtml)
    const tools = await client.listTools()
    expect(tools.tools.map((t) => t.name).sort()).toEqual(TOOLS.map((t) => t.id).sort())
    for (const tool of tools.tools) {
      expect(tool._meta?.ui).toMatchObject({ resourceUri: `ui://gholl/${tool.name}` })
      expect(tool.inputSchema).toBeTruthy()
    }
  })

  it('returns text + structured content without inlining the UI html', async () => {
    const { client } = await setup(withHtml)
    const result = await client.callTool({ name: 'vram-calc', arguments: { modelParamsB: 7 } })
    expect(result.content).toHaveLength(1)
    expect(result.content[0]).toMatchObject({ type: 'text' })
    expect(result.structuredContent).toBeTruthy()
    expect(result._meta?.ui).toMatchObject({ resourceUri: 'ui://gholl/vram-calc' })
  })

  it('serves the pre-built widget html via resources/read', async () => {
    const { client } = await setup(withHtml)
    const resource = await client.readResource({ uri: 'ui://gholl/vram-calc' })
    const content = resource.contents[0] as { mimeType: string; text: string }
    expect(content.mimeType).toBe('text/html;profile=mcp-app')
    expect(content.text).toBe(APP_HTML)
  })

  it('falls back to an external url resource without app html', async () => {
    const { client } = await setup(withoutHtml)
    const resource = await client.readResource({ uri: 'ui://gholl/vram-calc' })
    const content = resource.contents[0] as { mimeType: string; text: string }
    expect(content.mimeType).toBe('text/html;profile=mcp-app')
    expect(content.text).toBe('https://mcp.gholl.com/embed/vram-calc')
  })

  it('lists resources for every tool', async () => {
    const { client } = await setup(withHtml)
    const resources = await client.listResources()
    expect(resources.resources).toHaveLength(TOOLS.length)
  })

  it('errors on unknown tools', async () => {
    const { client } = await setup(withHtml)
    await expect(client.callTool({ name: 'nope', arguments: {} })).rejects.toThrow()
  })
})
