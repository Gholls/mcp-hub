import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts'
import type { Locale } from '@shared/types.ts'
import {
  ECHARTS_TEMPLATES,
  parseOption,
  withDarkTheme,
  type EChartsOption,
} from '@shared/calc/echarts.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import CopyButton from '../../components/CopyButton.tsx'
import { useMcp } from '../../lib/mcp-app.ts'
import { readBoolean, readString } from '../params.ts'

type Dict = Record<string, string>

const T: Record<Locale, Dict> = {
  en: {
    title: 'ECharts Visualization',
    noOption: 'No ECharts `option` was provided.',
    invalid: 'Invalid option',
    empty: 'The option has no `series` to render.',
    copy: 'Copy option',
    export: 'Export image',
    sent: 'Sent to AI',
    aiChart: 'AI chart',
    exampleHint: 'No chart from the AI yet — browse an example:',
    note: 'Rendered with Apache ECharts. Click a data point to send it back to your AI.',
  },
  zh: {
    title: 'ECharts 数据可视化',
    noOption: '未提供 ECharts `option`。',
    invalid: 'option 无效',
    empty: 'option 中没有可渲染的 `series`。',
    copy: '复制 option',
    export: '导出图片',
    sent: '已发送给 AI',
    aiChart: 'AI 图表',
    exampleHint: 'AI 暂未给出图表 — 可先浏览示例：',
    note: '由 Apache ECharts 渲染。点击数据点可回传给 AI。',
  },
}

interface ClickParams {
  componentType?: string
  seriesName?: string
  name?: string
  value?: unknown
  dataIndex?: number
}

export default function EChartsWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const mcp = useMcp()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const [sent, setSent] = useState(false)

  const title = readString(initial, 'title', '')
  const subtitle = readString(initial, 'subtitle', '')
  const insights = readString(initial, 'insights', '')
  const enableInteractivity = readBoolean(initial, 'enableInteractivity', true)

  const parsed = useMemo(() => parseOption(initial.option), [initial.option])
  const provided = parsed.option as EChartsOption | undefined

  const [mode, setMode] = useState<string>(() => (provided ? 'ai' : ECHARTS_TEMPLATES[0].id))

  useEffect(() => {
    if (provided) setMode('ai')
  }, [provided])

  const activeTemplate = ECHARTS_TEMPLATES.find((t) => t.id === mode)
  const activeOption = mode === 'ai' ? provided : activeTemplate?.option
  const hasSeries = Boolean(
    activeOption && ((activeOption.series as unknown[] | undefined)?.length ?? 0) > 0,
  )
  const activeTitle = mode === 'ai' ? title || d.title : (activeTemplate?.label[locale] ?? d.title)

  const handleClick = useCallback(
    (params: ClickParams) => {
      const value =
        typeof params.value === 'object' ? JSON.stringify(params.value) : String(params.value ?? '')
      const label = params.name ?? params.seriesName ?? ''
      const text =
        locale === 'zh'
          ? `【图表点击】我选中了「${label}」${params.seriesName ? `（系列「${params.seriesName}」）` : ''}，值：${value}。请针对它做深入分析。`
          : `[chart click] I selected "${label}"${params.seriesName ? ` in series "${params.seriesName}"` : ''}, value: ${value}. Please analyze this in detail.`
      setSent(true)
      window.setTimeout(() => setSent(false), 1800)
      void mcp.sendMessage(text).catch(() => undefined)
    },
    [locale, mcp],
  )

  const handlersRef = useRef({ enable: enableInteractivity, onClick: handleClick })
  useEffect(() => {
    handlersRef.current = { enable: enableInteractivity, onClick: handleClick }
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const chart = echarts.init(el, undefined, { renderer: 'canvas' })
    chartRef.current = chart
    chart.on('click', (params: unknown) => {
      const handler = handlersRef.current
      if (handler.enable) handler.onClick(params as ClickParams)
    })
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(el)
    return () => {
      observer.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !activeOption) return
    chart.setOption(withDarkTheme(activeOption), { notMerge: true, lazyUpdate: true })
    chart.resize()
  }, [activeOption])

  function exportPng() {
    const chart = chartRef.current
    if (!chart) return
    const url = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#0b0d17' })
    const link = document.createElement('a')
    link.href = url
    link.download = 'echarts.png'
    link.click()
  }

  const chips = [
    ...(provided ? [{ id: 'ai', label: d.aiChart }] : []),
    ...ECHARTS_TEMPLATES.map((t) => ({ id: t.id, label: t.label[locale] })),
  ]

  const footer = (
    <span className="flex items-center gap-2">
      {d.note}
      {sent ? <span className="text-emerald-400">✓ {d.sent}</span> : null}
    </span>
  )

  return (
    <WidgetShell title={activeTitle} icon="📊" footer={footer}>
      <div className="flex flex-col gap-3">
        {subtitle && mode === 'ai' ? (
          <p className="-mt-1 text-xs text-slate-400">{subtitle}</p>
        ) : null}

        {parsed.error ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {d.invalid}: {parsed.error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5">
          {!provided ? (
            <span className="mr-1 text-[11px] text-slate-500">{d.exampleHint}</span>
          ) : null}
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setMode(chip.id)}
              aria-pressed={mode === chip.id}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                mode === chip.id
                  ? 'border-brand-400/60 bg-brand-500/15 text-brand-200'
                  : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-white/8 bg-ink-950/50 p-1">
          <div ref={containerRef} className="h-[320px] w-full" />
        </div>

        {!hasSeries && !parsed.error ? (
          <p className="text-sm text-slate-500">{d.empty}</p>
        ) : null}

        {insights && mode === 'ai' ? (
          <div className="flex items-start gap-2 rounded-xl border border-brand-500/25 bg-brand-500/5 px-3 py-2 text-xs leading-relaxed text-brand-100">
            <span className="flex-shrink-0 font-semibold text-brand-300">💡 AI</span>
            <span>{insights}</span>
          </div>
        ) : null}

        {activeOption ? (
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="font-mono">
              {Array.isArray(activeOption.series) ? `${activeOption.series.length} series` : ''}
            </span>
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportPng}
                className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-brand-400/60 hover:text-white"
              >
                {d.export}
              </button>
              <CopyButton value={JSON.stringify(activeOption, null, 2)} label={d.copy} />
            </span>
          </div>
        ) : (
          <p className="text-sm text-slate-500">{d.noOption}</p>
        )}
      </div>
    </WidgetShell>
  )
}
