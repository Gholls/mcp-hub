import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { describe, histogram, parseNumbers } from '@shared/calc/stats.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import { readString } from '../params.ts'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Statistics', input: 'Numbers (space/comma separated)', mean: 'Mean', median: 'Median', std: 'Std dev', range: 'Range', dist: 'Distribution', note: 'Describe a data set with a histogram.' },
  zh: { title: '统计', input: '数据（空格/逗号分隔）', mean: '均值', median: '中位数', std: '标准差', range: '范围', dist: '分布', note: '统计一组数据并绘制直方图。' },
}

export default function StatisticsWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [text, setText] = useState(() => readString(initial, 'data', '12 15 9 22 18 30 25 11 14 19 27 21 16 13 24'))
  const nums = useMemo(() => parseNumbers(text), [text])
  const stats = useMemo(() => describe(nums), [nums])
  const bins = useMemo(() => histogram(nums, 8), [nums])
  const maxCount = Math.max(1, ...bins.map((b) => b.count))

  return (
    <WidgetShell title={d.title} icon="📊" footer={d.note}>
      <div className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          aria-label={d.input}
          className="w-full resize-y rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-brand-400"
        />
        {stats ? (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([[d.mean, stats.mean], [d.median, stats.median], [d.std, stats.std], [d.range, `${stats.min}–${stats.max}`]] as const).map(([label, v]) => (
                <div key={label} className="rounded-lg border border-white/8 bg-ink-900/50 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
                  <div className="font-mono text-sm text-slate-200">{typeof v === 'number' ? v.toFixed(2) : v}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="mb-1 text-[11px] font-medium text-slate-400">{d.dist}</div>
              <div className="flex h-28 items-end gap-1 rounded-lg border border-white/8 bg-ink-950/50 p-2">
                {bins.map((b, i) => (
                  <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-brand-600 to-accent-400" style={{ height: `${(b.count / maxCount) * 100}%` }} title={`${b.from.toFixed(1)}–${b.to.toFixed(1)}: ${b.count}`} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">—</p>
        )}
      </div>
    </WidgetShell>
  )
}
