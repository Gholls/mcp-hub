import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { passwordStrength } from '@shared/calc/password.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Password Strength', input: 'Password', bits: 'Entropy', note: 'Strength meter and entropy estimate. Never sent anywhere.' },
  zh: { title: '密码强度', input: '密码', bits: '熵', note: '强度条与熵估算，绝不上传。' },
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#16a34a']

export default function PasswordStrengthWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [password, setPassword] = useState('Tr0ub4dour&3')
  const strength = passwordStrength(password)
  const pct = ((strength.score + 1) / 5) * 100

  return (
    <WidgetShell title={d.title} icon="🔒" footer={d.note}>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          spellCheck={false}
          aria-label={d.input}
          className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-brand-400"
        />
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="h-2 flex-1 rounded-full" style={{ background: i <= strength.score ? COLORS[strength.score] : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium" style={{ color: COLORS[strength.score] }}>
            {strength.label[locale]}
          </span>
          <span className="text-slate-500">
            {d.bits}: <span className="font-mono text-slate-300">{strength.bits}</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-ink-950">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[strength.score] }} />
        </div>
      </div>
    </WidgetShell>
  )
}
