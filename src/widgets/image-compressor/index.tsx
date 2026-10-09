import { useRef, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Slider, WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Image Compressor', drop: 'Choose an image', quality: 'Quality', format: 'Format', original: 'Original', compressed: 'Compressed', download: 'Download', note: 'Compress an image in your browser.' },
  zh: { title: '图片压缩', drop: '选择图片', quality: '质量', format: '格式', original: '原图', compressed: '压缩后', download: '下载', note: '在浏览器内压缩图片。' },
}

function human(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export default function ImageCompressorWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [originalUrl, setOriginalUrl] = useState('')
  const [compressedUrl, setCompressedUrl] = useState('')
  const [originalSize, setOriginalSize] = useState(0)
  const [compressedSize, setCompressedSize] = useState(0)
  const [quality, setQuality] = useState(70)
  const [format, setFormat] = useState('image/jpeg')
  const imgRef = useRef<HTMLImageElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function load(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return
    setOriginalSize(file.size)
    const reader = new FileReader()
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : ''
      setOriginalUrl(url)
      const img = new Image()
      img.onload = () => {
        imgRef.current = img
        compress(img, format, quality)
      }
      img.src = url
    }
    reader.readAsDataURL(file)
  }

  function compress(img: HTMLImageElement, type: string, q: number) {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, 0, 0)
    const url = canvas.toDataURL(type, q / 100)
    setCompressedUrl(url)
    const base64 = url.split(',')[1] ?? ''
    setCompressedSize(Math.round((base64.length * 3) / 4))
  }

  return (
    <WidgetShell title={d.title} icon="🗜️" footer={d.note}>
      <div className="flex flex-col gap-3">
        <button type="button" onClick={() => inputRef.current?.click()} className="rounded-xl border border-white/15 py-6 text-sm text-slate-400 transition hover:border-white/25 hover:text-slate-200">
          {d.drop}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => load(e.target.files?.[0])} />
        {originalUrl ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="overflow-hidden rounded-lg border border-white/8">
                <img src={originalUrl} alt="original" className="h-28 w-full object-contain" />
                <div className="bg-ink-900/60 px-2 py-1 text-center text-[11px] text-slate-400">
                  {d.original}: <span className="font-mono text-slate-200">{human(originalSize)}</span>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-white/8">
                <img src={compressedUrl} alt="compressed" className="h-28 w-full object-contain" />
                <div className="bg-ink-900/60 px-2 py-1 text-center text-[11px] text-emerald-300">
                  {d.compressed}: <span className="font-mono">{human(compressedSize)}</span>
                </div>
              </div>
            </div>
            <Field label={d.quality} hint={`${quality}%`}>
              <Slider value={quality} min={10} max={95} onChange={(v) => { setQuality(v); if (imgRef.current) compress(imgRef.current, format, v) }} />
            </Field>
            <div className="flex gap-1.5">
              {['image/jpeg', 'image/webp', 'image/png'].map((f) => (
                <button key={f} type="button" onClick={() => { setFormat(f); if (imgRef.current) compress(imgRef.current, f, quality) }} aria-pressed={format === f} className={`rounded-lg border px-2.5 py-1 text-[11px] transition ${format === f ? 'border-brand-400/60 bg-brand-500/15 text-brand-200' : 'border-white/10 text-slate-400 hover:text-slate-200'}`}>
                  {f.replace('image/', '').toUpperCase()}
                </button>
              ))}
            </div>
            <a href={compressedUrl || undefined} download={`compressed.${format.split('/')[1]}`} className="rounded-lg border border-white/10 px-3 py-2 text-center text-xs text-slate-200 transition hover:border-brand-400/60 hover:text-white">
              {d.download}
            </a>
          </>
        ) : null}
      </div>
    </WidgetShell>
  )
}
