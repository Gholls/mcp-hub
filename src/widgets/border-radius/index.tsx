import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { buildBorderRadius } from '@shared/calc/design.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Slider, WidgetShell } from '../../components/ui.tsx'
import CopyButton from '../../components/CopyButton.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'CSS Border Radius', tl: 'Top-left', tr: 'Top-right', br: 'Bottom-right', bl: 'Bottom-left', uniform: 'Uniform', css: 'CSS', note: 'Shape corners with a live preview.' },
  zh: { title: 'CSS 圆角生成', tl: '左上', tr: '右上', br: '右下', bl: '左下', uniform: '统一', css: 'CSS', note: '可视化调节圆角，实时预览。' },
}

export default function BorderRadiusWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [tl, setTl] = useState(24)
  const [tr, setTr] = useState(24)
  const [br, setBr] = useState(24)
  const [bl, setBl] = useState(24)
  const [uniform, setUniform] = useState(true)
  const radius = buildBorderRadius(tl, tr, br, bl)
  const css = `border-radius: ${radius};`

  function setAll(setter: (v: number) => void, value: number) {
    if (uniform) {
      setTl(value)
      setTr(value)
      setBr(value)
      setBl(value)
    } else {
      setter(value)
    }
  }

  const corners: [string, number, (v: number) => void][] = [
    [d.tl, tl, setTl],
    [d.tr, tr, setTr],
    [d.br, br, setBr],
    [d.bl, bl, setBl],
  ]

  return (
    <WidgetShell title={d.title} icon="⬭" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="grid place-items-center rounded-xl border border-white/8 bg-[#141b2b] py-10">
          <div className="h-28 w-40 bg-gradient-to-br from-brand-500 to-accent-400" style={{ borderRadius: radius }} />
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" checked={uniform} onChange={(e) => setUniform(e.target.checked)} className="accent-brand-500" />
          {d.uniform}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {corners.map(([label, value, setter]) => (
            <Field key={label} label={label} hint={`${uniform ? tl : value}px`}>
              <Slider value={uniform ? tl : value} min={0} max={80} onChange={(v) => setAll(setter, v)} />
            </Field>
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
