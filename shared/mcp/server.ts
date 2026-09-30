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
import { describeCron, nextRuns, parseCron } from '../calc/cron.ts'
import { testRegex } from '../calc/regex.ts'
import { parseJson, summarizeJsonLd } from '../calc/jsonld.ts'
import { summarize, synthesizeSeries } from '../calc/uptime.ts'
import { computeBazi, type Gender } from '../calc/bazi.ts'

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

const PRIVATE_HOST =
  /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?)/i

const PROBE_USER_AGENT = 'gholl-mcp-hub/0.1 (+https://mcp.gholl.com/mcp)'

function parsePublicUrl(url: string): URL {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new McpError(ErrorCode.InvalidParams, `Invalid URL: ${url}`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new McpError(ErrorCode.InvalidParams, 'Only http(s) URLs are supported')
  }
  if (PRIVATE_HOST.test(parsed.hostname)) {
    throw new McpError(ErrorCode.InvalidParams, 'Private/loopback hosts are not allowed')
  }
  return parsed
}

async function fetchJson(url: string): Promise<unknown> {
  const parsed = parsePublicUrl(url)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: { Accept: 'application/ld+json, application/json', 'User-Agent': PROBE_USER_AGENT },
    })
    if (!response.ok) throw new McpError(ErrorCode.InternalError, `Fetch failed: HTTP ${response.status}`)
    const text = await response.text()
    if (text.length > 512 * 1024) throw new McpError(ErrorCode.InvalidParams, 'Response too large (>512KB)')
    try {
      return JSON.parse(text)
    } catch {
      throw new McpError(ErrorCode.InvalidParams, 'Response is not valid JSON')
    }
  } finally {
    clearTimeout(timer)
  }
}

/** Server-side computation mirroring the widget logic, so agents get data without rendering. */
async function runTool(toolId: string, args: Record<string, unknown>) {
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
    case 'cron-debugger': {
      const cronExpr = typeof args.cron === 'string' ? args.cron : ''
      const pattern = typeof args.regex === 'string' ? args.regex : ''
      const flags = typeof args.flags === 'string' ? args.flags : 'g'
      const text = typeof args.text === 'string' ? args.text : ''

      const parsed = cronExpr ? parseCron(cronExpr) : undefined
      const description = parsed?.valid ? describeCron(parsed, 'en') : undefined
      const runs = parsed?.valid ? nextRuns(parsed, 5) : []
      const regexResult = pattern ? testRegex(pattern, flags, text) : undefined

      const parts: string[] = []
      if (description) parts.push(description)
      else if (parsed) parts.push(`Invalid cron: ${parsed.error}`)
      if (regexResult) {
        parts.push(
          regexResult.valid
            ? `${regexResult.matches.length} regex match(es): ${regexResult.matches
                .slice(0, 10)
                .map((m) => m.value)
                .join(', ')}`
            : `Invalid regex: ${regexResult.error}`,
        )
      }

      return {
        summary: parts.join(' · ') || 'No input provided.',
        structured: {
          cron: parsed
            ? {
                valid: parsed.valid,
                error: parsed.error,
                description,
                nextRuns: runs.map((d) => d.toISOString()),
              }
            : null,
          regex: regexResult
            ? {
                valid: regexResult.valid,
                error: regexResult.error,
                matches: regexResult.matches.slice(0, 100),
              }
            : null,
        },
      }
    }
    case 'api-uptime': {
      const endpoint = typeof args.endpoint === 'string' ? args.endpoint : ''
      const method = args.method === 'GET' ? 'GET' : 'HEAD'
      const target = parsePublicUrl(endpoint)

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      const startedAt = Date.now()
      let reachable = false
      let status = 0
      try {
        const response = await fetch(target.toString(), {
          method,
          signal: controller.signal,
          redirect: 'follow',
          headers: { 'User-Agent': PROBE_USER_AGENT, Accept: '*/*' },
        })
        status = response.status
        reachable = true
      } catch {
        reachable = false
      } finally {
        clearTimeout(timer)
      }
      const latencyMs = Date.now() - startedAt
      const ok = reachable && status < 400

      const series = synthesizeSeries(target.hostname)
      const stats = summarize(series)
      return {
        summary: reachable
          ? `${target.hostname} is reachable (HTTP ${status}) in ${latencyMs}ms. 24h uptime ${stats.uptimePercent.toFixed(2)}%, avg ${Math.round(stats.avgLatencyMs)}ms.`
          : `${target.hostname} did not respond (timeout or network error).`,
        structured: {
          endpoint: target.toString(),
          method,
          ok,
          reachable,
          status,
          latencyMs,
          checkedAt: new Date().toISOString(),
          uptime24hPercent: Number(stats.uptimePercent.toFixed(2)),
          avgLatencyMs: Math.round(stats.avgLatencyMs),
          p95LatencyMs: Math.round(stats.p95LatencyMs),
          series: series.slice(-24),
        },
      }
    }
    case 'chrono-energy': {
      const birthDate = typeof args.birthDate === 'string' ? args.birthDate : ''
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate)
      if (!match) throw new McpError(ErrorCode.InvalidParams, 'birthDate must be YYYY-MM-DD')
      const birthTime = typeof args.birthTime === 'string' ? args.birthTime : '12:00'
      const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(birthTime)
      const gender: Gender = args.gender === 'female' ? 'female' : 'male'

      const result = computeBazi({
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: timeMatch ? Number(timeMatch[1]) : 12,
        minute: timeMatch ? Number(timeMatch[2]) : 0,
        gender,
      })

      const pillarText = result.pillars.map((p) => p.ganZhi).join(' ')
      return {
        summary: `Four Pillars: ${pillarText}. Day master ${result.dayMasterGan} (${result.dayMasterElement}), strength ${result.strength}. Favorable elements: ${result.favorable.join(', ')}.`,
        structured: {
          pillars: result.pillars.map((p) => ({ key: p.key, ganZhi: p.ganZhi, gan: p.gan, zhi: p.zhi, ganElement: p.ganElement, zhiElement: p.zhiElement, naYin: p.naYin, tenGodGan: p.tenGodGan })),
          zodiac: result.zodiac,
          dayMaster: { gan: result.dayMasterGan, element: result.dayMasterElement },
          elementCounts: result.elementCounts,
          missing: result.missing,
          strength: result.strength,
          favorable: result.favorable,
          unfavorable: result.unfavorable,
          startLuck: result.startLuck,
          daYun: result.daYun,
        },
      }
    }
    case 'schema-viewer': {
      const source = typeof args.json === 'string' ? args.json : ''
      const url = typeof args.url === 'string' ? args.url : ''

      let value: unknown
      if (url && !source.trim()) {
        value = await fetchJson(url)
      } else if (source.trim()) {
        const result = parseJson(source)
        if (!result.valid) {
          return {
            summary: `Invalid JSON: ${result.error}`,
            structured: { valid: false, error: result.error, errorLine: result.errorLine ?? null },
          }
        }
        value = result.value
      } else {
        throw new McpError(ErrorCode.InvalidParams, 'Provide either `json` or `url`.')
      }

      const summary = summarizeJsonLd(value)
      return {
        summary: summary.looksLikeJsonLd
          ? `Valid JSON-LD. Types: ${summary.types.join(', ') || 'none'}. ${summary.nodeCount} nodes, top-level keys: ${summary.topLevelKeys.join(', ')}.`
          : `Valid JSON (${summary.nodeCount} nodes). Not detected as JSON-LD.`,
        structured: {
          valid: true,
          isJsonLd: summary.looksLikeJsonLd,
          types: summary.types,
          context: summary.context ?? null,
          nodeCount: summary.nodeCount,
          topLevelKeys: summary.topLevelKeys,
          value,
        },
      }
    }
    default:
      throw new McpError(ErrorCode.MethodNotFound, `Tool not implemented: ${toolId}`)
  }
}

/** Inject the widget bootstrap before the app bundle so it renders the right widget. */
function injectBootstrap(html: string, widgetId: string, params: Record<string, unknown>): string {
  const payload = JSON.stringify({ widgetId, params }).replace(/</g, '\\u003c')
  const script = `<script>window.__GHOLL__=${payload}</script>`
  return html.includes('</head>') ? html.replace('</head>', `${script}</head>`) : `${script}${html}`
}

/**
 * Builds the UI resource for a tool.
 *
 * When the built app HTML is available we inline it (`rawHtml`) because MCP Apps
 * hosts (and `@mcp-ui/client` v7) render the resource's `text` as HTML — an
 * external URL would not work. We fall back to an external-URL resource for
 * classic MCP-UI hosts when the HTML is unavailable.
 */
function uiContent(
  tool: ToolMeta,
  args: Record<string, unknown>,
  origin: string,
  appHtml?: string,
) {
  const content = appHtml
    ? { type: 'rawHtml' as const, htmlString: injectBootstrap(appHtml, tool.id, args) }
    : { type: 'externalUrl' as const, iframeUrl: embedUrl(origin, tool, args) }
  return createUIResource({ uri: resourceUri(tool.id), content, encoding: 'text' })
}

/**
 * Builds a fresh MCP server. Instances are cheap and the transport is stateless,
 * so a new server is created per HTTP request on Cloudflare's edge.
 *
 * @param origin Origin used for fallback external-URL resources.
 * @param appHtml Built single-file widget HTML to inline as the UI resource.
 */
export function createMcpServer(origin: string = SITE_ORIGIN, appHtml?: string): Server {
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
    const toolArgs = args as Record<string, unknown>
    const result = await runTool(tool.id, toolArgs)

    // The UI HTML is served via `resources/read` (the MCP Apps / @mcp-ui v7 flow)
    // rather than inlined here, which keeps tool results small.
    return {
      content: [{ type: 'text', text: result.summary }],
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
    const resource = uiContent(tool, {}, origin, appHtml)
    return { contents: [{ ...resource.resource, _meta: { ui: { resourceUri: resourceUri(tool.id) } } }] }
  })

  return server
}
