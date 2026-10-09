import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { buildBorderRadius, buildBoxShadow, buildGradient, type GradientKind } from '@shared/calc/design.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Segmented, Slider, WidgetShell } from '../../components/ui.tsx'
import CopyButton from '../../components/CopyButton.tsx'
import { readString } from '../params.ts'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: {
    title: 'CSS Effects Studio',
    gradient: 'Gradient',
    shadow: 'Shadow',
    radius: 'Radius',
    from: 'From',
    to: 'To',
    angle: 'Angle',
    kind: 'Type',
    x: 'X', y: 'Y', blur: 'Blur', spread: 'Spread', color: 'Color', inset: 'Inset',
    tl: 'Top-left', tr: 'Top-right', br: 'Bottom-right', bl: 'Bottom-left', uniform: 'Uniform',
    css: 'CSS', preview: 'Preview',
    note: 'Design gradients, shadows and rounded corners with live previews.',
  },
  zh: {
    title: 'CSS 效果工作室',
    gradient: '渐变',
    shadow: '阴影',
    radius: '圆角',
    from: '起始色',
    to: '结束色',
    angle: '角度',
    kind: '类型',
    x: 'X 偏移', y: 'Y 偏移', blur: '模糊', spread: '扩散', color: '颜色', inset: '内阴影',
    tl: '左上', tr: '右上', br: '右下', bl: '左下', uniform: '统一',
    css: 'CSS', preview: '预览',
    note: '可视化设计渐变、阴影与圆角，实时预览。',
  },
}

type Tab = 'gradient' | 'shadow' | 'radius'

export default function CssEffectsWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [tab, setTab] = useState<Tab>(() => {
    const t = readString(initial, 'tab', 'gradient')
    return t === 'shadow' || t === 'radius' ? (t as Tab) : 'gradient'
  })

  const [from, setFrom] = useState(() => readString(initial, 'from', '#6366f1'))
  const [to, setTo] = useState(() => readString(initial, 'to', '#22d3ee'))
  const [angle, setAngle] = useState(135)
  const [kind, setKind] = useState<GradientKind>('linear')

  const [sx, setSx] = useState(0)
  const [sy, setSy] = useState(12)
  const [blur, setBlur] = useState(24)
  const [spread, setSpread] = useState(-6)
  const [color, setColor] = useState('#00000055')
  const [inset, setInset] = useState(false)

  const [tl, setTl] = useState(24)
  const [tr, setTr] = useState(24)
  const [br, setBr] = useState(24)
  const [bl, setBl] = useState(24)
  const [uniform, setUniform] = useState(true)

  const gradient = buildGradient(angle, from, to, kind)
  const shadow = buildBoxShadow({ x: sx, y: sy, blur, spread, color, inset })
  const radius = buildBorderRadius(tl, tr, br, bl)

  const css = tab === 'gradient' ? `background: ${gradient};` : tab === 'shadow' ? `box-shadow: ${shadow};` : `border-radius: ${radius};`

  const previewStyle =
    tab === 'gradient'
      ? { background: gradient, borderRadius: 16 }
      : tab === 'shadow'
        ? { background: '#6366f1', boxShadow: shadow, borderRadius: 16 }
        : { background: '#22d3ee', borderRadius: radius }

  function setAllRadius(value: number) {
    if (uniform) {
      setTl(value)
      setTr(value)
      setBr(value)
      setBl(value)
    }
  }

  return (
    <WidgetShell title={d.title} icon="🎛️" footer={d.note}>
      <div className="flex flex-col gap-4">
        <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          {(['gradient', 'shadow', 'radius'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${tab === t ? 'bg-brand-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {d[t]}
            </button>
          ))}
        </div>

        <div className="grid place-items-center rounded-xl border border-white/8 bg-[#141b2b] py-10">
          <div className="h-28 w-44" style={previewStyle} />
        </div>

        <div className="flex flex-col gap-3">
          {tab === 'gradient' ? (
            <>
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
              <Segmented value={kind} onChange={setKind} options={[{ value: 'linear', label: 'linear' }, { value: 'radial', label: 'radial' }]} />
            </>
          ) : tab === 'shadow' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {([[d.x, sx, setSx, -40, 40], [d.y, sy, setSy, -40, 40], [d.blur, blur, setBlur, 0, 80], [d.spread, spread, setSpread, -30, 30]] as const).map(
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
            </>
          ) : (
            <>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={uniform} onChange={(e) => setUniform(e.target.checked)} className="accent-brand-500" />
                {d.uniform}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([[d.tl, tl, setTl], [d.tr, tr, setTr], [d.br, br, setBr], [d.bl, bl, setBl]] as const).map(([label, value, setter]) => (
                  <Field key={label} label={label} hint={`${uniform ? tl : value}px`}>
                    <Slider
                      value={uniform ? tl : value}
                      min={0}
                      max={80}
                      onChange={(v) => {
                        if (uniform) setAllRadius(v)
                        else setter(v)
                      }}
                    />
                  </Field>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded-lg bg-ink-950 px-3 py-2 font-mono text-xs text-slate-300">{css}</code>
          <CopyButton value={css} />
        </div>
      </div>
    </WidgetShell>
  )
}
