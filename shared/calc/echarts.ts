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

export interface EChartsTemplate {
  id: string
  label: { en: string; zh: string }
  option: EChartsOption
}

export const ECHARTS_TEMPLATES: EChartsTemplate[] = [
  {
    id: 'line',
    label: { en: 'Line', zh: '折线图' },
    option: {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Revenue', 'Cost'] },
      grid: { left: 8, right: 12, top: 36, bottom: 4, containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
      yAxis: { type: 'value' },
      series: [
        { name: 'Revenue', type: 'line', smooth: true, areaStyle: { opacity: 0.18 }, data: [120, 180, 150, 220, 260, 300] },
        { name: 'Cost', type: 'line', smooth: true, data: [80, 110, 95, 140, 150, 170] },
      ],
    },
  },
  {
    id: 'bar',
    label: { en: 'Bar', zh: '柱状图' },
    option: {
      tooltip: { trigger: 'axis' },
      grid: { left: 8, right: 12, top: 24, bottom: 4, containLabel: true },
      xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'] },
      yAxis: { type: 'value' },
      series: [{ name: 'Sales', type: 'bar', barWidth: '52%', itemStyle: { borderRadius: [6, 6, 0, 0] }, data: [320, 480, 410, 560] }],
    },
  },
  {
    id: 'stacked',
    label: { en: 'Stacked bar', zh: '堆叠柱状' },
    option: {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Web', 'App', 'API'] },
      grid: { left: 8, right: 12, top: 36, bottom: 4, containLabel: true },
      xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'] },
      yAxis: { type: 'value' },
      series: [
        { name: 'Web', type: 'bar', stack: 'total', data: [120, 160, 140, 180] },
        { name: 'App', type: 'bar', stack: 'total', data: [90, 130, 110, 160] },
        { name: 'API', type: 'bar', stack: 'total', data: [60, 80, 100, 120] },
      ],
    },
  },
  {
    id: 'mixed',
    label: { en: 'Bar + line', zh: '柱线双轴' },
    option: {
      tooltip: { trigger: 'axis' },
      legend: { data: ['QPS', 'p99 (ms)'] },
      grid: { left: 8, right: 12, top: 36, bottom: 4, containLabel: true },
      xAxis: { type: 'category', data: ['00', '04', '08', '12', '16', '20'] },
      yAxis: [
        { type: 'value', name: 'QPS' },
        { type: 'value', name: 'ms' },
      ],
      series: [
        { name: 'QPS', type: 'bar', barWidth: '46%', itemStyle: { borderRadius: [4, 4, 0, 0] }, data: [820, 640, 1200, 1500, 1380, 900] },
        { name: 'p99 (ms)', type: 'line', yAxisIndex: 1, smooth: true, data: [45, 38, 70, 120, 95, 60] },
      ],
    },
  },
  {
    id: 'pie',
    label: { en: 'Donut', zh: '环形图' },
    option: {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '46%'],
          itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
          label: { formatter: '{b} {d}%' },
          data: [
            { name: 'Chat', value: 38 },
            { name: 'Code', value: 27 },
            { name: 'Search', value: 18 },
            { name: 'Image', value: 11 },
            { name: 'Other', value: 6 },
          ],
        },
      ],
    },
  },
  {
    id: 'radar',
    label: { en: 'Radar', zh: '雷达图' },
    option: {
      tooltip: {},
      legend: { data: ['Model A', 'Model B'] },
      radar: {
        indicator: [
          { name: 'Speed', max: 100 },
          { name: 'Quality', max: 100 },
          { name: 'Cost', max: 100 },
          { name: 'Context', max: 100 },
          { name: 'Safety', max: 100 },
        ],
      },
      series: [
        {
          type: 'radar',
          areaStyle: { opacity: 0.15 },
          data: [
            { name: 'Model A', value: [85, 78, 60, 70, 88] },
            { name: 'Model B', value: [65, 90, 82, 92, 74] },
          ],
        },
      ],
    },
  },
  {
    id: 'scatter',
    label: { en: 'Scatter', zh: '散点图' },
    option: {
      tooltip: { trigger: 'item' },
      grid: { left: 8, right: 12, top: 24, bottom: 4, containLabel: true },
      xAxis: { type: 'value', name: 'Price' },
      yAxis: { type: 'value', name: 'Rating' },
      series: [
        {
          type: 'scatter',
          symbolSize: 12,
          itemStyle: { opacity: 0.75 },
          data: [[12, 4.2], [18, 3.6], [25, 4.6], [30, 3.1], [42, 4.8], [55, 2.9], [68, 4.4], [80, 3.8]],
        },
      ],
    },
  },
  {
    id: 'sankey',
    label: { en: 'Sankey', zh: '桑基图' },
    option: {
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'sankey',
          nodeGap: 12,
          labels: { color: '#cbd5e1' },
          data: [
            { name: 'Input' }, { name: 'Context' }, { name: 'Output' }, { name: 'Chat' }, { name: 'Tools' }, { name: 'Reasoning' },
          ],
          links: [
            { source: 'Input', target: 'Context', value: 40 },
            { source: 'Input', target: 'Reasoning', value: 25 },
            { source: 'Context', target: 'Output', value: 22 },
            { source: 'Context', target: 'Chat', value: 18 },
            { source: 'Reasoning', target: 'Tools', value: 15 },
            { source: 'Reasoning', target: 'Output', value: 10 },
          ],
        },
      ],
    },
  },
  {
    id: 'funnel',
    label: { en: 'Funnel', zh: '漏斗图' },
    option: {
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'funnel',
          left: '12%',
          width: '76%',
          gap: 2,
          label: { formatter: '{b}: {c}' },
          data: [
            { name: 'Visit', value: 1000 },
            { name: 'Signup', value: 460 },
            { name: 'Activate', value: 250 },
            { name: 'Paid', value: 92 },
          ],
        },
      ],
    },
  },
  {
    id: 'gauge',
    label: { en: 'Gauge', zh: '仪表盘' },
    option: {
      series: [
        {
          type: 'gauge',
          min: 0,
          max: 100,
          radius: '86%',
          progress: { show: true, width: 14 },
          axisLine: { lineStyle: { width: 14 } },
          axisLabel: { color: '#94a3b8', distance: 18 },
          pointer: { width: 4 },
          detail: { valueAnimation: true, formatter: '{value}', color: '#e5e7eb', fontSize: 28, offsetCenter: [0, '62%'] },
          data: [{ value: 72, name: 'Score' }],
        },
      ],
    },
  },
]

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
