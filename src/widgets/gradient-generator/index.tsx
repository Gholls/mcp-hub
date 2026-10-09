import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { buildGradient, type GradientKind } from '@shared/calc/design.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Slider, WidgetShell } from '../../components/ui.tsx'
import CopyButton from '../../components/CopyButton.tsx'
import { readString } from '../params.ts'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'CSS Gradient Generator', from: 'From', to: 'To', angle: 'Angle', kind: 'Type', css: 'CSS', note: 'Live gradient preview with copy-ready CSS.' },
  zh: { title: 'CSS 渐变生成器', from: '起始色', to: '结束色', angle: '角度', kind: '类型', css: 'CSS', note: '实时渐变预览，一键复制 CSS。' },
}

export default function GradientGeneratorWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [from, setFrom] = useState(() => readString(initial, 'from', '#6366f1'))
  const [to, setTo] = useState(() => readString(initial, 'to', '#22d3ee'))
  const [angle, setAngle] = useState(135)
  const [kind, setKind] = useState<GradientKind>('linear')
  const gradient = buildGradient(angle, from, to, kind)
  const css = `background: ${gradient};`

  return (
    <WidgetShell title={d.title} icon="🌈" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="h-40 w-full rounded-xl border border-white/10 shadow-inner" style={{ background: gradient }} />
        <div className="grid grid-cols-2 gap-3">
          <Field label={d.from}>
            <input type="color" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-ink-950" />
          </Field>
          <Field label={d.to}>
            <input type="color" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-ink-950" />
          </Field>
        </div>
        {kind === 'linear' ? (
          <Field label={d.angle} hint={`${angle}°`}>
            <Slider value={angle} min={0} max={360} step={5} onChange={setAngle} />
          </Field>
        ) : null}
        <div className="flex gap-1.5">
          {(['linear', 'radial'] as const).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)} aria-pressed={kind === k} className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${kind === k ? 'border-brand-400/60 bg-brand-500/15 text-brand-200' : 'border-white/10 text-slate-400 hover:text-slate-200'}`}>
              {k}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded-lg bg-ink-950 px-3 py-2 font-mono text-xs text-slate-300">{css}</code>
          <CopyButton value={css} />
        </div>
      </div>
    </WidgetShell>
  )
}
