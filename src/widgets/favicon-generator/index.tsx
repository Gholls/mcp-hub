import { useEffect, useRef, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Slider, WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Favicon Generator', text: 'Text / emoji', bg: 'Background', fg: 'Foreground', radius: 'Radius', download: 'Download PNG', note: 'Turn text or an emoji into a favicon.' },
  zh: { title: '图标生成器', text: '文字 / emoji', bg: '背景色', fg: '前景色', radius: '圆角', download: '下载 PNG', note: '把文字或 emoji 做成图标。' },
}

export default function FaviconGeneratorWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [text, setText] = useState('M')
  const [bg, setBg] = useState('#6366f1')
  const [fg, setFg] = useState('#0b0f19')
  const [radius, setRadius] = useState(22)
  const [dataUrl, setDataUrl] = useState('')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const size = 512
    const canvas = canvasRef.current ?? document.createElement('canvas')
    canvasRef.current = canvas
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, size, size)
    const r = (radius / 100) * (size / 2)
    ctx.beginPath()
    ctx.moveTo(r, 0)
    ctx.arcTo(size, 0, size, size, r)
    ctx.arcTo(size, size, 0, size, r)
    ctx.arcTo(0, size, 0, 0, r)
    ctx.arcTo(0, 0, size, 0, r)
    ctx.closePath()
    ctx.fillStyle = bg
    ctx.fill()
    ctx.fillStyle = fg
    ctx.font = `${size * 0.6}px ui-sans-serif, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text.slice(0, 2), size / 2, size / 2 + size * 0.03)
    setDataUrl(canvas.toDataURL('image/png'))
  }, [text, bg, fg, radius])

  return (
    <WidgetShell title={d.title} icon="⭐" footer={d.note}>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-1 flex-col items-center gap-3">
          <div className="flex items-end gap-3">
            {[64, 32, 16].map((s) => (
              <img key={s} src={dataUrl || undefined} width={s} height={s} alt={`${s}`} className="rounded-lg" style={{ width: s, height: s }} />
            ))}
          </div>
          {dataUrl ? (
            <a href={dataUrl} download="favicon.png" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 transition hover:border-brand-400/60 hover:text-white">
              {d.download}
            </a>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <Field label={d.text}>
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2} className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-400" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={d.bg}>
              <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-ink-950" />
            </Field>
            <Field label={d.fg}>
              <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-ink-950" />
            </Field>
          </div>
          <Field label={d.radius} hint={`${radius}%`}>
            <Slider value={radius} min={0} max={50} onChange={setRadius} />
          </Field>
        </div>
      </div>
    </WidgetShell>
  )
}
