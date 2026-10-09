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
    swap: 'Swap',
    all: 'All units',
    invalid: 'Enter a number',
    note: 'Length, mass, area, volume, temperature, speed, data and time.',
  },
  zh: {
    title: '单位换算',
    value: '数值',
    from: '从',
    to: '到',
    swap: '互换',
    all: '全部单位',
    invalid: '请输入数字',
    note: '长度、质量、面积、体积、温度、速度、数据与时间。',
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
  const result = useMemo(
    () => (valid ? convertUnits(categoryId, num, from, to) : null),
    [valid, categoryId, num, from, to],
  )

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
                categoryId === c.id
                  ? 'border-brand-400/60 bg-brand-500/15 text-brand-200'
                  : 'border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.label[locale]}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div className="flex flex-col gap-2">
            <Field label={d.value}>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-sm text-slate-200 outline-none focus:border-brand-400"
              />
            </Field>
            <Field label={d.from}>
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-400"
              >
                {category.units.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label[locale]} ({x.symbol})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <button
            type="button"
            onClick={() => {
              setFrom(to)
              setTo(from)
            }}
            aria-label={d.swap}
            className="rounded-lg border border-white/10 px-3 py-2 text-slate-300 transition hover:border-brand-400/60 hover:text-white"
          >
            ⇄
          </button>

          <div className="flex flex-col gap-2">
            <div className="rounded-lg border border-white/8 bg-ink-900/50 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">{d.to}</div>
              <div className="mt-0.5 font-mono text-xl font-semibold text-accent-300">
                {valid && result !== null ? fmt(result) : d.invalid}
              </div>
            </div>
            <Field label={d.to}>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-400"
              >
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
            <span className="text-[11px] font-medium text-slate-400">{d.all}</span>
            <CopyButton
              value={category.units
                .map((x) => {
                  const v = valid ? convertUnits(categoryId, num, from, x.id) : null
                  return `${x.label.en}: ${v === null ? '—' : fmt(v)} ${x.symbol}`
                })
                .join('\n')}
            />
          </div>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {category.units.map((x) => {
              const v = valid ? convertUnits(categoryId, num, from, x.id) : null
              return (
                <li key={x.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {x.label[locale]} <span className="text-slate-600">({x.symbol})</span>
                  </span>
                  <span className="font-mono text-slate-200">{v === null ? '—' : fmt(v)}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </WidgetShell>
  )
}
