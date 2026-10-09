import { useEffect, useRef, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Typing Test', sample: 'Type the sentence:', wpm: 'WPM', acc: 'Accuracy', restart: 'Restart', note: 'Measure typing speed and accuracy.' },
  zh: { title: '打字测试', sample: '请输入以下句子：', wpm: '速度', acc: '正确率', restart: '重新开始', note: '测量打字速度与正确率。' },
}

const SENTENCE = 'the quick brown fox jumps over the lazy dog while the sun sets behind the hills'

export default function TypingTestWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [typed, setTyped] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (startedAt === null) return
    const timer = window.setInterval(() => setElapsed((performance.now() - startedAt) / 1000), 250)
    return () => window.clearInterval(timer)
  }, [startedAt])

  const correct = [...typed].filter((ch, i) => ch === SENTENCE[i]).length
  const minutes = elapsed / 60
  const wpm = minutes > 0.01 ? Math.round(correct / 5 / minutes) : 0
  const accuracy = typed.length ? Math.round((correct / typed.length) * 100) : 100
  const done = typed.length >= SENTENCE.length

  function reset() {
    setTyped('')
    setStartedAt(null)
    setElapsed(0)
    inputRef.current?.focus()
  }

  return (
    <WidgetShell title={d.title} icon="⌨️" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-white/8 bg-ink-950/60 p-3 font-mono text-sm leading-relaxed">
          {[...SENTENCE].map((ch, i) => {
            const state = i < typed.length ? (typed[i] === ch ? 'ok' : 'bad') : 'todo'
            return (
              <span key={i} className={state === 'ok' ? 'text-emerald-400' : state === 'bad' ? 'bg-rose-500/30 text-rose-200' : 'text-slate-500'}>
                {ch}
              </span>
            )
          })}
        </div>
        <input
          ref={inputRef}
          value={typed}
          onChange={(e) => {
            if (startedAt === null) setStartedAt(performance.now())
            setTyped(e.target.value.slice(0, SENTENCE.length))
          }}
          autoFocus
          spellCheck={false}
          className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-brand-400"
        />
        <div className="flex gap-2">
          {([[d.wpm, wpm], [d.acc, `${accuracy}%`]] as const).map(([label, v]) => (
            <div key={label} className="flex-1 rounded-lg border border-white/8 bg-ink-900/50 px-3 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
              <div className="font-mono text-lg text-accent-300">{v}</div>
            </div>
          ))}
          <button type="button" onClick={reset} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-brand-400/60 hover:text-white">
            {done ? d.restart : d.restart}
          </button>
        </div>
      </div>
    </WidgetShell>
  )
}
