import { afterEach, describe, expect, it } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { encode as encodeJpeg } from 'jpeg-js'
import { createMcpServer, type AppHtmlResolver } from '../shared/mcp/server.ts'
import { decodePng, encodePng, type RgbaImage } from '../shared/calc/icon.ts'

const withHtml: AppHtmlResolver = async () => '<!doctype html><html><body>ok</body></html>'

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

type ImageBlock = { type: 'image'; data: string; mimeType: string }
type TextBlock = { type: 'text'; text: string }
type IconResult = {
  content: Array<TextBlock | ImageBlock>
  structuredContent?: {
    imageProvided?: boolean
    sourceFormat?: string
    targets?: Array<{ filename?: string; size?: number; platform?: string }>
    generated?: Array<{ filename?: string; size?: number; platform?: string }>
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function testImage(): RgbaImage {
  const width = 6
  const height = 4
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      data[index] = 30 + x * 20
      data[index + 1] = 200 - y * 20
      data[index + 2] = 120
      data[index + 3] = 255
    }
  }
  return { width, height, data }
}

async function pngDataUri(): Promise<string> {
  const bytes = await encodePng(testImage())
  return `data:image/png;base64,${toBase64(bytes)}`
}

function imageBlocks(result: IconResult): ImageBlock[] {
  return result.content.filter((block): block is ImageBlock => block.type === 'image')
}

describe('icon-generator MCP tool', () => {
  it('is listed with a ui resource uri', async () => {
    const { client } = await setup(withHtml)
    const tools = await client.listTools()
    const tool = tools.tools.find((item) => item.name === 'icon-generator')
    expect(tool).toBeTruthy()
    expect(tool?._meta?.ui).toMatchObject({ resourceUri: 'ui://gholl/icon-generator' })
    expect(tool?.inputSchema).toBeTruthy()
  })

  it('generates one PNG for an explicit target id', async () => {
    const { client } = await setup(withHtml)
    const image = await pngDataUri()
    const result = (await client.callTool({
      name: 'icon-generator',
      arguments: { image, targets: ['web-favicon-32'] },
    })) as IconResult

    expect(result.content).toHaveLength(2)
    expect(result.content[0]).toMatchObject({ type: 'text' })
    expect(result.content[1]).toMatchObject({ type: 'image', mimeType: 'image/png' })

    const blocks = imageBlocks(result)
    const decoded = await decodePng(fromBase64(blocks[0].data))
    expect(decoded.width).toBe(32)
    expect(decoded.height).toBe(32)

    expect(result.structuredContent?.targets).toHaveLength(1)
    expect(result.structuredContent?.targets?.[0]?.filename).toBe('favicon-32x32.png')
    expect(result.structuredContent?.imageProvided).toBe(true)
    expect(result.structuredContent?.sourceFormat).toBe('png')
  })

  it('returns a single square PNG for the size shortcut', async () => {
    const { client } = await setup(withHtml)
    const image = await pngDataUri()
    const result = (await client.callTool({
      name: 'icon-generator',
      arguments: { image, size: 512 },
    })) as IconResult

    const blocks = imageBlocks(result)
    expect(blocks).toHaveLength(1)
    expect(result.structuredContent?.generated?.[0]?.filename).toBe('icon-512.png')

    const decoded = await decodePng(fromBase64(blocks[0].data))
    expect(decoded.width).toBe(512)
    expect(decoded.height).toBe(512)
  })

  it('generates the full web platform set', async () => {
    const { client } = await setup(withHtml)
    const image = await pngDataUri()
    const result = (await client.callTool({
      name: 'icon-generator',
      arguments: { image, platforms: ['web'] },
    })) as IconResult

    expect(imageBlocks(result)).toHaveLength(7)
  })

  it('returns the interactive card hint when no image is supplied', async () => {
    const { client } = await setup(withHtml)
    const result = (await client.callTool({ name: 'icon-generator', arguments: {} })) as IconResult

    expect(result.content).toHaveLength(1)
    expect(result.content[0]).toMatchObject({ type: 'text' })
    expect(imageBlocks(result)).toHaveLength(0)
    expect(result.structuredContent?.imageProvided).toBe(false)
    expect(result.structuredContent?.targets).toHaveLength(7)
  })

  it('rejects an undecodable data URI', async () => {
    const { client } = await setup(withHtml)
    await expect(
      client.callTool({
        name: 'icon-generator',
        arguments: { image: 'data:image/png;base64,AAAA' },
      }),
    ).rejects.toThrow()
  })

  it('decodes a JPEG source and returns the requested size', async () => {
    const { client } = await setup(withHtml)
    const source = testImage()
    const jpeg = encodeJpeg({ data: source.data, width: source.width, height: source.height }, 90)
    const image = `data:image/jpeg;base64,${toBase64(new Uint8Array(jpeg.data))}`

    const result = (await client.callTool({
      name: 'icon-generator',
      arguments: { image, targets: ['web-favicon-32'] },
    })) as IconResult

    const blocks = imageBlocks(result)
    expect(blocks).toHaveLength(1)
    expect(result.structuredContent?.sourceFormat).toBe('jpeg')

    const decoded = await decodePng(fromBase64(blocks[0].data))
    expect(decoded.width).toBe(32)
    expect(decoded.height).toBe(32)
  })
})
