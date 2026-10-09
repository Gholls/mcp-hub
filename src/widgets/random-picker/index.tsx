import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { randomInt } from '@shared/calc/random.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Random Picker', items: 'Items (one per line)', spin: 'Spin', result: 'Winner', note: 'Spin a wheel to pick fairly.' },
  zh: { title: '随机抽取', items: '候选项（每行一个）', spin: '开始', result: '中奖', note: '转盘公平抽取。' },
}

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#ef4444', '#22c55e', '#a855f7', '#ec4899', '#14b8a6']

export default function RandomPickerWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [text, setText] = useState('Alice\nBob\nCarol\nDave\nErin\nFrank')
  const [rotation, setRotation] = useState(0)
  const [winner, setWinner] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)

  const items = useMemo(() => text.split('\n').map((s) => s.trim()).filter(Boolean), [text])
  const seg = items.length ? 360 / items.length : 360
  const size = 220
  const cx = size / 2
  const r = size / 2 - 6

  function polar(angle: number, radius: number) {
    const rad = ((angle - 90) * Math.PI) / 180
    return [cx + radius * Math.cos(rad), cx + radius * Math.sin(rad)]
  }

  function spin() {
    if (!items.length || spinning) return
    const index = randomInt(items.length)
    const turns = 4 + randomInt(3)
    const target = turns * 360 - (index * seg + seg / 2)
    setSpinning(true)
    setWinner(null)
    setRotation((prev) => prev + ((target - (prev % 360)) % 360) + turns * 360)
    window.setTimeout(() => {
      setWinner(items[index])
      setSpinning(false)
    }, 2200)
  }

  return (
    <WidgetShell title={d.title} icon="🎡" footer={d.note}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative mx-auto" style={{ width: size, height: size }}>
          <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full transition-transform duration-[2000ms] ease-out" style={{ transform: `rotate(${rotation}deg)` }}>
            {items.map((item, i) => {
              const a0 = i * seg
              const a1 = (i + 1) * seg
              const [x0, y0] = polar(a0, r)
              const [x1, y1] = polar(a1, r)
              const mid = a0 + seg / 2
              const [lx, ly] = polar(mid, r * 0.62)
              return (
                <g key={item + i}>
                  <path d={`M ${cx} ${cx} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`} fill={COLORS[i % COLORS.length]} opacity="0.85" />
                  <text x={lx} y={ly} fill="#0b0f19" fontSize="11" fontWeight="600" textAnchor="middle" dominantBaseline="middle">
                    {item.slice(0, 8)}
                  </text>
                </g>
              )
            })}
          </svg>
          <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow" />
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} aria-label={d.items} className="w-full flex-1 resize-y rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-400" />
          <button type="button" onClick={spin} disabled={spinning || !items.length} className="rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 font-medium text-ink-950 transition hover:opacity-90 disabled:opacity-50">
            {d.spin}
          </button>
          <div className="rounded-lg border border-white/8 bg-ink-900/50 px-3 py-2 text-center text-sm text-slate-300">
            {winner ? (
              <span>
                {d.result}: <span className="text-lg font-bold text-accent-300">{winner}</span>
              </span>
            ) : (
              '—'
            )}
          </div>
        </div>
      </div>
    </WidgetShell>
  )
}
