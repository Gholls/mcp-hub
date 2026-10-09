import { useEffect, useRef, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { randomInt } from '@shared/calc/random.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Reaction Test', start: 'Wait for green…', click: 'Click!', go: 'GO!', again: 'Again', best: 'Best', last: 'Last', note: 'Measure your reaction time.' },
  zh: { title: '反应速度测试', start: '等待变绿…', click: '点击！', go: '开始！', again: '再来', best: '最好', last: '本次', note: '测量你的反应速度。' },
}

type Phase = 'idle' | 'waiting' | 'go'

export default function ReactionTestWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [phase, setPhase] = useState<Phase>('idle')
  const [last, setLast] = useState<number | null>(null)
  const [best, setBest] = useState<number | null>(null)
  const [history, setHistory] = useState<number[]>([])
  const startRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
  }, [])

  function handle() {
    if (phase === 'idle' || phase === 'go') {
      setPhase('waiting')
      timerRef.current = window.setTimeout(() => {
        startRef.current = performance.now()
        setPhase('go')
      }, 800 + randomInt(2200))
      return
    }
    if (phase === 'waiting') {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      setPhase('idle')
      return
    }
    const ms = Math.round(performance.now() - startRef.current)
    setLast(ms)
    setHistory((h) => [...h.slice(-9), ms])
    setBest((b) => (b === null ? ms : Math.min(b, ms)))
    setPhase('idle')
  }

  const max = Math.max(1, ...history)

  return (
    <WidgetShell title={d.title} icon="⚡" footer={d.note}>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handle}
          className={`grid h-40 w-full place-items-center rounded-2xl text-lg font-semibold transition ${
            phase === 'go'
              ? 'bg-emerald-500 text-ink-950'
              : phase === 'waiting'
                ? 'bg-rose-500/80 text-white'
                : 'bg-ink-900/70 text-slate-200 hover:bg-ink-800'
          }`}
        >
          {phase === 'go' ? d.go : phase === 'waiting' ? d.start : d.again}
        </button>
        <div className="flex gap-3">
          <div className="flex-1 rounded-lg border border-white/8 bg-ink-900/50 px-3 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{d.last}</div>
            <div className="font-mono text-lg text-accent-300">{last === null ? '—' : `${last} ms`}</div>
          </div>
          <div className="flex-1 rounded-lg border border-white/8 bg-ink-900/50 px-3 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{d.best}</div>
            <div className="font-mono text-lg text-emerald-300">{best === null ? '—' : `${best} ms`}</div>
          </div>
        </div>
        {history.length > 0 ? (
          <div className="flex h-20 items-end gap-1 rounded-lg border border-white/8 bg-ink-950/50 p-2">
            {history.map((ms, i) => (
              <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-brand-600 to-accent-400" style={{ height: `${(ms / max) * 100}%` }} title={`${ms}ms`} />
            ))}
          </div>
        ) : null}
      </div>
    </WidgetShell>
  )
}
