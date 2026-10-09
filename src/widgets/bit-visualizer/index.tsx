import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { allBases, bitArray } from '@shared/calc/numbase.ts'
import type { WidgetProps } from '../registry.ts'
import { Segmented, WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Bit Visualizer', input: 'Integer', bits: 'Width', note: 'See a number as bits, with binary/octal/hex.' },
  zh: { title: '位可视化', input: '整数', bits: '位宽', note: '以位方块查看二进制/八进制/十六进制。' },
}

export default function BitVisualizerWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [value, setValue] = useState(42)
  const [bits, setBits] = useState('16')
  const width = Number(bits)
  const arr = useMemo(() => bitArray(value, width), [value, width])
  const bases = useMemo(() => allBases(String(Math.max(0, Math.floor(value))), 10, [2, 8, 10, 16]), [value])

  return (
    <WidgetShell title={d.title} icon="🔢" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={value}
            min={0}
            onChange={(e) => setValue(Number(e.target.value))}
            aria-label={d.input}
            className="flex-1 rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-lg text-slate-100 outline-none focus:border-brand-400"
          />
          <div className="w-32">
            <Segmented value={bits} onChange={setBits} options={[{ value: '8', label: '8' }, { value: '16', label: '16' }, { value: '32', label: '32' }]} />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/8 bg-ink-950/60 p-3">
          {arr.map((bit, i) => (
            <span
              key={i}
              className={`grid h-8 w-7 place-items-center rounded-md font-mono text-sm font-bold ${
                bit ? 'bg-gradient-to-br from-brand-500 to-accent-500 text-ink-950' : 'bg-white/5 text-slate-600'
              } ${(i + 1) % 8 === 0 && i !== arr.length - 1 ? 'mr-2' : ''}`}
            >
              {bit}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {bases.map((b) => (
            <div key={b.base} className="rounded-lg border border-white/8 bg-ink-900/50 px-2 py-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">{b.base === 16 ? 'HEX' : b.base === 8 ? 'OCT' : b.base === 2 ? 'BIN' : 'DEC'}</div>
              <div className="break-all font-mono text-xs text-slate-200">{b.value}</div>
            </div>
          ))}
        </div>
      </div>
    </WidgetShell>
  )
}
