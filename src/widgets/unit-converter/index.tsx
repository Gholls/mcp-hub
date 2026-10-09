import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { UNIT_CATEGORIES, convertUnits, getCategory } from '@shared/calc/units.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, WidgetShell } from '../../components/ui.tsx'
import CopyButton from '../../components/CopyButton.tsx'

type Dict = Record<string, string>

const T: Record<Locale, Dict> = {
  en: {
    title: 'Unit Converter',
    value: 'Value',
    from: 'From',
    to: 'To',
    bar: 'Magnitude',
    note: 'Visual comparison across units: length, mass, area, volume, temperature, speed, data, time.',
  },
  zh: {
    title: '单位换算',
    value: '数值',
    from: '从',
    to: '到',
    bar: '量级对比',
    note: '跨单位可视化对比：长度/质量/面积/体积/温度/速度/数据/时间。',
  },
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (abs !== 0 && (abs < 0.001 || abs >= 1e9)) return n.toExponential(4)
  return String(Math.round(n * 1e6) / 1e6)
}

export default function UnitConverterWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [categoryId, setCategoryId] = useState('length')
  const [value, setValue] = useState('1')
  const category = getCategory(categoryId) ?? UNIT_CATEGORIES[0]
  const [from, setFrom] = useState(category.units[0].id)
  const [to, setTo] = useState(category.units[2]?.id ?? category.units[1].id)

  function pickCategory(id: string) {
    const next = getCategory(id) ?? UNIT_CATEGORIES[0]
    setCategoryId(id)
    setFrom(next.units[0].id)
    setTo(next.units[2]?.id ?? next.units[1].id)
  }

  const num = Number(value)
  const valid = value.trim() !== '' && Number.isFinite(num)
  const result = valid ? convertUnits(categoryId, num, from, to) : null

  const converted = useMemo(
    () =>
      category.units.map((u) => ({
        unit: u,
        value: valid ? convertUnits(categoryId, num, from, u.id) : null,
      })),
    [category, categoryId, num, from, valid],
  )

  const logs = converted
    .map((c) => c.value)
    .filter((v): v is number => v !== null && Number.isFinite(v) && v > 0)
    .map((v) => Math.log10(v))
  const logMin = logs.length ? Math.min(...logs) : 0
  const logMax = logs.length ? Math.max(...logs) : 1
  const logSpan = logMax - logMin || 1
  const barWidth = (value: number | null): number => {
    if (value === null || !Number.isFinite(value) || value <= 0) return 4
    return Math.max(6, ((Math.log10(value) - logMin) / logSpan) * 100)
  }

  return (
    <WidgetShell title={d.title} icon="📏" footer={d.note}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {UNIT_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => pickCategory(c.id)}
              aria-pressed={categoryId === c.id}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                categoryId === c.id ? 'border-brand-400/60 bg-brand-500/15 text-brand-200' : 'border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.label[locale]}
            </button>
          ))}
        </div>

        <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-col gap-2 rounded-xl border border-white/8 bg-ink-900/50 p-3">
            <Field label={d.value}>
              <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-sm text-slate-200 outline-none focus:border-brand-400" />
            </Field>
            <Field label={d.from}>
              <select value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-400">
                {category.units.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label[locale]} ({x.symbol})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                setFrom(to)
                setTo(from)
              }}
              aria-label="swap"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-slate-300 transition hover:border-brand-400/60 hover:text-white"
            >
              ⇄
            </button>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-brand-500/30 bg-brand-500/5 p-3">
            <div className="text-[11px] uppercase tracking-wide text-brand-300/80">{d.to}</div>
            <div className="font-mono text-2xl font-semibold text-accent-300">
              {valid && result !== null ? `${fmt(result)} ${converted.find((c) => c.unit.id === to)?.unit.symbol ?? ''}` : d.value}
            </div>
            <Field label={d.to}>
              <select value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-400">
                {category.units.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label[locale]} ({x.symbol})
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="rounded-xl border border-white/8 bg-ink-900/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">{d.bar}</span>
            <CopyButton
              value={converted.map((c) => `${c.unit.label.en}: ${c.value === null ? '—' : fmt(c.value)} ${c.unit.symbol}`).join('\n')}
            />
          </div>
          <ul className="flex flex-col gap-2">
            {converted.map((c) => {
              const width = barWidth(c.value)
              const active = c.unit.id === from || c.unit.id === to
              return (
                <li key={c.unit.id} className="flex items-center gap-3 text-xs">
                  <span className={`w-28 flex-shrink-0 truncate ${active ? 'text-slate-200' : 'text-slate-500'}`}>
                    {c.unit.label[locale]} <span className="text-slate-600">({c.unit.symbol})</span>
                  </span>
                  <span className="relative h-4 flex-1 overflow-hidden rounded-full bg-ink-950">
                    <span
                      className={`absolute inset-y-0 left-0 rounded-full ${active ? 'bg-gradient-to-r from-brand-500 to-accent-400' : 'bg-white/15'}`}
                      style={{ width: `${width}%` }}
                    />
                  </span>
                  <span className="w-24 flex-shrink-0 text-right font-mono text-slate-200">{c.value === null ? '—' : fmt(c.value)}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </WidgetShell>
  )
}
