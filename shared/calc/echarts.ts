/** Helpers for the config-driven ECharts card (pure, shared by UI and server). */

export type EChartsOption = Record<string, unknown>

/**
 * Cheat-sheet injected into the tool schema so an LLM can produce a valid
 * ECharts `option` in one shot. Keep it compact but concrete.
 */
export const ECHARTS_OPTION_GUIDE = [
  'Valid JSON only: no comments, no trailing commas, no functions.',
  'Always include "series": [{ "type": ..., "data": [...] }].',
  '',
  'line:   {"tooltip":{"trigger":"axis"},"xAxis":{"type":"category","data":["Mon","Tue","Wed"]},"yAxis":{"type":"value"},"series":[{"type":"line","smooth":true,"data":[120,200,150]}]}',
  'bar:    same axis shape as line, then {"series":[{"type":"bar","data":[5,9,7]}]}',
  'stacked bar: series:[{type:"bar",stack:"t",data:[..]},{type:"bar",stack:"t",data:[..]}]',
  'mixed (bar+line, dual axis): {"xAxis":{"type":"category","data":[..]},"yAxis":[{"type":"value"},{"type":"value"}],"series":[{"type":"bar","yAxisIndex":0,"data":[..]},{"type":"line","yAxisIndex":1,"data":[..]}]}',
  'pie:    {"tooltip":{"trigger":"item"},"series":[{"type":"pie","radius":["40%","70%"],"data":[{"name":"A","value":10},{"name":"B","value":20}]}]}',
  'radar:  {"tooltip":{},"radar":{"indicator":[{"name":"Speed","max":100},{"name":"Cost","max":100},{"name":"Quality","max":100}]},"series":[{"type":"radar","data":[{"name":"Model A","value":[80,40,70]},{"name":"Model B","value":[60,70,85]}]}]}',
  'scatter:{"xAxis":{"type":"value"},"yAxis":{"type":"value"},"series":[{"type":"scatter","symbolSize":8,"data":[[10,20],[15,25],[30,12]]}]}',
  'sankey: {"tooltip":{"trigger":"item"},"series":[{"type":"sankey","data":[{"name":"A"},{"name":"B"},{"name":"C"}],"links":[{"source":"A","target":"B","value":5},{"source":"B","target":"C","value":3}]}]}',
  'funnel: {"tooltip":{"trigger":"item"},"series":[{"type":"funnel","data":[{"name":"Visit","value":100},{"name":"Signup","value":45},{"name":"Buy","value":12}]}]}',
  'gauge:  {"series":[{"type":"gauge","min":0,"max":100,"data":[{"value":72,"name":"Score"}]}]}',
  '',
  'Notes: category x-axis needs "data": [...]; pie/radar/sankey/funnel/gauge need no xAxis/yAxis.',
  'Keep series[].data as a plain array; use objects only for pie/funnel/radar named items.',
  'Dark theme, axis colors, legend and tooltip styling are auto-applied — omit styling unless needed.',
].join('\n')

/** A minimal, valid example option (used as the schema default). */
export const ECHARTS_DEFAULT_OPTION = {
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  yAxis: { type: 'value' },
  series: [{ type: 'line', smooth: true, data: [120, 200, 150, 80, 170] }],
}

export interface ParsedOption {
  option?: EChartsOption
  error?: string
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Accepts an ECharts option as an object, or as a JSON string (e.g. from a URL). */
export function parseOption(raw: unknown): ParsedOption {
  if (raw === undefined || raw === null || raw === '') {
    return { error: 'No option provided' }
  }
  if (isPlainObject(raw)) return { option: raw }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (!isPlainObject(parsed)) return { error: 'Option must be a JSON object' }
      return { option: parsed }
    } catch (err) {
      return { error: `Invalid option JSON: ${err instanceof Error ? err.message : String(err)}` }
    }
  }
  return { error: 'Option must be an object or JSON string' }
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

export interface OptionSummary {
  chartTypes: string[]
  seriesCount: number
  /** Number of categories / x-axis points / sankey nodes. */
  points: number
  title?: string
}

/** A short description of an option, for text-only clients and summaries. */
export function summarizeOption(option: EChartsOption): OptionSummary {
  const series = asArray(option.series as Record<string, unknown> | Record<string, unknown>[])
  const chartTypes = [
    ...new Set(series.map((s) => (typeof s.type === 'string' ? s.type : 'unknown'))),
  ]

  let points = 0
  for (const s of series) {
    if (Array.isArray(s.data)) points += s.data.length
    if (Array.isArray(s.nodes)) points += s.nodes.length
  }
  if (points === 0) {
    const axis = asArray(option.xAxis as Record<string, unknown> | Record<string, unknown>[])[0]
    if (axis && Array.isArray(axis.data)) points = axis.data.length
  }

  const title = option.title as Record<string, unknown> | undefined
  return {
    chartTypes,
    seriesCount: series.length,
    points,
    title: typeof title?.text === 'string' ? title.text : undefined,
  }
}

/**
 * Merges dark-theme defaults into an option so charts are readable on the card.
 * User-provided values always win; only missing keys are filled.
 */
export function withDarkTheme(option: EChartsOption): EChartsOption {
  const merged = structuredClone(option) as EChartsOption

  merged.backgroundColor ??= 'transparent'
  merged.textStyle = {
    color: '#cbd5e1',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    ...(isPlainObject(merged.textStyle) ? merged.textStyle : {}),
  }

  const tooltip = isPlainObject(merged.tooltip) ? merged.tooltip : {}
  merged.tooltip = {
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderColor: 'rgba(255,255,255,0.12)',
    textStyle: { color: '#e5e7eb' },
    ...tooltip,
  }

  for (const key of ['legend', 'radar'] as const) {
    if (merged[key] === undefined) continue
    const wrap = (obj: Record<string, unknown>) => ({
      ...obj,
      textStyle: { color: '#94a3b8', ...(isPlainObject(obj.textStyle) ? obj.textStyle : {}) },
    })
    merged[key] = Array.isArray(merged[key])
      ? (merged[key] as Record<string, unknown>[]).map(wrap)
      : wrap(merged[key] as Record<string, unknown>)
  }

  const axisDefaults = (axis: Record<string, unknown>) => ({
    ...axis,
    axisLabel: {
      color: '#94a3b8',
      ...(isPlainObject(axis.axisLabel) ? axis.axisLabel : {}),
    },
    axisLine: {
      lineStyle: { color: 'rgba(255,255,255,0.18)' },
      ...(isPlainObject(axis.axisLine) ? axis.axisLine : {}),
    },
    splitLine: {
      lineStyle: { color: 'rgba(255,255,255,0.08)' },
      ...(isPlainObject(axis.splitLine) ? axis.splitLine : {}),
    },
  })

  for (const key of ['xAxis', 'yAxis'] as const) {
    if (merged[key] === undefined) continue
    merged[key] = Array.isArray(merged[key])
      ? (merged[key] as Record<string, unknown>[]).map(axisDefaults)
      : axisDefaults(merged[key] as Record<string, unknown>)
  }

  if (isPlainObject(merged.title)) {
    merged.title = {
      ...merged.title,
      textStyle: {
        color: '#e5e7eb',
        ...(isPlainObject(merged.title.textStyle) ? merged.title.textStyle : {}),
      },
    }
  }

  return merged
}
