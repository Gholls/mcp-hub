import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { coinFlip } from '@shared/calc/random.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Coin Flip', flip: 'Flip', heads: 'Heads', tails: 'Tails', note: 'Fair flip using the Web Crypto API.' },
  zh: { title: '抛硬币', flip: '抛一次', heads: '正面', tails: '反面', note: '使用 Web Crypto 的公平抛掷。' },
}

export default function CoinFlipWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [result, setResult] = useState<'heads' | 'tails' | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [counts, setCounts] = useState({ heads: 0, tails: 0 })

  function flip() {
    setSpinning(true)
    const value = coinFlip()
    window.setTimeout(() => {
      setResult(value)
      setCounts((c) => ({ ...c, [value]: c[value] + 1 }))
      setSpinning(false)
    }, 550)
  }

  return (
    <WidgetShell title={d.title} icon="🪙" footer={d.note}>
      <div className="flex flex-col items-center gap-5">
        <div
          className={`grid h-32 w-32 place-items-center rounded-full border-4 border-amber-300/40 bg-gradient-to-br from-amber-200 to-amber-400 text-4xl font-bold text-amber-900 shadow-xl transition-transform duration-500 [transform-style:preserve-3d] ${
            spinning ? 'animate-spin' : ''
          }`}
        >
          {result === 'tails' ? '尾' : result === 'heads' ? '正' : '?'}
        </div>
        <div className="h-6 text-sm font-medium text-slate-200">
          {result ? (result === 'heads' ? d.heads : d.tails) : ''}
        </div>
        <button
          type="button"
          onClick={flip}
          disabled={spinning}
          className="rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-6 py-2.5 font-medium text-ink-950 transition hover:opacity-90 disabled:opacity-50"
        >
          {d.flip}
        </button>
        <div className="flex gap-6 text-xs text-slate-400">
          <span>
            {d.heads}: <span className="font-mono text-slate-200">{counts.heads}</span>
          </span>
          <span>
            {d.tails}: <span className="font-mono text-slate-200">{counts.tails}</span>
          </span>
        </div>
      </div>
    </WidgetShell>
  )
}
