import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { numericColumnIndexes, parseCsv } from '@shared/calc/csv.ts'
import type { EChartsOption } from '@shared/calc/echarts.ts'
import type { WidgetProps } from '../registry.ts'
import { Segmented, WidgetShell } from '../../components/ui.tsx'
import { useECharts } from '../../lib/use-echarts.ts'
import { readString } from '../params.ts'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'CSV to Chart', input: 'CSV (first row = headers)', bar: 'Bar', line: 'Line', value: 'Value column', note: 'Paste CSV and chart it instantly.' },
  zh: { title: 'CSV 出图', input: 'CSV（首行为表头）', bar: '柱状', line: '折线', value: '数值列', note: '粘贴 CSV 立即出图。' },
}

const SAMPLE = 'month,revenue,cost\nJan,120,80\nFeb,180,110\nMar,150,95\nApr,220,140\nMay,260,150'

export default function CsvChartWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [text, setText] = useState(() => readString(initial, 'csv', SAMPLE))
  const [kind, setKind] = useState<'bar' | 'line'>('bar')
  const data = useMemo(() => parseCsv(text), [text])
  const numeric = useMemo(() => numericColumnIndexes(data), [data])
  const [valueCol, setValueCol] = useState<string>('')
  const labelCol = 0
  const activeValue = valueCol !== '' ? Number(valueCol) : (numeric.find((c) => c !== labelCol) ?? numeric[0] ?? 1)
  const activeLabel = numeric.includes(labelCol) ? 0 : 0

  const option = useMemo<EChartsOption>(() => {
    const labels = data.rows.map((r) => r[activeLabel] ?? '')
    const values = data.rows.map((r) => Number(r[activeValue] ?? 0))
    return {
      grid: { left: 12, right: 16, top: 20, bottom: 12, containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: labels },
      yAxis: { type: 'value' },
      series: [{ type: kind, data: values, barMaxWidth: 40, smooth: kind === 'line' }],
    }
  }, [data, kind, activeLabel, activeValue])

  const { ref: chartRef } = useECharts(option)

  return (
    <WidgetShell title={d.title} icon="📉" footer={d.note}>
      <div className="flex flex-col gap-3">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} spellCheck={false} aria-label={d.input} className="w-full resize-y rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-brand-400" />
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-40">
            <Segmented value={kind} onChange={setKind} options={[{ value: 'bar', label: d.bar }, { value: 'line', label: d.line }]} />
          </div>
          {numeric.length > 1 ? (
            <label className="flex items-center gap-2 text-xs text-slate-400">
              {d.value}
              <select value={String(activeValue)} onChange={(e) => setValueCol(e.target.value)} className="rounded-lg border border-white/10 bg-ink-950 px-2 py-1 text-xs text-slate-200 outline-none focus:border-brand-400">
                {numeric.map((c) => (
                  <option key={c} value={c}>
                    {data.headers[c] ?? `#${c + 1}`}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <div className="overflow-hidden rounded-xl border border-white/8 bg-ink-950/50 p-1">
          <div ref={chartRef} className="h-[280px] w-full" />
        </div>
      </div>
    </WidgetShell>
  )
}
