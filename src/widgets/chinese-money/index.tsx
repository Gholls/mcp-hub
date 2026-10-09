import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { toChineseMoney, toChineseNumber } from '@shared/calc/chinese-money.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import CopyButton from '../../components/CopyButton.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Amount in Chinese', input: 'Amount', upper: 'Capital (¥)', lower: 'Chinese numerals', note: 'Renders the amount like a receipt / cheque.' },
  zh: { title: '金额大写', input: '金额', upper: '人民币大写', lower: '中文数字', note: '以票据/支票样式呈现金额。' },
}

export default function ChineseMoneyWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [value, setValue] = useState(1234.56)
  const upper = toChineseMoney(value)
  const lower = toChineseNumber(value)

  return (
    <WidgetShell title={d.title} icon="💰" footer={d.note}>
      <div className="flex flex-col gap-3">
        <input
          type="number"
          value={value}
          step="0.01"
          onChange={(e) => setValue(Number(e.target.value))}
          aria-label={d.input}
          className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-lg text-slate-100 outline-none focus:border-brand-400"
        />
        <div className="relative overflow-hidden rounded-xl border border-amber-300/20 bg-gradient-to-br from-amber-50/5 to-amber-200/10 p-4">
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-500 to-accent-500" />
          <div className="text-[10px] uppercase tracking-widest text-amber-300/70">¥ {value.toFixed(2)}</div>
          <div className="mt-2 font-serif text-2xl tracking-wide text-amber-100">{upper}</div>
          <div className="mt-3 flex items-center justify-between border-t border-amber-200/20 pt-2 text-xs text-slate-400">
            <span>{d.lower}: {lower}</span>
            <CopyButton value={upper} />
          </div>
        </div>
      </div>
    </WidgetShell>
  )
}
