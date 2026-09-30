import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { createUIResource } from '@mcp-ui/server'
import { TOOLS, getTool } from '../tools.ts'
import { SITE_ORIGIN, type ToolMeta } from '../types.ts'
import { estimateVram, type Precision, type KvPrecision } from '../calc/vram.ts'

export const SERVER_INFO = { name: 'mcp.gholl.com', version: '0.1.0' } as const

export const UI_URI_PREFIX = 'ui://gholl/'
const RESOURCE_MIME = 'text/html;profile=mcp-app'

export type UiUri = `ui://${string}`

export function resourceUri(toolId: string): UiUri {
  return `${UI_URI_PREFIX}${toolId}`
}

function toolIdFromUri(uri: string): string | undefined {
  return uri.startsWith(UI_URI_PREFIX) ? uri.slice(UI_URI_PREFIX.length) : undefined
}

function embedUrl(origin: string, tool: ToolMeta, args: Record<string, unknown>): string {
  const url = new URL(tool.embedPath, origin)
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null) continue
    url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function asNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(n) ? n : fallback
}

function asEnum<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return typeof value === 'string' && (allowed as string[]).includes(value) ? (value as T) : fallback
}

/** Server-side computation mirroring the widget logic, so agents get data without rendering. */
function runTool(toolId: string, args: Record<string, unknown>) {
  switch (toolId) {
    case 'vram-calc': {
      const estimate = estimateVram({
        modelParamsB: asNumber(args.modelParamsB, 7),
        precision: asEnum<Precision>(args.precision, ['fp16', 'int8', 'int4'], 'fp16'),
        contextLength: asNumber(args.contextLength, 8192),
        batchSize: asNumber(args.batchSize, 1),
        kvPrecision: asEnum<KvPrecision>(args.kvPrecision, ['fp16', 'int8'], 'fp16'),
        tensorParallel: asNumber(args.tensorParallel, 1),
      })
      const best = estimate.recommendations.find((r) => r.fits) ?? estimate.recommendations[0]
      const summary = {
        totalVramGB: Number(estimate.totalGB.toFixed(2)),
        breakdown: {
          weightsGB: Number(estimate.weightsGB.toFixed(2)),
          kvCacheGB: Number(estimate.kvCacheGB.toFixed(2)),
          activationsGB: Number(estimate.activationsGB.toFixed(2)),
          overheadGB: Number(estimate.overheadGB.toFixed(2)),
        },
        architecture: estimate.architecture,
        recommendedGpu: best
          ? { name: best.name, count: best.count, totalVramGB: best.totalVramGB, utilization: Number(best.utilization.toFixed(2)) }
          : null,
        commands: estimate.commands,
      }
      return {
        summary: `${summary.totalVramGB} GB VRAM required. Recommended: ${best?.count ?? 1} × ${best?.name ?? 'GPU'}.`,
        structured: summary,
      }
    }
    default:
      throw new McpError(ErrorCode.MethodNotFound, `Tool not implemented: ${toolId}`)
  }
}

function uiContent(tool: ToolMeta, args: Record<string, unknown>, origin: string) {
  return createUIResource({
    uri: resourceUri(tool.id),
    content: { type: 'externalUrl', iframeUrl: embedUrl(origin, tool, args) },
    encoding: 'text',
  })
}

/**
 * Builds a fresh MCP server. Instances are cheap and the transport is stateless,
 * so a new server is created per HTTP request on Cloudflare's edge.
 */
export function createMcpServer(origin: string = SITE_ORIGIN): Server {
  const server = new Server(SERVER_INFO, {
    capabilities: { tools: {}, resources: {} },
    instructions:
      'Interactive micro-tools by gholl.com. Each tool returns a UI resource that hosts should render as a sandboxed iframe, plus structured content for non-UI clients.',
  })

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map((tool) => ({
      name: tool.id,
      title: tool.name,
      description: tool.mcpDescription,
      inputSchema: tool.inputSchema,
      _meta: { ui: { resourceUri: resourceUri(tool.id) } },
    })),
  }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = getTool(request.params.name)
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`)
    }
    const args = (request.params.arguments ?? {}) as Record<string, unknown>
    const { locale, ...toolArgs } = args
    const result = runTool(tool.id, toolArgs)
    const resource = uiContent(tool, locale ? { locale, ...toolArgs } : toolArgs, origin)

    return {
      content: [{ type: 'text', text: result.summary }, resource],
      structuredContent: result.structured,
      _meta: { ui: { resourceUri: resourceUri(tool.id) } },
    }
  })

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: TOOLS.map((tool) => ({
      uri: resourceUri(tool.id),
      name: tool.name,
      description: tool.description.en,
      mimeType: RESOURCE_MIME,
    })),
  }))

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const toolId = toolIdFromUri(request.params.uri)
    const tool = toolId ? getTool(toolId) : undefined
    if (!tool) {
      throw new McpError(ErrorCode.InvalidParams, `Unknown resource: ${request.params.uri}`)
    }
    const resource = uiContent(tool, {}, origin)
    return { contents: [{ ...resource.resource, _meta: { ui: { resourceUri: resourceUri(tool.id) } } }] }
  })

  return server
}
