import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { splitTip } from '@shared/calc/tip.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Slider, WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Tip & Split', total: 'Bill', tip: 'Tip %', people: 'People', perPerson: 'Each pays', tipAmount: 'Tip', grand: 'Total', note: 'Add a tip and split the bill, with a visual split.' },
  zh: { title: '小费与分账', total: '金额', tip: '小费 %', people: '人数', perPerson: '每人付', tipAmount: '小费', grand: '总计', note: '加小费并分账，带可视化比例。' },
}

export default function TipSplitWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [total, setTotal] = useState(200)
  const [tipPercent, setTipPercent] = useState(15)
  const [people, setPeople] = useState(4)
  const s = splitTip(total, tipPercent, people)
  const tipShare = s.grandTotal > 0 ? (s.tip / s.grandTotal) * 100 : 0

  return (
    <WidgetShell title={d.title} icon="🧾" footer={d.note}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-36 w-36">
          <svg viewBox="0 0 42 42" className="h-36 w-36 -rotate-90">
            <circle cx="21" cy="21" r="15.9" fill="none" stroke="#22c55e" strokeWidth="6" />
            <circle
              cx="21"
              cy="21"
              r="15.9"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="6"
              strokeDasharray={`${tipShare} ${100 - tipShare}`}
              strokeDashoffset="0"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">{d.perPerson}</div>
              <div className="font-mono text-2xl font-bold text-white">{s.perPerson.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
            {d.total} <span className="font-mono text-slate-200">{total.toFixed(2)}</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
            {d.tipAmount} <span className="font-mono text-slate-200">{s.tip.toFixed(2)}</span>
          </span>
        </div>
        <div className="w-full space-y-3">
          <Field label={d.total} hint={total.toFixed(2)}>
            <Slider value={total} min={0} max={2000} step={10} onChange={setTotal} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={d.tip} hint={`${tipPercent}%`}>
              <Slider value={tipPercent} min={0} max={30} onChange={setTipPercent} />
            </Field>
            <Field label={d.people} hint={String(people)}>
              <Slider value={people} min={1} max={20} onChange={setPeople} />
            </Field>
          </div>
        </div>
        <div className="w-full rounded-lg border border-white/8 bg-ink-900/50 px-3 py-2 text-center text-sm text-slate-300">
          {d.grand}: <span className="font-mono text-lg font-bold text-accent-300">{s.grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </WidgetShell>
  )
}
