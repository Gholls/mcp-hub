import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Locale } from '@shared/types.ts'
import {
  ICON_PLATFORMS, ICON_TARGETS, buildIcns, buildIco, buildIconReadme, buildWebManifest, buildZip,
  iconDrawPlan, resolveIconTargets,
  type IconDrawPlan, type IconPlatform, type IconStyle, type IconTarget, type ZipFile,
} from '@shared/calc/icon.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Segmented, Slider, WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: {
    title: 'Icon Generator', note: 'One logo in, every platform icon out — generated locally.', loading: 'Reading image…', replace: 'Replace', remove: 'Remove', preview: 'Source preview',
    dropTitle: 'Drop an image here or click to upload', dropHint: 'PNG, JPG, WebP or SVG · square logos work best',
    background: 'Background', bgColor: 'Background color', on: 'On', off: 'Transparent', padding: 'Padding', radius: 'Corner radius', fit: 'Fit', contain: 'Contain', cover: 'Cover',
    localNote: '100% local — your image never leaves the browser.', platforms: 'Platforms', all: 'All', none: 'None', requested: 'Requested by agent: {n} icon(s)', custom: 'Custom',
    countIcons: '{n} icons', downloadAll: 'Download all (.zip)', downloadZip: 'Download .zip', generating: 'Generating {done}/{total}…', progressLabel: 'Icon generation progress',
    summary: '{count} icons · {size}', emptyTitle: 'Your icon set will appear here', emptyText: 'Upload a logo to generate favicons, app icons and store assets for six platforms at once.',
    noPlatforms: 'Select at least one platform to generate icons.', noTargets: 'No matching icon targets. Check the requested IDs or size.',
    errUnsupported: 'That file type isn’t supported. Try a PNG, JPG, WebP or SVG.',
    errDecode: 'Couldn’t read this image. Try another file — HEIC photos aren’t supported by most browsers.',
    errRemote: 'Couldn’t load that image URL, usually because of a CORS restriction. Download it and upload the file instead.',
    errRender: 'Rendering failed. Try a smaller or simpler image.',
  },
  zh: {
    title: '图标生成器', note: '一张 Logo，生成全平台图标，全程本地处理。', loading: '正在读取图片…', replace: '更换', remove: '移除', preview: '原图预览',
    dropTitle: '拖入图片，或点击上传', dropHint: '支持 PNG、JPG、WebP、SVG · 方形 Logo 效果最佳',
    background: '背景', bgColor: '背景颜色', on: '启用', off: '透明', padding: '留白', radius: '圆角', fit: '适配', contain: '完整显示', cover: '填满',
    localNote: '100% 本地处理——图片不会离开你的浏览器。', platforms: '平台', all: '全选', none: '清空', requested: 'AI 指定：{n} 个图标', custom: '自定义',
    countIcons: '{n} 个图标', downloadAll: '下载全部（.zip）', downloadZip: '下载 .zip', generating: '正在生成 {done}/{total}…', progressLabel: '图标生成进度',
    summary: '{count} 个图标 · {size}', emptyTitle: '生成的图标会显示在这里', emptyText: '上传 Logo，即可一次生成 Web、iOS、macOS、Android、Windows 和 Linux 的图标与商店素材。',
    noPlatforms: '请至少选择一个平台。', noTargets: '没有匹配的图标目标，请检查指定的 ID 或尺寸。',
    errUnsupported: '不支持这种文件格式，请试试 PNG、JPG、WebP 或 SVG。',
    errDecode: '无法读取这张图片，请换一张试试——多数浏览器不支持 HEIC 照片。',
    errRemote: '无法加载这个图片链接，通常是跨域（CORS）限制。请下载后上传文件。',
    errRender: '图标渲染失败，请换一张更小或更简单的图片。',
  },
}

const PLATFORM_IDS: IconPlatform[] = ICON_PLATFORMS.map((platform) => platform.id)
const PLATFORM_SET = new Set<string>(PLATFORM_IDS)
const CHECKER: CSSProperties = {
  backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,.06) 75%)',
  backgroundSize: '10px 10px', backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0',
}

type SourceError = 'unsupported' | 'decode' | 'remote'
interface SourceImage { name: string; width: number; height: number; url: string; canvas: HTMLCanvasElement; revoke: boolean }
interface GeneratedIcon { target: IconTarget; bytes: Uint8Array; url: string }

function readList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  return typeof value === 'string' ? value.split(',').map((item) => item.trim()).filter(Boolean) : []
}

function readNumber(value: unknown, fallback: number, min: number, max: number): number {
  let num = NaN
  if (typeof value === 'number') num = value
  else if (typeof value === 'string' && value.trim()) num = Number(value)
  return Number.isFinite(num) ? Math.min(max, Math.max(min, num)) : fallback
}

function toHex(value: string): string | null {
  if (/^#[0-9a-f]{3}$/i.test(value)) return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toLowerCase()
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase()
  const match = value.match(/^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/i)
  if (!match) return null
  const channels = match.slice(1, 4).map((part) => Math.min(255, Math.max(0, Number(part))))
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function parseBackground(value: unknown): { enabled: boolean; color: string } | null {
  if (typeof value !== 'string' || !value.trim()) return null
  if (value.trim().toLowerCase() === 'transparent') return { enabled: false, color: '#ffffff' }
  const color = toHex(value.trim())
  return color ? { enabled: true, color } : null
}

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match))
}

function human(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function sourceName(src: string): string {
  if (src.startsWith('data:')) {
    const comma = src.indexOf(',')
    const ext = src.slice(5, comma < 0 ? src.length : comma).split(';')[0]?.split('/')[1]?.split('+')[0]
    return ext ? `pasted-image.${ext}` : 'pasted-image'
  }
  try {
    const last = new URL(src).pathname.split('/').filter(Boolean).pop()
    if (last) return decodeURIComponent(last)
  } catch {
    /* Relative or malformed source: fall through to a neutral label. */
  }
  return 'image'
}

function safeBase(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 40)
  return base || 'site'
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    let settled = false
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      if (ok) resolve(image)
      else reject(new Error('image-decode-failed'))
    }
    image.onload = () => {
      if (typeof image.decode === 'function') image.decode().then(() => finish(true), () => finish(true))
      else finish(true)
    }
    image.onerror = () => finish(false)
    image.src = src
  })
}

function normalizeImage(image: HTMLImageElement, max = 1024): HTMLCanvasElement {
  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height
  if (!width || !height) throw new Error('empty-image')
  const ratio = Math.min(1, max / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * ratio))
  canvas.height = Math.max(1, Math.round(height * ratio))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas-unavailable')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}

function clipShape(context: CanvasRenderingContext2D, plan: IconDrawPlan, size: number) {
  context.beginPath()
  if (plan.circle) context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  else {
    const radius = Math.max(0, Math.min(plan.radius, size / 2))
    context.moveTo(radius, 0)
    context.arcTo(size, 0, size, size, radius)
    context.arcTo(size, size, 0, size, radius)
    context.arcTo(0, size, 0, 0, radius)
    context.arcTo(0, 0, size, 0, radius)
    context.closePath()
  }
  context.clip()
}

function drawTarget(source: HTMLCanvasElement, target: IconTarget, style: IconStyle): HTMLCanvasElement {
  const size = Math.round(target.size)
  if (!Number.isFinite(size) || size <= 0) throw new Error('invalid-icon-size')
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas-unavailable')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  const plan = iconDrawPlan(target, style)
  context.save()
  clipShape(context, plan, size)
  if (plan.background) {
    context.fillStyle = plan.background
    context.fillRect(0, 0, size, size)
  }
  if (plan.content) {
    const { x, y, w, h } = plan.content
    context.save()
    context.beginPath()
    context.rect(x, y, w, h)
    context.clip()
    if (w > 0 && h > 0 && source.width > 0 && source.height > 0) {
      const scale = style.fit === 'cover' ? Math.max(w / source.width, h / source.height) : Math.min(w / source.width, h / source.height)
      const drawWidth = source.width * scale
      const drawHeight = source.height * scale
      context.drawImage(source, x + (w - drawWidth) / 2, y + (h - drawHeight) / 2, drawWidth, drawHeight)
    }
    context.restore()
  }
  context.restore()
  return canvas
}

function toPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('png-encode-failed'))), 'image/png')
  })
}

function revokeAll(urls: Set<string>) {
  for (const url of urls) URL.revokeObjectURL(url)
  urls.clear()
}

function uniquePngs(items: GeneratedIcon[]): { size: number; png: Uint8Array }[] {
  const seen = new Set<number>()
  const entries: { size: number; png: Uint8Array }[] = []
  for (const item of items) {
    if (seen.has(item.target.size)) continue
    seen.add(item.target.size)
    entries.push({ size: item.target.size, png: item.bytes })
  }
  return entries.sort((a, b) => a.size - b.size)
}

function containerFor(platform: IconPlatform, items: GeneratedIcon[]): ZipFile | null {
  const matching = items.filter((item) => item.target.platform === platform)
  if (platform === 'web') {
    const entries = [16, 32, 48].flatMap((size) => {
      const hits = matching.filter((item) => item.target.size === size)
      const hit = hits.find((item) => item.target.id.toLowerCase().includes('favicon')) ?? hits[0]
      return hit ? [{ size, png: hit.bytes }] : []
    })
    return entries.length ? { path: 'web/favicon.ico', bytes: buildIco(entries) } : null
  }
  const pngs = uniquePngs(matching)
  if (!pngs.length) return null
  if (platform === 'macos') return { path: 'macos/icon.icns', bytes: buildIcns(pngs) }
  if (platform === 'windows') return { path: 'windows/icon.ico', bytes: buildIco(pngs) }
  return null
}

function pngEntry(item: GeneratedIcon): ZipFile {
  return { path: `${item.target.platform}/${item.target.filename}`, bytes: item.bytes }
}

function downloadBytes(bytes: Uint8Array, filename: string) {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  const url = URL.createObjectURL(new Blob([copy.buffer], { type: 'application/zip' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export default function IconGeneratorWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [source, setSource] = useState<SourceImage | null>(null)
  const [sourceLoading, setSourceLoading] = useState(false)
  const [sourceError, setSourceError] = useState<SourceError | null>(null)
  const [genError, setGenError] = useState(false)
  const [results, setResults] = useState<GeneratedIcon[]>([])
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [bgState, setBgState] = useState(() => parseBackground(initial.background) ?? { enabled: false, color: '#ffffff' })
  const [padding, setPadding] = useState(() => readNumber(initial.padding, 8, 0, 30))
  const [radius, setRadius] = useState(() => readNumber(initial.radius, 22, 0, 50))
  const [fit, setFit] = useState<'contain' | 'cover'>('contain')
  const [platforms, setPlatforms] = useState<IconPlatform[]>(() => {
    if (initial.platforms === undefined || initial.platforms === null) return PLATFORM_IDS
    const requested = readList(initial.platforms).map((id) => id.toLowerCase())
    if (requested.includes('all')) return PLATFORM_IDS
    return [...new Set(requested.filter((id): id is IconPlatform => PLATFORM_SET.has(id)))]
  })
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const activeUrls = useRef<Set<string>>(new Set())
  const runIdRef = useRef(0)
  const sourceRequestRef = useRef(0)

  const initialImage = typeof initial.image === 'string' ? initial.image.trim() : ''
  const fixed = useMemo<IconTarget[] | null>(() => {
    const rawTargets = initial.targets
    const hasTargets = Array.isArray(rawTargets) ? rawTargets.length > 0 : typeof rawTargets === 'string' && rawTargets.trim() !== ''
    const rawSize = initial.size
    const hasSize = (typeof rawSize === 'number' && Number.isFinite(rawSize)) || (typeof rawSize === 'string' && rawSize.trim() !== '')
    if (!hasTargets && !hasSize) return null
    try {
      return resolveIconTargets(hasTargets ? { targets: rawTargets } : { size: rawSize }).targets
    } catch {
      return []
    }
  }, [initial.targets, initial.size])
  const targets = useMemo(() => fixed ?? ICON_TARGETS.filter((target) => platforms.includes(target.platform)), [fixed, platforms])

  useEffect(() => {
    if (!initialImage) return
    const request = ++sourceRequestRef.current
    let cancelled = false
    setSourceLoading(true)
    setSourceError(null)
    void (async () => {
      try {
        const image = await loadImage(initialImage)
        if (cancelled || request !== sourceRequestRef.current) return
        const canvas = normalizeImage(image)
        setSource({ name: sourceName(initialImage), width: image.naturalWidth, height: image.naturalHeight, url: initialImage, canvas, revoke: false })
      } catch {
        if (!cancelled && request === sourceRequestRef.current) setSourceError(/^https?:/i.test(initialImage) ? 'remote' : 'decode')
      } finally {
        if (!cancelled && request === sourceRequestRef.current) setSourceLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [initialImage])

  useEffect(() => {
    if (!source?.revoke) return
    const url = source.url
    return () => URL.revokeObjectURL(url)
  }, [source])

  useEffect(() => {
    const runId = ++runIdRef.current
    let cancelled = false
    if (!source || targets.length === 0) {
      revokeAll(activeUrls.current)
      setResults([])
      setProgress(null)
      setGenError(false)
      return
    }
    setGenError(false)
    setProgress({ done: 0, total: targets.length })
    const style: IconStyle = { background: bgState.enabled ? bgState.color : null, padding, radius, fit }
    const timer = window.setTimeout(() => {
      void (async () => {
        const next: GeneratedIcon[] = []
        const urls: string[] = []
        const cancel = () => urls.forEach((url) => URL.revokeObjectURL(url))
        try {
          for (let index = 0; index < targets.length; index++) {
            if (cancelled || runIdRef.current !== runId) return cancel()
            const blob = await toPng(drawTarget(source.canvas, targets[index], style))
            if (cancelled || runIdRef.current !== runId) return cancel()
            const bytes = new Uint8Array(await blob.arrayBuffer())
            const url = URL.createObjectURL(blob)
            urls.push(url)
            next.push({ target: targets[index], bytes, url })
            setProgress({ done: index + 1, total: targets.length })
          }
          revokeAll(activeUrls.current)
          for (const url of urls) activeUrls.current.add(url)
          setResults(next)
          setProgress(null)
        } catch {
          cancel()
          if (!cancelled && runIdRef.current === runId) {
            setProgress(null)
            setGenError(true)
          }
        }
      })()
    }, 280)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [source, targets, bgState.enabled, bgState.color, padding, radius, fit])

  useEffect(() => () => {
    sourceRequestRef.current++
    revokeAll(activeUrls.current)
  }, [])

  async function openFile(file: File) {
    if (file.type && !file.type.startsWith('image/')) {
      sourceRequestRef.current++
      setSourceLoading(false)
      setSourceError('unsupported')
      return
    }
    const request = ++sourceRequestRef.current
    setSourceLoading(true)
    setSourceError(null)
    const url = URL.createObjectURL(file)
    try {
      const image = await loadImage(url)
      if (request !== sourceRequestRef.current) {
        URL.revokeObjectURL(url)
        return
      }
      const canvas = normalizeImage(image)
      setSource({ name: file.name || 'image', width: image.naturalWidth, height: image.naturalHeight, url, canvas, revoke: true })
    } catch {
      URL.revokeObjectURL(url)
      if (request === sourceRequestRef.current) setSourceError('decode')
    } finally {
      if (request === sourceRequestRef.current) setSourceLoading(false)
    }
  }

  function removeSource() {
    sourceRequestRef.current++
    setSource(null)
    setSourceLoading(false)
    setSourceError(null)
    setGenError(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function togglePlatform(id: IconPlatform) {
    setPlatforms((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const baseName = safeBase(source?.name ?? '')
  const totalBytes = results.reduce((sum, item) => sum + item.bytes.byteLength, 0)
  const groups = useMemo(() => {
    const list: { platform: IconPlatform; label: string; items: GeneratedIcon[] }[] = []
    for (const meta of ICON_PLATFORMS) {
      const items = results.filter((item) => item.target.platform === meta.id)
      if (items.length) list.push({ platform: meta.id, label: meta.label[locale], items })
    }
    const custom = results.filter((item) => item.target.platform === 'custom')
    if (custom.length) list.push({ platform: 'custom', label: d.custom, items: custom })
    return list
  }, [results, locale, d.custom])

  function downloadAll() {
    if (!results.length) return
    const files: ZipFile[] = results.map(pngEntry)
    for (const platform of new Set(results.map((item) => item.target.platform))) {
      const container = containerFor(platform, results)
      if (container) files.push(container)
    }
    const encoder = new TextEncoder()
    if (results.some((item) => item.target.platform === 'web')) {
      files.push({
        path: 'site.webmanifest',
        bytes: encoder.encode(buildWebManifest({
          name: baseName,
          themeColor: bgState.enabled ? bgState.color : undefined,
          backgroundColor: bgState.enabled ? bgState.color : undefined,
        })),
      })
    }
    files.push({ path: 'README.txt', bytes: encoder.encode(buildIconReadme({ name: baseName })) })
    downloadBytes(buildZip(files), `${baseName}-icons.zip`)
  }

  function downloadGroup(platform: IconPlatform, items: GeneratedIcon[]) {
    const files = items.map(pngEntry)
    const container = containerFor(platform, items)
    if (container) files.push(container)
    downloadBytes(buildZip(files), `${baseName}-${platform}-icons.zip`)
  }

  const errorText = sourceError === 'unsupported' ? d.errUnsupported : sourceError === 'remote' ? d.errRemote : sourceError === 'decode' ? d.errDecode : genError ? d.errRender : ''

  return (
    <WidgetShell title={d.title} icon="◈" footer={d.note}>
      <div className="flex flex-col gap-4">
        <section className="rounded-xl border border-white/10 bg-ink-900/60 p-3">
          {source ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10" style={CHECKER}>
                <img src={source.url} alt={`${d.preview}: ${source.name}`} className="max-h-12 max-w-12 object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-slate-200">{source.name}</div>
                <div className="font-mono text-[11px] text-slate-500">{source.width} × {source.height} px</div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-300 transition hover:border-brand-400/60 hover:text-white">{d.replace}</button>
                <button type="button" onClick={removeSource} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-400 transition hover:border-rose-400/50 hover:text-rose-200">{d.remove}</button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                const file = event.dataTransfer.files[0]
                if (file) void openFile(file)
              }}
              className={`flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition ${dragging ? 'border-brand-400 bg-brand-500/10' : 'border-white/15 bg-ink-950/40 hover:border-white/30'}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-7 w-7 text-brand-300">
                <path d="M12 16V4m0 0 4 4m-4-4L8 8M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-medium text-slate-200">{sourceLoading ? d.loading : d.dropTitle}</span>
              <span className="text-[11px] text-slate-500">{d.dropHint}</span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) void openFile(file)
            }}
          />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label={d.background}>
              <div className="flex h-9 items-center justify-between rounded-lg border border-white/10 bg-ink-950 px-3">
                <span className={`text-[11px] ${bgState.enabled ? 'text-slate-300' : 'text-slate-500'}`}>{bgState.enabled ? d.on : d.off}</span>
                <span className="relative inline-flex">
                  <input type="checkbox" checked={bgState.enabled} onChange={(event) => setBgState((current) => ({ ...current, enabled: event.target.checked }))} aria-label={d.background} className="peer sr-only" />
                  <span aria-hidden="true" className="relative block h-4 w-7 rounded-full bg-ink-600 transition peer-checked:bg-brand-500 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink-950 after:absolute after:left-0.5 after:top-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-3" />
                </span>
              </div>
            </Field>
            <Field label={d.bgColor}>
              <input type="color" value={bgState.color} disabled={!bgState.enabled} onChange={(event) => setBgState((current) => ({ ...current, color: event.target.value }))} className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-ink-950 p-1 disabled:cursor-not-allowed disabled:opacity-50" />
            </Field>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label={d.padding} hint={`${padding}%`}><Slider value={padding} min={0} max={30} onChange={setPadding} /></Field>
            <Field label={d.radius} hint={`${radius}%`}><Slider value={radius} min={0} max={50} onChange={setRadius} /></Field>
          </div>
          <div className="mt-3">
            <div className="mb-1.5 text-xs font-medium text-slate-300">{d.fit}</div>
            <Segmented value={fit} options={[{ value: 'contain', label: d.contain }, { value: 'cover', label: d.cover }]} onChange={setFit} />
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-emerald-400/80">
              <rect x="3.5" y="7" width="9" height="6" rx="1.5" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" strokeLinecap="round" />
            </svg>
            {d.localNote}
          </p>
          {errorText ? <p role="alert" className="mt-3 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-[11px] leading-relaxed text-rose-200">{errorText}</p> : null}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{d.platforms}</h4>
            {fixed === null ? (
              <div className="flex items-center gap-2 text-[11px]">
                <button type="button" onClick={() => setPlatforms(PLATFORM_IDS)} className="text-brand-300 transition hover:text-brand-200">{d.all}</button>
                <span className="text-slate-600">·</span>
                <button type="button" onClick={() => setPlatforms([])} className="text-slate-400 transition hover:text-slate-200">{d.none}</button>
              </div>
            ) : null}
          </div>
          {fixed !== null ? <p className="mb-2 font-mono text-[11px] text-brand-300">{fill(d.requested, { n: fixed.length })}</p> : null}
          <div className="flex flex-wrap gap-1.5">
            {ICON_PLATFORMS.map((platform) => {
              const checked = fixed !== null ? fixed.some((target) => target.platform === platform.id) : platforms.includes(platform.id)
              return (
                <button
                  key={platform.id}
                  type="button"
                  aria-pressed={checked}
                  disabled={fixed !== null}
                  onClick={() => togglePlatform(platform.id)}
                  title={platform.description[locale]}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] transition ${checked ? 'border-brand-400/60 bg-brand-500/15 text-brand-100' : 'border-white/10 bg-ink-900/60 text-slate-400 hover:border-white/20 hover:text-slate-200'} ${fixed !== null ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <span>{platform.label[locale]}</span>
                  <span className="font-mono text-[10px] text-slate-500">{platform.targets.length}</span>
                  {checked ? (
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-3 w-3">
                      <path d="m3.5 8.5 3 3 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </button>
              )
            })}
          </div>
        </section>

        {!source ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-ink-900/40 px-4 py-8 text-center">
            <p className="text-sm font-medium text-slate-300">{d.emptyTitle}</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{d.emptyText}</p>
          </div>
        ) : (
          <section className="flex flex-col gap-3">
            <div className="rounded-xl border border-white/10 bg-ink-900/60 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs text-slate-200">{fill(d.summary, { count: results.length, size: human(totalBytes) })}</div>
                  {progress ? <div className="mt-0.5 text-[11px] text-brand-300" aria-live="polite">{fill(d.generating, { done: progress.done, total: progress.total })}</div> : null}
                </div>
                <button type="button" onClick={downloadAll} disabled={!results.length || progress !== null} className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white shadow transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50">{d.downloadAll}</button>
              </div>
              {progress ? (
                <div role="progressbar" aria-label={d.progressLabel} aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done} className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
                  <div className="h-full origin-left rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-transform duration-150" style={{ transform: `scaleX(${progress.total ? progress.done / progress.total : 0})` }} />
                </div>
              ) : null}
            </div>

            {!progress && !genError && targets.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-ink-900/40 px-3 py-6 text-center text-xs text-slate-500">{fixed !== null ? d.noTargets : d.noPlatforms}</p>
            ) : null}

            {groups.map((group) => (
              <div key={group.platform} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-slate-200">{group.label}</h4>
                  <span className="font-mono text-[11px] text-slate-500">{fill(d.countIcons, { n: group.items.length })}</span>
                  <button type="button" onClick={() => downloadGroup(group.platform, group.items)} className="ml-auto rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-brand-400/60 hover:text-white">{d.downloadZip}</button>
                </div>
                <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
                  {group.items.map((item) => (
                    <a key={item.target.id} href={item.url} download={item.target.filename} title={`${item.target.filename}${item.target.purpose ? ` · ${item.target.purpose}` : ''}`} className="group flex min-w-0 flex-col gap-1.5 rounded-lg border border-white/8 bg-ink-900/60 p-2 transition hover:border-brand-400/50 hover:bg-ink-800/60">
                      <span className="relative flex h-16 w-full items-center justify-center overflow-hidden rounded-md" style={CHECKER}>
                        <img src={item.url} alt={`${item.target.label} ${item.target.size}px`} width={56} height={56} className="object-contain" style={{ width: 56, height: 56, imageRendering: item.target.size <= 32 ? 'pixelated' : 'auto' }} />
                        <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded bg-ink-950/80 text-slate-400 transition group-hover:text-brand-300">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="h-3 w-3">
                            <path d="M8 2.5v7m0 0 2.75-2.75M8 9.5 5.25 6.75M3 12.5h10" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </span>
                      <span className="flex items-baseline justify-between gap-1">
                        <span className="font-mono text-[10px] text-slate-500">{item.target.size}px</span>
                        <span className="min-w-0 truncate text-[10px] text-slate-400 transition group-hover:text-brand-200">{item.target.filename}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </WidgetShell>
  )
}
