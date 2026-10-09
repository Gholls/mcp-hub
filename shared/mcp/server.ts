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
import { decodeJwt } from '../calc/jwt.ts'
import { HASH_ALGORITHMS, hashText, type HashAlgorithm } from '../calc/hash.ts'
import { analyzeColor, parseColor, scaleColor } from '../calc/color.ts'
import { boardToText, gameState, rcToCoord } from '../calc/gomoku.ts'
import { parseOption, summarizeOption } from '../calc/echarts.ts'
import {
  defaultParams,
  features as graphFeatures,
  getFamily,
  substitutedLatex,
} from '../calc/grapher.ts'
import { graphLatex, trigFeatures, type AngleUnit, type TrigFunc, type TrigParams } from '../calc/trig.ts'
import { conicEquation, conicFeatures, type ConicType } from '../calc/conic.ts'
import { transformJson } from '../calc/jsonfmt.ts'
import { convertUnits } from '../calc/units.ts'
import { buildBorderRadius, buildBoxShadow, buildGradient, type GradientKind } from '../calc/design.ts'
import { bmi, bmiCategory } from '../calc/bmi.ts'
import { findStatus } from '../calc/httpstatus.ts'
import { rollDice, sum } from '../calc/dice.ts'
import {
  circleMeasures,
  classifyQuadrilateral,
  polygonArea,
  polygonPerimeter,
  quadrilateralAngles,
  triangleMeasures,
  type Point,
} from '../calc/geometry.ts'

export const SERVER_INFO = { name: 'mcp.gholl.com', version: '0.1.0' } as const

export const UI_URI_PREFIX = 'ui://gholl/'
const RESOURCE_MIME = 'text/html;profile=mcp-app'

/**
 * UI resource metadata (`McpUiResourceMeta`). Widgets are fully self-contained
 * (inline JS/CSS, no external requests), so we declare a deny-all CSP and ask
 * for a visible border.
 */
const RESOURCE_UI_META = {
  ui: {
    prefersBorder: true,
    csp: {
      connectDomains: [],
      resourceDomains: [],
      frameDomains: [],
      baseUriDomains: [],
    },
  },
} as const

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
    case 'jwt-decoder': {
      const token = typeof args.token === 'string' ? args.token : ''
      const result = decodeJwt(token)
      if (!result.valid) {
        return {
          summary: `Invalid JWT: ${result.error}`,
          structured: { valid: false, error: result.error },
        }
      }
      const status = result.expired
        ? `expired at ${result.expiresAt}`
        : result.expiresAt
          ? `valid until ${result.expiresAt}`
          : 'no expiry claim'
      return {
        summary: `Decoded JWT (alg ${String(result.header?.alg ?? 'unknown')}), ${status}.`,
        structured: {
          valid: true,
          header: result.header,
          payload: result.payload,
          claims: result.claims,
          expired: result.expired ?? null,
          expiresAt: result.expiresAt ?? null,
          expiresInSeconds: result.expiresInSeconds ?? null,
        },
      }
    }
    case 'hash-generator': {
      const text = typeof args.text === 'string' ? args.text : ''
      const requested = Array.isArray(args.algorithms)
        ? (args.algorithms.filter((a): a is HashAlgorithm =>
            HASH_ALGORITHMS.includes(a as HashAlgorithm),
          ) as HashAlgorithm[])
        : HASH_ALGORITHMS
      const algorithms = requested.length > 0 ? requested : HASH_ALGORITHMS
      const results = await hashText(text, algorithms)
      return {
        summary: results.map((r) => `${r.algorithm}: ${r.hex}`).join('\n'),
        structured: { bytes: new TextEncoder().encode(text).length, hashes: results },
      }
    }
    case 'color-studio': {
      const color = typeof args.color === 'string' ? args.color : ''
      const info = analyzeColor(color)
      if (!info.valid) {
        return { summary: `Invalid color: ${info.error}`, structured: { valid: false, error: info.error } }
      }
      const rgb = parseColor(color)
      const scale = rgb ? scaleColor(rgb, 4) : []
      return {
        summary: `${info.hex} · RGB ${info.rgb?.r},${info.rgb?.g},${info.rgb?.b} · HSL ${info.hsl?.h}°,${info.hsl?.s}%,${info.hsl?.l}%. Contrast vs white ${info.contrastWhite}:1 (${info.aaWhite ? 'AA pass' : 'AA fail'}), vs black ${info.contrastBlack}:1 (${info.aaBlack ? 'AA pass' : 'AA fail'}).`,
        structured: {
          valid: true,
          hex: info.hex,
          rgb: info.rgb,
          hsl: info.hsl,
          luminance: info.luminance,
          contrastWhite: info.contrastWhite,
          contrastBlack: info.contrastBlack,
          wcag: {
            aaWhite: info.aaWhite,
            aaaWhite: info.aaaWhite,
            aaBlack: info.aaBlack,
            aaaBlack: info.aaaBlack,
          },
          bestTextColor: info.bestTextColor,
          scale,
        },
      }
    }
    case 'gomoku': {
      const size = Math.min(19, Math.max(9, Math.round(asNumber(args.size, 15))))
      const moves = typeof args.moves === 'string' ? args.moves : ''
      const humanColor = args.humanColor === 'white' ? 'white' : 'black'
      const state = gameState(moves, size)

      const summary = state.error
        ? `Gomoku: ${state.error}`
        : state.winner
          ? `Gomoku (${size}x${size}) over after ${state.moves.length} moves. Winner: ${state.winner}.`
          : state.isDraw
            ? `Gomoku (${size}x${size}) is a draw after ${state.moves.length} moves.`
            : `Gomoku (${size}x${size}), ${state.moves.length} moves played. Next to move: ${state.nextColor}.`

      return {
        summary,
        structured: {
          size,
          humanColor,
          moves: state.moves.map((mv) => rcToCoord(mv.r, mv.c)),
          nextColor: state.nextColor,
          winner: state.winner,
          isDraw: state.isDraw,
          gameOver: state.gameOver,
          error: state.error ?? null,
          board: boardToText(state.board, state.lastMove),
        },
      }
    }
    case 'echarts': {
      const parsed = parseOption(args.option)
      if (!parsed.option) {
        return { summary: `ECharts: ${parsed.error}`, structured: { error: parsed.error } }
      }
      const info = summarizeOption(parsed.option)
      const types = info.chartTypes.join(', ') || 'unknown'
      return {
        summary:
          `ECharts chart (${types}) with ${info.seriesCount} series and ${info.points} data points.` +
          (info.title ? ` Title: "${info.title}".` : ''),
        structured: {
          title: typeof args.title === 'string' ? args.title : (info.title ?? null),
          subtitle: typeof args.subtitle === 'string' ? args.subtitle : null,
          insights: typeof args.insights === 'string' ? args.insights : null,
          enableInteractivity: args.enableInteractivity !== false,
          chartTypes: info.chartTypes,
          seriesCount: info.seriesCount,
          points: info.points,
          option: parsed.option,
        },
      }
    }
    case 'function-grapher': {
      const family = getFamily(typeof args.family === 'string' ? args.family : 'quadratic')
      if (!family) throw new McpError(ErrorCode.InvalidParams, 'Unknown function family')
      const provided: Record<string, number> = {}
      if (typeof args.params === 'object' && args.params !== null) {
        for (const [key, value] of Object.entries(args.params as Record<string, unknown>)) {
          const n = Number(value)
          if (Number.isFinite(n)) provided[key] = n
        }
      }
      const params = { ...defaultParams(family), ...provided }
      const equation = substitutedLatex(family, params)
      const facts = graphFeatures(family, params)
      return {
        summary:
          `Function graph: ${equation} (${family.label.en}). Features: ` +
          facts.map((f) => `${f.label.en} ${f.latex}`).join('; ') +
          '.',
        structured: {
          family: family.id,
          stage: family.stage,
          params,
          equation,
          features: facts.map((f) => ({ label: f.label.en, value: f.latex })),
        },
      }
    }
    case 'trig-lab': {
      const func: TrigFunc = args.func === 'cos' ? 'cos' : args.func === 'tan' ? 'tan' : 'sin'
      const unit: AngleUnit = args.unit === 'deg' ? 'deg' : 'rad'
      const params: TrigParams = {
        func,
        unit,
        A: asNumber(args.A, 1),
        omega: asNumber(args.omega, 1),
        phi: asNumber(args.phi, 0),
        k: asNumber(args.k, 0),
      }
      const equation = graphLatex(params)
      const facts = trigFeatures(params)
      return {
        summary:
          `Trigonometric graph: ${equation}. ` +
          facts.map((f) => `${f.label.en} ${f.latex}`).join('; ') +
          '.',
        structured: {
          ...params,
          equation,
          features: facts.map((f) => ({ label: f.label.en, value: f.latex })),
        },
      }
    }
    case 'geometry-lab': {
      const shape = args.shape === 'quadrilateral' ? 'quadrilateral' : args.shape === 'circle' ? 'circle' : 'triangle'
      const round = (n: number) => Math.round(n * 100) / 100
      const parsePoints = (): Point[] => {
        const pts = Array.isArray(args.points) ? args.points : []
        const parsed = pts
          .filter((p): p is number[] => Array.isArray(p) && p.length >= 2)
          .map((p) => ({ x: Number(p[0]), y: Number(p[1]) }))
          .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
        return parsed
      }
      if (shape === 'circle') {
        const radius = Math.max(0.1, asNumber(args.radius, 3))
        const m = circleMeasures(radius)
        return {
          summary: `Circle r=${round(m.radius)}: d=${round(m.diameter)}, C=2πr=${round(m.circumference)}, S=πr²=${round(m.area)}.`,
          structured: { shape, ...m },
        }
      }
      const pts = parsePoints()
      if (shape === 'triangle') {
        if (pts.length !== 3) throw new McpError(ErrorCode.InvalidParams, 'triangle needs 3 points')
        const m = triangleMeasures(pts)
        return {
          summary: `Triangle sides a=${round(m.sides[0])}, b=${round(m.sides[1])}, c=${round(m.sides[2])}; angles ${m.angles.map(round).join('°, ')}°; area ${round(m.area)}; perimeter ${round(m.perimeter)}.${m.isRight ? ' Right triangle.' : ''}`,
          structured: { shape, points: pts, ...m, angleSum: round(m.angles.reduce((a, b) => a + b, 0)) },
        }
      }
      if (pts.length !== 4) throw new McpError(ErrorCode.InvalidParams, 'quadrilateral needs 4 points')
      const angles = quadrilateralAngles(pts)
      return {
        summary: `Quadrilateral (${classifyQuadrilateral(pts)}): angles ${angles.map(round).join('°, ')}°; area ${round(polygonArea(pts))}; perimeter ${round(polygonPerimeter(pts))}.`,
        structured: {
          shape,
          points: pts,
          type: classifyQuadrilateral(pts),
          angles,
          area: round(polygonArea(pts)),
          perimeter: round(polygonPerimeter(pts)),
        },
      }
    }
    case 'conic-sections': {
      const type: ConicType =
        args.type === 'circle' || args.type === 'parabola' || args.type === 'hyperbola'
          ? args.type
          : 'ellipse'
      const params = {
        type,
        a: Math.max(0.1, asNumber(args.a, 3)),
        b: Math.max(0.1, asNumber(args.b, 2)),
        p: Math.max(0.1, asNumber(args.p, 2)),
      }
      return {
        summary:
          `${type} conic: ${conicEquation(params)}. ` +
          conicFeatures(params).map((f) => `${f.label.en} ${f.latex}`).join('; ') +
          '.',
        structured: {
          ...params,
          equation: conicEquation(params),
          features: conicFeatures(params).map((f) => ({ label: f.label.en, value: f.latex })),
        },
      }
    }
    case 'json-formatter': {
      const mode = args.mode === 'minify' ? 'minify' : 'format'
      const result = transformJson(typeof args.json === 'string' ? args.json : '', mode)
      if (!result.ok || !result.stats) {
        return {
          summary: `Invalid JSON: ${result.error}`,
          structured: { valid: false, error: result.error, errorLine: result.errorLine ?? null },
        }
      }
      return {
        summary: `${mode === 'minify' ? 'Minified' : 'Formatted'} JSON — ${result.stats.bytes} bytes, ${result.stats.nodes} nodes, depth ${result.stats.depth}.`,
        structured: { valid: true, text: result.text, stats: result.stats },
      }
    }
    case 'unit-converter': {
      const category = typeof args.category === 'string' ? args.category : 'length'
      const value = asNumber(args.value, 1)
      const from = typeof args.from === 'string' ? args.from : ''
      const to = typeof args.to === 'string' ? args.to : ''
      const result = convertUnits(category, value, from, to)
      if (result === null) {
        throw new McpError(ErrorCode.InvalidParams, `Cannot convert ${from} → ${to} in ${category}`)
      }
      const rounded = Math.round(result * 1e6) / 1e6
      return {
        summary: `${value} ${from} = ${rounded} ${to} (${category}).`,
        structured: { category, value, from, to, result: rounded },
      }
    }
    case 'gradient-generator': {
      const kind: GradientKind = args.kind === 'radial' ? 'radial' : 'linear'
      const css = buildGradient(asNumber(args.angle, 135), String(args.from ?? '#6366f1'), String(args.to ?? '#22d3ee'), kind)
      return { summary: `background: ${css};`, structured: { kind, css } }
    }
    case 'box-shadow': {
      const css = buildBoxShadow({
        x: asNumber(args.x, 0),
        y: asNumber(args.y, 12),
        blur: asNumber(args.blur, 24),
        spread: asNumber(args.spread, -6),
        color: String(args.color ?? '#00000055'),
        inset: args.inset === true,
      })
      return { summary: `box-shadow: ${css};`, structured: { css } }
    }
    case 'border-radius': {
      const css = buildBorderRadius(
        asNumber(args.tl, 24),
        asNumber(args.tr, 24),
        asNumber(args.br, 24),
        asNumber(args.bl, 24),
      )
      return { summary: `border-radius: ${css};`, structured: { css } }
    }
    case 'bmi-calculator': {
      const value = bmi(asNumber(args.weight, 65), asNumber(args.height, 175))
      const category = bmiCategory(value)
      return {
        summary: `BMI ${value.toFixed(1)} — ${category.en}.`,
        structured: { bmi: Math.round(value * 10) / 10, category: category.key },
      }
    }
    case 'http-status': {
      const query = typeof args.query === 'string' ? args.query : ''
      const results = findStatus(query)
      return {
        summary: results.map((s) => `${s.code} ${s.phrase}`).join('; ') || 'No matching status code.',
        structured: { count: results.length, statuses: results },
      }
    }
    case 'dice-roller': {
      const count = Math.max(1, Math.min(20, Math.round(asNumber(args.count, 2))))
      const sides = Math.max(2, Math.min(100, Math.round(asNumber(args.sides, 6))))
      const values = rollDice(count, sides)
      return {
        summary: `${values.join(', ')} (total ${sum(values)}).`,
        structured: { count, sides, values, total: sum(values) },
      }
    }
    default:
      throw new McpError(ErrorCode.MethodNotFound, `Tool not implemented: ${toolId}`)
  }
}

/**
 * Builds the UI resource for a tool.
 *
 * MCP Apps hosts (and `@mcp-ui/client` v7) render the resource's `text` as HTML,
 * so we serve the pre-built single-file widget HTML (`rawHtml`). When it is not
 * available we fall back to an external-URL resource for classic MCP-UI hosts.
 */
function uiContent(
  tool: ToolMeta,
  args: Record<string, unknown>,
  origin: string,
  appHtml?: string,
) {
  const content = appHtml
    ? { type: 'rawHtml' as const, htmlString: appHtml }
    : { type: 'externalUrl' as const, iframeUrl: embedUrl(origin, tool, args) }
  return createUIResource({ uri: resourceUri(tool.id), content, encoding: 'text' })
}

/** Resolves the pre-built single-file HTML for a tool's widget. */
export type AppHtmlResolver = (toolId: string) => Promise<string | undefined>

/**
 * Builds a fresh MCP server. Instances are cheap and the transport is stateless,
 * so a new server is created per HTTP request on Cloudflare's edge.
 *
 * @param origin Origin used for fallback external-URL resources.
 * @param resolveAppHtml Resolver for the widget HTML served via `resources/read`.
 */
export function createMcpServer(
  origin: string = SITE_ORIGIN,
  resolveAppHtml?: AppHtmlResolver,
): Server {
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
      _meta: RESOURCE_UI_META,
    })),
  }))

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const toolId = toolIdFromUri(request.params.uri)
    const tool = toolId ? getTool(toolId) : undefined
    if (!tool) {
      throw new McpError(ErrorCode.InvalidParams, `Unknown resource: ${request.params.uri}`)
    }
    const html = resolveAppHtml ? await resolveAppHtml(tool.id) : undefined
    const resource = uiContent(tool, {}, origin, html)
    return { contents: [{ ...resource.resource, _meta: RESOURCE_UI_META }] }
  })

  return server
}
