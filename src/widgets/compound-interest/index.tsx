import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { compound } from '@shared/calc/finance.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Segmented, Slider, WidgetShell } from '../../components/ui.tsx'
import Sparkline from '../../components/Sparkline.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Compound Interest', principal: 'Principal', rate: 'Annual rate %', years: 'Years', freq: 'Compounding', final: 'Final value', gain: 'Growth', note: 'Compound growth over time.' },
  zh: { title: '复利计算', principal: '本金', rate: '年利率 %', years: '年限', freq: '复利频率', final: '终值', gain: '增长', note: '复利随时间增长。' },
}

export default function CompoundInterestWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [principal, setPrincipal] = useState(10000)
  const [rate, setRate] = useState(7)
  const [years, setYears] = useState(20)
  const [freq, setFreq] = useState('12')
  const series = useMemo(() => compound(principal, rate, years, Number(freq)), [principal, rate, years, freq])
  const final = series[series.length - 1].value

  return (
    <WidgetShell title={d.title} icon="📈" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/8 bg-ink-900/50 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{d.final}</div>
            <div className="font-mono text-lg text-accent-300">{final.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border border-white/8 bg-ink-900/50 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{d.gain}</div>
            <div className="font-mono text-lg text-emerald-300">+{(final - principal).toLocaleString()}</div>
          </div>
        </div>
        <div className="rounded-xl border border-white/8 bg-ink-950/50 p-2">
          <Sparkline values={series.map((s) => s.value)} color="#22c55e" fill="rgba(34,197,94,0.15)" />
        </div>
        <Field label={d.principal} hint={principal.toLocaleString()}>
          <Slider value={principal} min={1000} max={1000000} step={1000} onChange={setPrincipal} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={d.rate} hint={`${rate}%`}>
            <Slider value={rate} min={0} max={20} step={0.5} onChange={setRate} />
          </Field>
          <Field label={d.years} hint={String(years)}>
            <Slider value={years} min={1} max={50} onChange={setYears} />
          </Field>
        </div>
        <Field label={d.freq}>
          <Segmented value={freq} onChange={setFreq} options={[{ value: '1', label: '1/yr' }, { value: '12', label: 'monthly' }, { value: '365', label: 'daily' }]} />
        </Field>
      </div>
    </WidgetShell>
  )
}
