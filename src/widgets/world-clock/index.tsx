import { useEffect, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { CLOCK_ZONES, timeInZone } from '@shared/calc/worldclock.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'World Clock', note: 'Live times across cities, with a day/night indicator.' },
  zh: { title: '世界时钟', note: '多城市实时时间，含昼夜指示。' },
}

function localZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

export default function WorldClockWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const local = localZone()

  return (
    <WidgetShell title={d.title} icon="🌍" footer={d.note}>
      <ul className="flex flex-col gap-2">
        {CLOCK_ZONES.map((zone) => {
          const t = timeInZone(zone.tz, now)
          const isLocal = zone.tz === local
          return (
            <li
              key={zone.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${isLocal ? 'border-brand-500/40 bg-brand-500/5' : 'border-white/8 bg-ink-900/50'}`}
            >
              <span className="text-lg">{t.isDay ? '☀️' : '🌙'}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-200">{zone.label[locale]}</span>
                  {isLocal ? <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] text-brand-200">local</span> : null}
                </div>
                <div className="text-[11px] text-slate-500">{t.date}</div>
              </div>
              <div className="font-mono text-xl font-semibold tabular-nums text-white">{t.time}</div>
              <div className="hidden w-24 overflow-hidden rounded-full bg-ink-950 sm:block">
                <div className="h-2 rounded-full bg-gradient-to-r" style={{ width: '100%', background: t.isDay ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#312e81,#1e293b)' }} />
              </div>
            </li>
          )
        })}
      </ul>
    </WidgetShell>
  )
}
