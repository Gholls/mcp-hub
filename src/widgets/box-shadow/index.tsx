import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { buildBoxShadow } from '@shared/calc/design.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Slider, WidgetShell } from '../../components/ui.tsx'
import CopyButton from '../../components/CopyButton.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'CSS Box Shadow', x: 'X', y: 'Y', blur: 'Blur', spread: 'Spread', color: 'Color', inset: 'Inset', css: 'CSS', note: 'Design a shadow with a live preview.' },
  zh: { title: 'CSS 阴影生成', x: 'X 偏移', y: 'Y 偏移', blur: '模糊', spread: '扩散', color: '颜色', inset: '内阴影', css: 'CSS', note: '可视化设计阴影，实时预览。' },
}

export default function BoxShadowWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [x, setX] = useState(0)
  const [y, setY] = useState(12)
  const [blur, setBlur] = useState(24)
  const [spread, setSpread] = useState(-6)
  const [color, setColor] = useState('#00000055')
  const [inset, setInset] = useState(false)
  const shadow = buildBoxShadow({ x, y, blur, spread, color, inset })
  const css = `box-shadow: ${shadow};`

  return (
    <WidgetShell title={d.title} icon="🌑" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="grid place-items-center rounded-xl border border-white/8 bg-[#141b2b] py-10">
          <div className="h-24 w-40 rounded-xl bg-gradient-to-br from-brand-500 to-accent-400" style={{ boxShadow: shadow }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([[d.x, x, setX, -40, 40], [d.y, y, setY, -40, 40], [d.blur, blur, setBlur, 0, 80], [d.spread, spread, setSpread, -30, 30]] as const).map(
            ([label, value, set, min, max]) => (
              <Field key={label} label={label} hint={`${value}px`}>
                <Slider value={value} min={min} max={max} onChange={set} />
              </Field>
            ),
          )}
        </div>
        <div className="flex items-center gap-3">
          <Field label={d.color}>
            <input type="color" value={color.slice(0, 7)} onChange={(e) => setColor(e.target.value + color.slice(7))} className="h-9 w-16 cursor-pointer rounded-lg border border-white/10 bg-ink-950" />
          </Field>
          <label className="flex items-center gap-2 pb-2 text-xs text-slate-300">
            <input type="checkbox" checked={inset} onChange={(e) => setInset(e.target.checked)} className="accent-brand-500" />
            {d.inset}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded-lg bg-ink-950 px-3 py-2 font-mono text-xs text-slate-300">{css}</code>
          <CopyButton value={css} />
        </div>
      </div>
    </WidgetShell>
  )
}
