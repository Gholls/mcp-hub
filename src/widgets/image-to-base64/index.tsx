import { useRef, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import CopyButton from '../../components/CopyButton.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Image to Base64', drop: 'Drop an image or click to choose', dataUri: 'Data URI', size: 'Size', note: 'Convert an image into a data URI / Base64.' },
  zh: { title: '图片转 Base64', drop: '拖入图片或点击选择', dataUri: 'Data URI', size: '大小', note: '把图片转成 Data URI / Base64。' },
}

function human(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export default function ImageToBase64Widget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [dataUrl, setDataUrl] = useState('')
  const [name, setName] = useState('')
  const [size, setSize] = useState(0)
  const [over, setOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function load(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return
    setName(file.name)
    setSize(file.size)
    const reader = new FileReader()
    reader.onload = () => setDataUrl(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  return (
    <WidgetShell title={d.title} icon="🖼️" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            load(e.dataTransfer.files[0])
          }}
          className={`grid h-36 cursor-pointer place-items-center rounded-xl border-2 border-dashed text-sm transition ${
            over ? 'border-brand-400 bg-brand-500/10 text-brand-200' : 'border-white/15 text-slate-400 hover:border-white/25'
          }`}
        >
          {dataUrl ? <img src={dataUrl} alt={name} className="max-h-32 max-w-full rounded-lg" /> : d.drop}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => load(e.target.files?.[0])} />
        {dataUrl ? (
          <>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{name}</span>
              <span>
                {d.size}: <span className="font-mono text-slate-200">{human(size)}</span>
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="max-h-32 flex-1 overflow-auto break-all rounded-lg border border-white/8 bg-ink-950/60 px-3 py-2 font-mono text-[11px] text-slate-300">{dataUrl}</div>
              <CopyButton value={dataUrl} />
            </div>
          </>
        ) : null}
      </div>
    </WidgetShell>
  )
}
