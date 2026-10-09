import { useEffect, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { secondsRemaining, totp } from '@shared/calc/totp.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import CopyButton from '../../components/CopyButton.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'TOTP Generator', secret: 'Base32 secret', code: 'Code', copy: 'Copy', invalid: 'Enter a Base32 secret', note: 'Generate time-based one-time codes (2FA).' },
  zh: { title: 'TOTP 动态口令', secret: 'Base32 密钥', code: '口令', copy: '复制', invalid: '请输入 Base32 密钥', note: '生成基于时间的动态口令（2FA）。' },
}

export default function TotpGeneratorWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [secret, setSecret] = useState('JBSWY3DPEHPK3PXP')
  const [code, setCode] = useState('')
  const [remaining, setRemaining] = useState(30)

  useEffect(() => {
    let cancelled = false
    async function tick() {
      if (!secret.trim()) {
        setCode('')
        return
      }
      try {
        const value = await totp(secret)
        if (!cancelled) setCode(value)
      } catch {
        if (!cancelled) setCode('')
      }
      if (!cancelled) setRemaining(secondsRemaining())
    }
    void tick()
    const timer = window.setInterval(tick, 1000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [secret])

  const pct = (remaining / 30) * 100

  return (
    <WidgetShell title={d.title} icon="🔐" footer={d.note}>
      <div className="flex flex-col gap-4">
        <input
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          spellCheck={false}
          aria-label={d.secret}
          className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-brand-400"
        />
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 flex-shrink-0">
            <svg viewBox="0 0 42 42" className="h-24 w-24 -rotate-90">
              <circle cx="21" cy="21" r="15.9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
              <circle cx="21" cy="21" r="15.9" fill="none" stroke="#22d3ee" strokeWidth="4" strokeDasharray={`${pct} ${100 - pct}`} />
            </svg>
            <div className="absolute inset-0 grid place-items-center font-mono text-lg text-slate-300">{remaining}</div>
          </div>
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">{d.code}</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-3xl font-bold tracking-widest text-white">{code ? code.slice(0, 3) + ' ' + code.slice(3) : '—'}</span>
              {code ? <CopyButton value={code} /> : null}
            </div>
          </div>
        </div>
      </div>
    </WidgetShell>
  )
}
