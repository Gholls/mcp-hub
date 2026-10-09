import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { bmi, bmiCategory } from '@shared/calc/bmi.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Slider, WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'BMI Calculator', weight: 'Weight (kg)', height: 'Height (cm)', result: 'BMI', note: 'Body-mass index with a colored scale.' },
  zh: { title: 'BMI 计算器', weight: '体重 (kg)', height: '身高 (cm)', result: 'BMI', note: '带色带的体质指数。' },
}

const ZONES = [
  { max: 18.5, color: '#38bdf8' },
  { max: 24, color: '#22c55e' },
  { max: 28, color: '#f59e0b' },
  { max: 40, color: '#ef4444' },
]
const LO = 14
const HI = 40

export default function BmiCalculatorWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [weight, setWeight] = useState(65)
  const [height, setHeight] = useState(175)
  const value = bmi(weight, height)
  const category = bmiCategory(value)
  const pos = Math.max(0, Math.min(100, ((value - LO) / (HI - LO)) * 100))

  return (
    <WidgetShell title={d.title} icon="⚖️" footer={d.note}>
      <div className="flex flex-col gap-4">
        <div
          className="flex items-end justify-between rounded-xl border p-4"
          style={{ borderColor: `${category.color}55`, background: `${category.color}14` }}
        >
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{d.result}</div>
            <div className="font-mono text-4xl font-bold" style={{ color: category.color }}>
              {Number.isFinite(value) ? value.toFixed(1) : '—'}
            </div>
          </div>
          <span className="rounded-full px-3 py-1 text-sm font-medium" style={{ background: `${category.color}22`, color: category.color }}>
            {category[locale]}
          </span>
        </div>

        <div className="relative pt-2">
          <div className="flex h-3 overflow-hidden rounded-full">
            {ZONES.map((z, i) => (
              <div key={i} className="h-full" style={{ background: z.color, width: `${((z.max - (i === 0 ? LO : ZONES[i - 1].max)) / (HI - LO)) * 100}%` }} />
            ))}
          </div>
          <div className="absolute -top-0.5 h-4 w-1 -translate-x-1/2 rounded-full bg-white shadow" style={{ left: `${pos}%` }} />
          <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-500">
            <span>{LO}</span>
            <span>18.5</span>
            <span>24</span>
            <span>28</span>
            <span>{HI}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={d.weight} hint={String(weight)}>
            <Slider value={weight} min={30} max={150} onChange={setWeight} />
          </Field>
          <Field label={d.height} hint={String(height)}>
            <Slider value={height} min={120} max={220} onChange={setHeight} />
          </Field>
        </div>
      </div>
    </WidgetShell>
  )
}
