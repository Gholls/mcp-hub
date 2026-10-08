import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts'
import type { Locale } from '@shared/types.ts'
import { parseOption, withDarkTheme, type EChartsOption } from '@shared/calc/echarts.ts'
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
    sent: 'Sent to AI',
    click: 'Selected',
    note: 'Rendered with Apache ECharts. Click a data point to send it back to your AI.',
  },
  zh: {
    title: 'ECharts 数据可视化',
    noOption: '未提供 ECharts `option`。',
    invalid: 'option 无效',
    empty: 'option 中没有可渲染的 `series`。',
    copy: '复制 option',
    sent: '已发送给 AI',
    click: '已选中',
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
  const option = parsed.option as EChartsOption | undefined
  const hasSeries = Boolean(option && ((option.series as unknown[] | undefined)?.length ?? 0) > 0)

  const handleClick = useCallback(
    (params: ClickParams) => {
      const value = typeof params.value === 'object' ? JSON.stringify(params.value) : String(params.value ?? '')
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

  // Create / dispose the chart instance and keep it sized to the container.
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

  // Smooth, not-merged updates whenever the option changes.
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !option) return
    chart.setOption(withDarkTheme(option), { notMerge: true, lazyUpdate: true })
    chart.resize()
  }, [option])

  const optionJson = useMemo(() => (option ? JSON.stringify(option, null, 2) : ''), [option])

  const footer = (
    <span className="flex items-center gap-2">
      {d.note}
      {sent ? <span className="text-emerald-400">✓ {d.sent}</span> : null}
    </span>
  )

  return (
    <WidgetShell title={title || d.title} icon="📊" footer={footer}>
      <div className="flex flex-col gap-3">
        {subtitle ? <p className="-mt-1 text-xs text-slate-400">{subtitle}</p> : null}

        {parsed.error ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {d.invalid}: {parsed.error}
          </div>
        ) : !hasSeries ? (
          <p className="text-sm text-slate-500">{d.empty}</p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-white/8 bg-ink-950/50 p-1">
          <div ref={containerRef} className="h-[320px] w-full" />
        </div>

        {insights ? (
          <div className="flex items-start gap-2 rounded-xl border border-brand-500/25 bg-brand-500/5 px-3 py-2 text-xs leading-relaxed text-brand-100">
            <span className="flex-shrink-0 font-semibold text-brand-300">💡 AI</span>
            <span>{insights}</span>
          </div>
        ) : null}

        {option ? (
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-mono">
              {Array.isArray(option.series) ? `${option.series.length} series` : ''}
            </span>
            <CopyButton value={optionJson} label={d.copy} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">{d.noOption}</p>
        )}
      </div>
    </WidgetShell>
  )
}
