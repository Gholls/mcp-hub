import { useEffect, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import QRCode from 'qrcode'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import { readString } from '../params.ts'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'QR Code Generator', input: 'Text or URL', download: 'Download PNG', note: 'Generate a QR code from any text or link.' },
  zh: { title: '二维码生成器', input: '文本或链接', download: '下载 PNG', note: '把任意文本或链接生成二维码。' },
}

export default function QrGeneratorWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [text, setText] = useState(() => readString(initial, 'text', 'https://mcp.gholl.com'))
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!text.trim()) {
      setDataUrl('')
      return
    }
    QRCode.toDataURL(text, { width: 240, margin: 1, color: { dark: '#0b0f19', light: '#ffffff' } })
      .then((url) => {
        if (!cancelled) setDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setDataUrl('')
      })
    return () => {
      cancelled = true
    }
  }, [text])

  return (
    <WidgetShell title={d.title} icon="⬛" footer={d.note}>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <div className="grid h-60 w-60 flex-shrink-0 place-items-center rounded-xl border border-white/10 bg-white p-2">
          {dataUrl ? <img src={dataUrl} alt="QR" className="h-full w-full" /> : <span className="text-xs text-slate-400">—</span>}
        </div>
        <div className="flex w-full flex-1 flex-col gap-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} aria-label={d.input} className="w-full resize-y rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-400" />
          <a
            href={dataUrl || undefined}
            download="qrcode.png"
            className={`inline-block rounded-lg border border-white/10 px-3 py-2 text-center text-xs ${dataUrl ? 'text-slate-200 hover:border-brand-400/60 hover:text-white' : 'pointer-events-none text-slate-600'}`}
          >
            {d.download}
          </a>
        </div>
      </div>
    </WidgetShell>
  )
}
