import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { divisors, factorize, isPrime } from '@shared/calc/primes.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Prime Factorization', input: 'Integer', prime: 'Prime', composite: 'Composite', factorization: 'Factorization', divisors: 'Divisors', note: 'Prime factorization and divisors.' },
  zh: { title: '质因数分解', input: '整数', prime: '质数', composite: '合数', factorization: '分解', divisors: '因数', note: '质因数分解与因数列表。' },
}

export default function PrimeFactorWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [value, setValue] = useState(360)
  const n = Math.max(2, Math.min(1e9, Math.floor(value) || 2))
  const factors = useMemo(() => factorize(n), [n])
  const divs = useMemo(() => divisors(n), [n])
  const prime = isPrime(n)

  return (
    <WidgetShell title={d.title} icon="🧮" footer={d.note}>
      <div className="flex flex-col gap-3">
        <input
          type="number"
          value={value}
          min={2}
          onChange={(e) => setValue(Number(e.target.value))}
          aria-label={d.input}
          className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-lg text-slate-100 outline-none focus:border-brand-400"
        />
        <div className="flex items-center gap-2 text-xs">
          <span className={`rounded-md px-2 py-1 font-medium ${prime ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-400'}`}>
            {prime ? d.prime : d.composite}
          </span>
          <span className="text-slate-500">
            {d.divisors}: <span className="font-mono text-slate-300">{divs.length}</span>
          </span>
        </div>
        <div className="rounded-xl border border-white/8 bg-ink-900/50 p-3">
          <div className="mb-2 text-[11px] font-medium text-slate-400">{d.factorization}</div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-lg text-white">{n}</span>
            <span className="text-slate-500">=</span>
            {factors.map((f, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 px-2.5 py-1 font-mono text-sm font-bold text-ink-950">{f.factor}</span>
                {f.power > 1 ? <span className="font-mono text-xs text-brand-300">^{f.power}</span> : null}
                {i < factors.length - 1 ? <span className="text-slate-500">×</span> : null}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {divs.slice(0, 40).map((x) => (
            <span key={x} className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-slate-300">
              {x}
            </span>
          ))}
          {divs.length > 40 ? <span className="text-[11px] text-slate-500">+{divs.length - 40}</span> : null}
        </div>
      </div>
    </WidgetShell>
  )
}
