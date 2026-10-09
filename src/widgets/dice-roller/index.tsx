import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { rollDice, sum } from '@shared/calc/dice.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Segmented, WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Dice Roller', count: 'Dice', sides: 'Sides', roll: 'Roll', total: 'Total', note: 'Roll dice — results are cryptographically random.' },
  zh: { title: '骰子', count: '骰子数', sides: '面数', roll: '掷骰', total: '合计', note: '掷骰子——结果为密码学随机。' },
}

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72]],
}

function Die({ value, sides }: { value: number; sides: number }) {
  if (sides !== 6) {
    return (
      <div className="grid h-14 w-14 place-items-center rounded-xl border border-white/15 bg-ink-900 font-mono text-xl font-bold text-white shadow-lg">
        {value}
      </div>
    )
  }
  return (
    <svg viewBox="0 0 100 100" className="h-14 w-14 rounded-xl border border-white/15 bg-ink-900 shadow-lg">
      {(PIPS[value] ?? []).map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="9" fill="#e5e7eb" />
      ))}
    </svg>
  )
}

export default function DiceRollerWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [count, setCount] = useState(2)
  const [sides, setSides] = useState('6')
  const [values, setValues] = useState<number[]>(() => rollDice(2, 6))
  const nSides = Number(sides)

  function roll() {
    setValues(rollDice(count, nSides))
  }

  return (
    <WidgetShell title={d.title} icon="🎲" footer={d.note}>
      <div className="flex flex-col gap-4">
        <div className="flex min-h-[88px] flex-wrap items-center justify-center gap-3 rounded-xl border border-white/8 bg-ink-950/50 p-4">
          {values.map((v, i) => (
            <Die key={i} value={v} sides={nSides} />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Field label={d.count} hint={String(count)}>
              <Segmented
                value={String(count)}
                onChange={(v) => setCount(Number(v))}
                options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: String(n) }))}
              />
            </Field>
            <Field label={d.sides}>
              <Segmented
                value={sides}
                onChange={setSides}
                options={[6, 8, 10, 12, 20].map((s) => ({ value: String(s), label: `d${s}` }))}
              />
            </Field>
          </div>
          <button
            type="button"
            onClick={roll}
            className="rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 font-medium text-ink-950 transition hover:opacity-90"
          >
            {d.roll}
          </button>
        </div>
        <div className="rounded-lg border border-white/8 bg-ink-900/50 px-3 py-2 text-center text-sm text-slate-300">
          {d.total}: <span className="font-mono text-lg font-bold text-accent-300">{sum(values)}</span>
        </div>
      </div>
    </WidgetShell>
  )
}
