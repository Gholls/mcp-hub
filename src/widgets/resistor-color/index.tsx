import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { BAND_COLORS, colorById, decodeResistor } from '@shared/calc/resistor.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Resistor Color Code', band1: 'Band 1', band2: 'Band 2', multiplier: 'Multiplier', tolerance: 'Tolerance', value: 'Resistance', note: 'Decode a 4-band resistor.' },
  zh: { title: '电阻色环', band1: '第1环', band2: '第2环', multiplier: '倍率', tolerance: '误差', value: '阻值', note: '解析四色环电阻。' },
}

function BandPicker({ label, value, onChange, only }: { label: string; value: string; onChange: (v: string) => void; only?: 'digit' | 'multiplier' | 'tolerance' }) {
  const options = BAND_COLORS.filter((c) =>
    only === 'digit' ? c.digit !== undefined : only === 'multiplier' ? c.multiplier !== undefined : only === 'tolerance' ? c.tolerance !== undefined : true,
  )
  return (
    <label className="flex flex-col gap-1 text-[11px] text-slate-400">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-white/10 bg-ink-950 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-400">
        {options.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label.en}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function ResistorColorWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [b1, setB1] = useState('brown')
  const [b2, setB2] = useState('black')
  const [b3, setB3] = useState('red')
  const [b4, setB4] = useState('gold')
  const result = useMemo(() => decodeResistor([b1, b2, b3, b4]), [b1, b2, b3, b4])
  const bands = [colorById(b1)?.hex, colorById(b2)?.hex, colorById(b3)?.hex, colorById(b4)?.hex]

  return (
    <WidgetShell title={d.title} icon="🧩" footer={d.note}>
      <div className="flex flex-col items-center gap-4">
        <svg viewBox="0 0 320 90" className="w-full max-w-sm">
          <line x1="0" y1="45" x2="60" y2="45" stroke="#9ca3af" strokeWidth="4" />
          <line x1="260" y1="45" x2="320" y2="45" stroke="#9ca3af" strokeWidth="4" />
          <rect x="60" y="18" width="200" height="54" rx="27" fill="#e5c07b" stroke="#b58b43" />
          {bands.map((hex, i) => (
            <rect key={i} x={82 + i * 40} y="18" width="16" height="54" fill={hex} />
          ))}
        </svg>
        <div className="rounded-xl border border-white/8 bg-ink-900/50 px-4 py-3 text-center">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">{d.value}</div>
          <div className="font-mono text-2xl font-bold text-accent-300">{result ? result.formatted : '—'}</div>
          {result?.tolerance !== undefined ? <div className="text-[11px] text-slate-500">± {result.tolerance}%</div> : null}
        </div>
        <div className="grid w-full grid-cols-4 gap-2">
          <BandPicker label={d.band1} value={b1} onChange={setB1} only="digit" />
          <BandPicker label={d.band2} value={b2} onChange={setB2} only="digit" />
          <BandPicker label={d.multiplier} value={b3} onChange={setB3} only="multiplier" />
          <BandPicker label={d.tolerance} value={b4} onChange={setB4} only="tolerance" />
        </div>
      </div>
    </WidgetShell>
  )
}
