/** Helpers for the config-driven ECharts card (pure, shared by UI and server). */

export type EChartsOption = Record<string, unknown>

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
