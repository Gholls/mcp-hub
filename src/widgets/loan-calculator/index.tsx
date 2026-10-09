import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { loan } from '@shared/calc/finance.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Slider, WidgetShell } from '../../components/ui.tsx'
import Sparkline from '../../components/Sparkline.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Loan Calculator', amount: 'Principal', rate: 'Annual rate %', years: 'Years', monthly: 'Monthly payment', interest: 'Total interest', paid: 'Total paid', balance: 'Balance over time', note: 'Monthly payment and amortization.' },
  zh: { title: '贷款计算器', amount: '贷款本金', rate: '年利率 %', years: '年限', monthly: '每月还款', interest: '总利息', paid: '还款总额', balance: '余额变化', note: '月供与还款曲线。' },
}

export default function LoanCalculatorWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [principal, setPrincipal] = useState(500000)
  const [rate, setRate] = useState(4.5)
  const [years, setYears] = useState(20)
  const result = useMemo(() => loan(principal, rate, years * 12), [principal, rate, years])
  const balances = result.schedule.filter((_, i) => i % Math.max(1, Math.floor(result.schedule.length / 60)) === 0).map((r) => r.balance)

  return (
    <WidgetShell title={d.title} icon="🏦" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {([[d.monthly, result.monthly], [d.interest, result.totalInterest], [d.paid, result.totalPaid]] as const).map(([label, v]) => (
            <div key={label} className="rounded-lg border border-white/8 bg-ink-900/50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
              <div className="font-mono text-sm text-accent-300">{v.toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-white/8 bg-ink-950/50 p-2">
          <div className="mb-1 px-1 text-[11px] text-slate-500">{d.balance}</div>
          <Sparkline values={balances} />
        </div>
        <Field label={d.amount} hint={principal.toLocaleString()}>
          <Slider value={principal} min={10000} max={2000000} step={10000} onChange={setPrincipal} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={d.rate} hint={`${rate}%`}>
            <Slider value={rate} min={0} max={15} step={0.1} onChange={setRate} />
          </Field>
          <Field label={d.years} hint={String(years)}>
            <Slider value={years} min={1} max={30} onChange={setYears} />
          </Field>
        </div>
      </div>
    </WidgetShell>
  )
}
