// allow: SIZE_OK - the task mandates a single DOM-free icon pipeline module.
//
// Shared by the React widget (browser) and the Worker (no DOM), so this file
// may only touch Uint8Array/Uint8ClampedArray, TextEncoder, Math, DataView and
// the Compression Streams API.

export type IconPlatform = 'web' | 'ios' | 'macos' | 'android' | 'windows' | 'linux' | 'custom'

export interface IconTarget {
  id: string
  platform: IconPlatform
  filename: string
  size: number
  label: string
  purpose?: string
  scale?: number
  shape?: 'square' | 'circle'
  radius?: number
  opaque?: boolean
  colorOnly?: boolean
}

export interface IconPlatformMeta {
  id: IconPlatform
  label: { en: string; zh: string }
  description: { en: string; zh: string }
  targets: IconTarget[]
}

export interface IconStyle {
  background?: string | null
  padding?: number
  radius?: number
  fit?: 'contain' | 'cover'
}

export interface IconDrawPlan {
  size: number
  background: string | null
  content: { x: number; y: number; w: number; h: number } | null
  radius: number
  circle: boolean
}

export interface RgbaImage {
  width: number
  height: number
  data: Uint8ClampedArray
}

export interface ZipFile {
  path: string
  bytes: Uint8Array
}

type TargetExtra = Partial<Pick<IconTarget, 'scale' | 'shape' | 'radius' | 'opaque' | 'colorOnly'>>

function target(
  platform: IconPlatform,
  id: string,
  filename: string,
  size: number,
  purpose: string,
  extra: TargetExtra = {},
): IconTarget {
  return { id, platform, filename, size, label: `${size}×${size}`, purpose, ...extra }
}

const IOS_SIZES = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024]
const IOS_PURPOSE: Record<number, string> = {
  20: 'Apple Watch',
  29: 'Settings',
  40: 'Spotlight',
  58: 'Settings @2x',
  60: 'Home screen',
  76: 'iPad home screen',
  80: 'Spotlight @2x',
  87: 'Settings @3x',
  120: 'Home screen @2x',
  152: 'iPad @2x',
  167: 'iPad Pro',
  180: 'Home screen @3x',
  1024: 'App Store',
}

const MACOS_SIZES = [16, 32, 64, 128, 256, 512, 1024]
const ANDROID_DENSITIES: [string, number][] = [
  ['mdpi', 48],
  ['hdpi', 72],
  ['xhdpi', 96],
  ['xxhdpi', 144],
  ['xxxhdpi', 192],
]
const WINDOWS_SIZES = [16, 24, 32, 48, 64, 128, 256]
const LINUX_SIZES = [16, 24, 32, 48, 64, 128, 256, 512]

function iosTargets(): IconTarget[] {
  return IOS_SIZES.map((size) =>
    target('ios', `ios-${size}`, `icon-${size}.png`, size, IOS_PURPOSE[size] ?? 'App icon', { opaque: true }),
  )
}

function androidTargets(): IconTarget[] {
  const targets: IconTarget[] = []
  for (const [density, size] of ANDROID_DENSITIES) {
    targets.push(target('android', `android-${density}`, 'ic_launcher.png', size, 'Legacy launcher'))
  }
  for (const [density, size] of ANDROID_DENSITIES) {
    targets.push(
      target('android', `android-round-${density}`, 'ic_launcher_round.png', size, 'Round launcher', {
        shape: 'circle',
      }),
    )
  }
  for (const [density, size] of ANDROID_DENSITIES) {
    targets.push(
      target('android', `android-foreground-${density}`, 'ic_launcher_foreground.png', Math.round(size * 2.25), 'Adaptive foreground', {
        scale: 0.66,
      }),
    )
  }
  for (const [density, size] of ANDROID_DENSITIES) {
    targets.push(
      target('android', `android-background-${density}`, 'ic_launcher_background.png', Math.round(size * 2.25), 'Adaptive background', {
        colorOnly: true,
        opaque: true,
      }),
    )
  }
  targets.push(target('android', 'android-play-512', 'play-store-icon.png', 512, 'Play Store', { opaque: true }))
  return targets
}

function windowsTargets(): IconTarget[] {
  const targets = WINDOWS_SIZES.map((size) => target('windows', `windows-${size}`, `icon-${size}.png`, size, 'App icon'))
  targets.push(target('windows', 'windows-44', 'Square44x44Logo.png', 44, 'Windows tile'))
  targets.push(target('windows', 'windows-150', 'Square150x150Logo.png', 150, 'Windows tile'))
  return targets
}

function linuxTargets(): IconTarget[] {
  return LINUX_SIZES.map((size) =>
    target('linux', `linux-${size}`, `${size}x${size}.png`, size, 'Desktop entry'),
  )
}

export const ICON_PLATFORMS: IconPlatformMeta[] = [
  {
    id: 'web',
    label: { en: 'Web & PWA', zh: 'Web 与 PWA' },
    description: { en: 'Favicons, Apple touch icon and PWA install icons.', zh: '网站图标、Apple 触控图标与 PWA 安装图标。' },
    targets: [
      target('web', 'web-favicon-16', 'favicon-16x16.png', 16, 'Browser tab'),
      target('web', 'web-favicon-32', 'favicon-32x32.png', 32, 'Favicon'),
      target('web', 'web-favicon-48', 'favicon-48x48.png', 48, 'Favicon'),
      target('web', 'web-apple-touch', 'apple-touch-icon.png', 180, 'Apple touch icon', { opaque: true }),
      target('web', 'web-pwa-192', 'android-chrome-192x192.png', 192, 'PWA install'),
      target('web', 'web-pwa-512', 'android-chrome-512x512.png', 512, 'PWA install'),
      target('web', 'web-maskable-512', 'maskable-512x512.png', 512, 'Maskable PWA icon', {
        scale: 0.8,
        opaque: true,
      }),
    ],
  },
  {
    id: 'ios',
    label: { en: 'iOS / iPadOS', zh: 'iOS / iPadOS' },
    description: { en: 'Full Xcode AppIcon set, all opaque.', zh: '完整的 Xcode AppIcon 图标集，全部不透明。' },
    targets: iosTargets(),
  },
  {
    id: 'macos',
    label: { en: 'macOS', zh: 'macOS' },
    description: { en: 'PNG sizes used by .icns app bundles.', zh: '.icns 应用包使用的 PNG 尺寸。' },
    targets: MACOS_SIZES.map((size) =>
      target('macos', `macos-${size}`, `icon-${size}.png`, size, size >= 512 ? 'App Store' : 'Desktop icon'),
    ),
  },
  {
    id: 'android',
    label: { en: 'Android', zh: 'Android' },
    description: { en: 'Launcher, adaptive and Play Store assets.', zh: '启动器、自适应与 Play 商店资源。' },
    targets: androidTargets(),
  },
  {
    id: 'windows',
    label: { en: 'Windows', zh: 'Windows' },
    description: { en: 'Executable icons and Start menu tiles.', zh: '可执行文件图标与开始菜单磁贴。' },
    targets: windowsTargets(),
  },
  {
    id: 'linux',
    label: { en: 'Linux', zh: 'Linux' },
    description: { en: 'hicolor desktop entry sizes.', zh: 'hicolor 桌面条目尺寸。' },
    targets: linuxTargets(),
  },
]

export const ICON_TARGETS: IconTarget[] = ICON_PLATFORMS.flatMap((platform) => platform.targets)

const ICON_TARGET_BY_ID = new Map<string, IconTarget>(ICON_TARGETS.map((item) => [item.id, item]))

export function getIconTarget(id: string): IconTarget | undefined {
  return ICON_TARGET_BY_ID.get(id.trim().toLowerCase())
}

const REAL_PLATFORMS: IconPlatform[] = ['web', 'ios', 'macos', 'android', 'windows', 'linux']

const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

const round2 = (value: number): number => {
  const rounded = Math.round(value * 100) / 100
  return rounded === 0 ? 0 : rounded
}

function normalizeList(value: unknown): string[] {
  const out: string[] = []
  const push = (item: string) => {
    for (const piece of item.split(',')) {
      const token = piece.trim().toLowerCase()
      if (token) out.push(token)
    }
  }
  if (typeof value === 'string') push(value)
  else if (Array.isArray(value)) {
    for (const item of value) if (typeof item === 'string') push(item)
  }
  return out
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.trim())
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function customTarget(size: number): IconTarget {
  return {
    id: `custom-${size}`,
    platform: 'custom',
    filename: `icon-${size}.png`,
    size,
    label: `${size}×${size}`,
    purpose: 'Custom size',
  }
}

export function resolveIconTargets(
  opts: { platforms?: unknown; targets?: unknown; size?: unknown } = {},
): { targets: IconTarget[]; unknown: string[] } {
  const unknown: string[] = []
  const seenUnknown = new Set<string>()
  const noteUnknown = (token: string) => {
    if (!seenUnknown.has(token)) {
      seenUnknown.add(token)
      unknown.push(token)
    }
  }

  const targetIds = normalizeList(opts.targets)
  const selectedIds = new Set<string>()
  for (const id of targetIds) {
    if (ICON_TARGET_BY_ID.has(id)) selectedIds.add(id)
    else noteUnknown(id)
  }
  if (selectedIds.size > 0) {
    return { targets: ICON_TARGETS.filter((item) => selectedIds.has(item.id)), unknown }
  }

  const customSize = toFiniteNumber(opts.size)
  if (customSize !== null) {
    return { targets: [customTarget(clamp(Math.round(customSize), 16, 2048))], unknown }
  }

  const requested = normalizeList(opts.platforms)
  let platforms: Set<string>
  if (opts.platforms === undefined) {
    platforms = new Set(['web'])
  } else {
    const valid = requested.filter((name): name is IconPlatform =>
      (REAL_PLATFORMS as string[]).includes(name),
    )
    for (const name of requested) {
      if (name === 'all' || name === 'custom') continue
      if (!(REAL_PLATFORMS as string[]).includes(name)) noteUnknown(name)
    }
    platforms = requested.includes('all') || valid.length === 0
      ? new Set<string>(REAL_PLATFORMS)
      : new Set<string>(valid)
  }

  return { targets: ICON_TARGETS.filter((item) => platforms.has(item.platform)), unknown }
}

function resolveBackground(background: string | null | undefined, target: IconTarget): string | null {
  const raw = typeof background === 'string' ? background.trim() : ''
  if (raw !== '' && raw.toLowerCase() !== 'transparent') return raw
  if (target.opaque === true || target.colorOnly === true) return '#ffffff'
  return null
}

export function iconDrawPlan(target: IconTarget, style: IconStyle = {}): IconDrawPlan {
  const size = target.size
  const padding = clamp(style.padding ?? 0, 0, 40)
  const inset = (size * padding) / 100
  const scale = Number.isFinite(target.scale ?? 1) ? (target.scale ?? 1) : 1
  const side = (size - inset * 2) * scale
  const offset = (size - side) / 2
  const circle = target.shape === 'circle'
  const radiusPercent = clamp(circle ? 50 : (target.radius ?? style.radius ?? 0), 0, 50)
  const radius = circle ? round2(size / 2) : round2((radiusPercent / 100) * (size / 2))
  const background = resolveBackground(style.background, target)
  const content =
    target.colorOnly === true || !(side > 0)
      ? null
      : { x: round2(offset), y: round2(offset), w: round2(side), h: round2(side) }
  return { size, background, content, radius, circle }
}

/* ------------------------------------------------------------------ colors */

interface ParsedColor {
  r: number
  g: number
  b: number
  a: number
}

const NAMED_COLORS: Record<string, string> = {
  white: '#ffffff',
  black: '#000000',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  gray: '#808080',
  grey: '#808080',
  yellow: '#ffff00',
  orange: '#ffa500',
  purple: '#800080',
}

function parseHexColor(hex: string): ParsedColor | null {
  if (!/^[0-9a-f]+$/.test(hex)) return null
  const expand = (part: string) => parseInt(part.length === 1 ? part + part : part, 16)
  if (hex.length === 3 || hex.length === 4) {
    return {
      r: expand(hex[0]),
      g: expand(hex[1]),
      b: expand(hex[2]),
      a: hex.length === 4 ? expand(hex[3]) : 255,
    }
  }
  if (hex.length === 6 || hex.length === 8) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255,
    }
  }
  return null
}

function parseCssColor(input: string): ParsedColor | null {
  const value = input.trim().toLowerCase()
  if (value === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }
  if (value.startsWith('#')) return parseHexColor(value.slice(1))
  const named = NAMED_COLORS[value]
  if (named) return parseHexColor(named.slice(1))
  const fn = /^rgba?\(([^)]*)\)$/.exec(value)
  if (!fn) return null
  const parts = fn[1].split(/[,/\s]+/).filter(Boolean)
  if (parts.length < 3) return null
  const channel = (part: string): number => {
    const percent = part.endsWith('%')
    const raw = Number(percent ? part.slice(0, -1) : part)
    if (!Number.isFinite(raw)) return Number.NaN
    return percent ? (raw / 100) * 255 : raw
  }
  const r = channel(parts[0])
  const g = channel(parts[1])
  const b = channel(parts[2])
  if ([r, g, b].some((channelValue) => Number.isNaN(channelValue))) return null
  let a = 255
  if (parts.length > 3) {
    const percent = parts[3].endsWith('%')
    const raw = Number(percent ? parts[3].slice(0, -1) : parts[3])
    if (Number.isFinite(raw)) a = percent ? (raw / 100) * 255 : raw <= 1 ? raw * 255 : raw
  }
  return {
    r: clamp(Math.round(r), 0, 255),
    g: clamp(Math.round(g), 0, 255),
    b: clamp(Math.round(b), 0, 255),
    a: clamp(Math.round(a), 0, 255),
  }
}

/* ---------------------------------------------------------------- sampling */

type Premul = [number, number, number, number]

function readPremul(src: RgbaImage, x: number, y: number): Premul {
  const index = (y * src.width + x) * 4
  const alpha = src.data[index + 3]
  return [src.data[index] * alpha, src.data[index + 1] * alpha, src.data[index + 2] * alpha, alpha]
}

function toStraight(sample: Premul): { r: number; g: number; b: number; a: number } {
  const alpha = sample[3]
  if (alpha <= 0) return { r: 0, g: 0, b: 0, a: 0 }
  return { r: sample[0] / alpha, g: sample[1] / alpha, b: sample[2] / alpha, a: alpha / 255 }
}

function sampleArea(src: RgbaImage, x0: number, y0: number, x1: number, y1: number): Premul | null {
  const ax0 = clamp(x0, 0, src.width)
  const ax1 = clamp(x1, 0, src.width)
  const ay0 = clamp(y0, 0, src.height)
  const ay1 = clamp(y1, 0, src.height)
  if (ax1 <= ax0 || ay1 <= ay0) return null
  let r = 0
  let g = 0
  let b = 0
  let a = 0
  let weightSum = 0
  for (let y = Math.floor(ay0); y < Math.ceil(ay1); y++) {
    const wy = Math.min(ay1, y + 1) - Math.max(ay0, y)
    if (wy <= 0) continue
    for (let x = Math.floor(ax0); x < Math.ceil(ax1); x++) {
      const wx = Math.min(ax1, x + 1) - Math.max(ax0, x)
      if (wx <= 0) continue
      const weight = wx * wy
      const pixel = readPremul(src, x, y)
      r += pixel[0] * weight
      g += pixel[1] * weight
      b += pixel[2] * weight
      a += pixel[3] * weight
      weightSum += weight
    }
  }
  if (weightSum <= 0) return null
  return [r / weightSum, g / weightSum, b / weightSum, a / weightSum]
}

function sampleBilinear(src: RgbaImage, fx: number, fy: number): Premul {
  const gx = clamp(fx - 0.5, 0, src.width - 1)
  const gy = clamp(fy - 0.5, 0, src.height - 1)
  const x0 = Math.floor(gx)
  const y0 = Math.floor(gy)
  const x1 = Math.min(x0 + 1, src.width - 1)
  const y1 = Math.min(y0 + 1, src.height - 1)
  const tx = gx - x0
  const ty = gy - y0
  const p00 = readPremul(src, x0, y0)
  const p10 = readPremul(src, x1, y0)
  const p01 = readPremul(src, x0, y1)
  const p11 = readPremul(src, x1, y1)
  const top = [0, 1, 2, 3].map((channel) => p00[channel] * (1 - tx) + p10[channel] * tx)
  const bottom = [0, 1, 2, 3].map((channel) => p01[channel] * (1 - tx) + p11[channel] * tx)
  return [0, 1, 2, 3].map((channel) => top[channel] * (1 - ty) + bottom[channel] * ty) as Premul
}

export function resampleRgba(src: RgbaImage, width: number, height: number): RgbaImage {
  const outW = Math.max(1, Math.round(width))
  const outH = Math.max(1, Math.round(height))
  const out: RgbaImage = { width: outW, height: outH, data: new Uint8ClampedArray(outW * outH * 4) }
  if (src.width <= 0 || src.height <= 0) return out
  const downscale = outW <= src.width && outH <= src.height
  const upscale = outW >= src.width && outH >= src.height
  for (let y = 0; y < outH; y++) {
    const sy0 = (y * src.height) / outH
    const sy1 = ((y + 1) * src.height) / outH
    for (let x = 0; x < outW; x++) {
      const sx0 = (x * src.width) / outW
      const sx1 = ((x + 1) * src.width) / outW
      const sample = downscale || !upscale
        ? sampleArea(src, sx0, sy0, sx1, sy1)
        : sampleBilinear(src, (sx0 + sx1) / 2, (sy0 + sy1) / 2)
      if (!sample) continue
      const straight = toStraight(sample)
      const index = (y * outW + x) * 4
      out.data[index] = Math.round(straight.r)
      out.data[index + 1] = Math.round(straight.g)
      out.data[index + 2] = Math.round(straight.b)
      out.data[index + 3] = Math.round(straight.a * 255)
    }
  }
  return out
}

/* -------------------------------------------------------------- composing */

function shapeCoverage(px: number, py: number, size: number, radius: number): number {
  const half = size / 2
  const qx = Math.abs(px - half) - (half - radius)
  const qy = Math.abs(py - half) - (half - radius)
  const distance =
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius
  return clamp(0.5 - distance, 0, 1)
}

function blendInto(out: RgbaImage, index: number, r: number, g: number, b: number, alpha: number): void {
  const a = clamp(alpha, 0, 1)
  if (a <= 0) return
  const dstA = out.data[index + 3] / 255
  const outA = a + dstA * (1 - a)
  if (outA <= 0) return
  const blend = (src: number, dst: number) => (src * a + dst * dstA * (1 - a)) / outA
  out.data[index] = Math.round(blend(r, out.data[index]))
  out.data[index + 1] = Math.round(blend(g, out.data[index + 1]))
  out.data[index + 2] = Math.round(blend(b, out.data[index + 2]))
  out.data[index + 3] = Math.round(outA * 255)
}

function fillBackground(out: RgbaImage, plan: IconDrawPlan, color: ParsedColor): void {
  const size = out.width
  const radius = Math.min(plan.radius, size / 2)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const coverage = shapeCoverage(x + 0.5, y + 0.5, size, radius)
      blendInto(out, (y * size + x) * 4, color.r, color.g, color.b, coverage * (color.a / 255))
    }
  }
}

function drawContent(out: RgbaImage, src: RgbaImage, plan: IconDrawPlan, fit: 'contain' | 'cover'): void {
  const rect = plan.content
  if (!rect || src.width <= 0 || src.height <= 0) return
  const scale = fit === 'cover'
    ? Math.max(rect.w / src.width, rect.h / src.height)
    : Math.min(rect.w / src.width, rect.h / src.height)
  if (!Number.isFinite(scale) || scale <= 0) return
  const drawW = src.width * scale
  const drawH = src.height * scale
  const originX = rect.x + (rect.w - drawW) / 2
  const originY = rect.y + (rect.h - drawH) / 2
  const size = out.width
  const radius = Math.min(plan.radius, size / 2)
  const x0 = Math.max(0, Math.floor(Math.max(rect.x, originX)))
  const x1 = Math.min(size, Math.ceil(Math.min(rect.x + rect.w, originX + drawW)))
  const y0 = Math.max(0, Math.floor(Math.max(rect.y, originY)))
  const y1 = Math.min(size, Math.ceil(Math.min(rect.y + rect.h, originY + drawH)))
  const downscale = scale <= 1
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const sx0 = (x - originX) / scale
      const sx1 = (x + 1 - originX) / scale
      const sy0 = (y - originY) / scale
      const sy1 = (y + 1 - originY) / scale
      const sample = downscale
        ? sampleArea(src, sx0, sy0, sx1, sy1)
        : sampleBilinear(src, (sx0 + sx1) / 2, (sy0 + sy1) / 2)
      if (!sample) continue
      const straight = toStraight(sample)
      const coverage = radius > 0 ? shapeCoverage(x + 0.5, y + 0.5, size, radius) : 1
      blendInto(out, (y * size + x) * 4, straight.r, straight.g, straight.b, straight.a * coverage)
    }
  }
}

export function composeIcon(src: RgbaImage, target: IconTarget, style: IconStyle = {}): RgbaImage {
  const size = Math.max(1, Math.round(target.size))
  const plan = iconDrawPlan({ ...target, size }, style)
  const out: RgbaImage = { width: size, height: size, data: new Uint8ClampedArray(size * size * 4) }
  if (plan.background) {
    const color = parseCssColor(plan.background)
    if (color) fillBackground(out, plan, color)
  }
  drawContent(out, src, plan, style.fit === 'cover' ? 'cover' : 'contain')
  return out
}

/* --------------------------------------------------------------- byte tools */

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  let total = 0
  for (const part of parts) total += part.length
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

let crcTable: Uint32Array | null = null

function getCrcTable(): Uint32Array {
  if (crcTable) return crcTable
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let value = n
    for (let bit = 0; bit < 8; bit++) {
      value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[n] = value >>> 0
  }
  crcTable = table
  return table
}

function crc32(bytes: Uint8Array): number {
  const table = getCrcTable()
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

async function runTransform(
  stream: CompressionStream | DecompressionStream,
  input: Uint8Array,
): Promise<Uint8Array> {
  const reader = stream.readable.getReader()
  const chunks: Uint8Array[] = []
  const reading = (async () => {
    for (;;) {
      const result = await reader.read()
      if (result.done) break
      if (result.value) chunks.push(result.value)
    }
    return concatBytes(chunks)
  })()
  const writer = stream.writable.getWriter()
  try {
    await writer.write(new Uint8Array(input))
    await writer.close()
  } catch (error) {
    await reader.cancel().catch(() => undefined)
    throw error
  }
  return reading
}

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

export async function encodePng(image: RgbaImage): Promise<Uint8Array> {
  const width = Math.round(image.width)
  const height = Math.round(image.height)
  if (width <= 0 || height <= 0 || image.data.length < width * height * 4) {
    throw new Error('encodePng: invalid image dimensions')
  }
  const stride = width * 4
  const raw = new Uint8Array((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    raw.set(image.data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1)
  }
  const header = new Uint8Array(13)
  const headerView = new DataView(header.buffer)
  headerView.setUint32(0, width)
  headerView.setUint32(4, height)
  header[8] = 8
  header[9] = 6
  const compressed = await runTransform(new CompressionStream('deflate'), raw)
  return concatBytes([PNG_SIGNATURE, pngChunk('IHDR', header), pngChunk('IDAT', compressed), pngChunk('IEND', new Uint8Array(0))])
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

function unfilter(raw: Uint8Array, width: number, height: number, channels: number, bitDepth: number): Uint8Array {
  const rowBytes = Math.ceil((width * channels * bitDepth) / 8)
  const bpp = Math.max(1, Math.ceil((channels * bitDepth) / 8))
  if (raw.length < height * (rowBytes + 1)) throw new Error('decodePng: truncated image data')
  const out = new Uint8Array(rowBytes * height)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (rowBytes + 1)]
    const srcStart = y * (rowBytes + 1) + 1
    const dstStart = y * rowBytes
    for (let i = 0; i < rowBytes; i++) {
      const value = raw[srcStart + i]
      const left = i >= bpp ? out[dstStart + i - bpp] : 0
      const above = y > 0 ? out[dstStart - rowBytes + i] : 0
      const upperLeft = i >= bpp && y > 0 ? out[dstStart - rowBytes + i - bpp] : 0
      let result: number
      switch (filter) {
        case 0:
          result = value
          break
        case 1:
          result = value + left
          break
        case 2:
          result = value + above
          break
        case 3:
          result = value + ((left + above) >> 1)
          break
        case 4:
          result = value + paeth(left, above, upperLeft)
          break
        default:
          throw new Error(`decodePng: unsupported filter type ${filter}`)
      }
      out[dstStart + i] = result & 0xff
    }
  }
  return out
}

function sampleValue(row: Uint8Array, index: number, bitDepth: number): number {
  if (bitDepth === 8) return row[index]
  if (bitDepth === 16) return (row[index * 2] << 8) | row[index * 2 + 1]
  const perByte = 8 / bitDepth
  const byte = row[Math.floor(index / perByte)]
  const shift = 8 - bitDepth * ((index % perByte) + 1)
  return (byte >> shift) & ((1 << bitDepth) - 1)
}

export async function decodePng(bytes: Uint8Array): Promise<RgbaImage> {
  if (bytes.length < 8) throw new Error('decodePng: truncated PNG signature')
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) throw new Error('decodePng: invalid PNG signature')
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = -1
  let palette: Uint8Array | null = null
  let transparency: Uint8Array | null = null
  const idat: Uint8Array[] = []
  let sawHeader = false
  let sawEnd = false
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset)
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7])
    const dataEnd = offset + 8 + length
    if (dataEnd + 4 > bytes.length) throw new Error(`decodePng: truncated ${type} chunk`)
    const expectedCrc = view.getUint32(dataEnd)
    if (crc32(bytes.subarray(offset + 4, dataEnd)) !== expectedCrc) {
      throw new Error(`decodePng: CRC mismatch in ${type} chunk`)
    }
    if (type === 'IHDR') {
      if (length !== 13) throw new Error('decodePng: invalid IHDR length')
      width = view.getUint32(offset + 8)
      height = view.getUint32(offset + 12)
      bitDepth = bytes[offset + 16]
      colorType = bytes[offset + 17]
      const compression = bytes[offset + 18]
      const filterMethod = bytes[offset + 19]
      const interlace = bytes[offset + 20]
      if (compression !== 0 || filterMethod !== 0) {
        throw new Error('decodePng: unsupported compression or filter method')
      }
      if (interlace !== 0) throw new Error('decodePng: interlaced (Adam7) PNGs are not supported')
      sawHeader = true
    } else if (type === 'PLTE') {
      palette = bytes.subarray(offset + 8, dataEnd)
    } else if (type === 'tRNS') {
      transparency = bytes.subarray(offset + 8, dataEnd)
    } else if (type === 'IDAT') {
      idat.push(bytes.subarray(offset + 8, dataEnd))
    } else if (type === 'IEND') {
      sawEnd = true
    }
    offset = dataEnd + 4
  }
  if (!sawHeader) throw new Error('decodePng: missing IHDR chunk')
  if (!sawEnd) throw new Error('decodePng: missing IEND chunk (truncated file)')
  if (idat.length === 0) throw new Error('decodePng: missing IDAT chunk')
  if (width <= 0 || height <= 0) throw new Error('decodePng: invalid image dimensions')

  const validDepth =
    colorType === 0
      ? [1, 2, 4, 8, 16].includes(bitDepth)
      : colorType === 2 || colorType === 4 || colorType === 6
        ? bitDepth === 8 || bitDepth === 16
        : colorType === 3
          ? [1, 2, 4, 8].includes(bitDepth)
          : false
  if (!validDepth) throw new Error(`decodePng: unsupported color type ${colorType} with bit depth ${bitDepth}`)
  if (colorType === 3 && !palette) throw new Error('decodePng: palette image without PLTE chunk')

  const channels = colorType === 0 ? 1 : colorType === 2 ? 3 : colorType === 3 ? 1 : colorType === 4 ? 2 : 4
  let raw: Uint8Array
  try {
    raw = await runTransform(new DecompressionStream('deflate'), concatBytes(idat))
  } catch (error) {
    throw new Error('decodePng: invalid compressed data', { cause: error })
  }
  const pixels = unfilter(raw, width, height, channels, bitDepth)
  const maxValue = bitDepth === 16 ? 65535 : (1 << bitDepth) - 1
  const to8 = (value: number): number =>
    bitDepth === 16 ? value >> 8 : bitDepth === 8 ? value : Math.round((value * 255) / maxValue)
  const grayKey = transparency && transparency.length >= 2 ? (transparency[0] << 8) | transparency[1] : -1
  const redKey = transparency && transparency.length >= 6 ? (transparency[0] << 8) | transparency[1] : -1
  const greenKey = transparency && transparency.length >= 6 ? (transparency[2] << 8) | transparency[3] : -1
  const blueKey = transparency && transparency.length >= 6 ? (transparency[4] << 8) | transparency[5] : -1
  const data = new Uint8ClampedArray(width * height * 4)
  const rowBytes = Math.ceil((width * channels * bitDepth) / 8)
  for (let y = 0; y < height; y++) {
    const row = pixels.subarray(y * rowBytes, (y + 1) * rowBytes)
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      switch (colorType) {
        case 0: {
          const value = sampleValue(row, x, bitDepth)
          const gray = to8(value)
          data[index] = gray
          data[index + 1] = gray
          data[index + 2] = gray
          data[index + 3] = value === grayKey ? 0 : 255
          break
        }
        case 2: {
          const red = sampleValue(row, x * 3, bitDepth)
          const green = sampleValue(row, x * 3 + 1, bitDepth)
          const blue = sampleValue(row, x * 3 + 2, bitDepth)
          data[index] = to8(red)
          data[index + 1] = to8(green)
          data[index + 2] = to8(blue)
          data[index + 3] = red === redKey && green === greenKey && blue === blueKey ? 0 : 255
          break
        }
        case 3: {
          const paletteIndex = sampleValue(row, x, bitDepth)
          const entry = paletteIndex * 3
          if (!palette || entry + 2 >= palette.length) throw new Error('decodePng: palette index out of range')
          data[index] = palette[entry]
          data[index + 1] = palette[entry + 1]
          data[index + 2] = palette[entry + 2]
          data[index + 3] = transparency && paletteIndex < transparency.length ? transparency[paletteIndex] : 255
          break
        }
        case 4: {
          const gray = to8(sampleValue(row, x * 2, bitDepth))
          data[index] = gray
          data[index + 1] = gray
          data[index + 2] = gray
          data[index + 3] = to8(sampleValue(row, x * 2 + 1, bitDepth))
          break
        }
        default: {
          data[index] = to8(sampleValue(row, x * 4, bitDepth))
          data[index + 1] = to8(sampleValue(row, x * 4 + 1, bitDepth))
          data[index + 2] = to8(sampleValue(row, x * 4 + 2, bitDepth))
          data[index + 3] = to8(sampleValue(row, x * 4 + 3, bitDepth))
          break
        }
      }
    }
  }
  return { width, height, data }
}

/* ------------------------------------------------------------- containers */

const DOS_DATE = ((2024 - 1980) << 9) | (1 << 5) | 1

export function buildZip(files: ZipFile[]): Uint8Array {
  if (files.length > 0xffff) throw new Error('buildZip: too many entries')
  const encoder = new TextEncoder()
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0
  for (const file of files) {
    const name = encoder.encode(file.path.replace(/\\/g, '/'))
    const crc = crc32(file.bytes)
    const size = file.bytes.length

    const local = new Uint8Array(30 + name.length)
    const localView = new DataView(local.buffer)
    localView.setUint32(0, 0x04034b50)
    localView.setUint16(4, 20)
    localView.setUint16(6, 0x0800)
    localView.setUint16(8, 0)
    localView.setUint16(10, 0)
    localView.setUint16(12, DOS_DATE)
    localView.setUint32(14, crc)
    localView.setUint32(18, size)
    localView.setUint32(22, size)
    localView.setUint16(26, name.length)
    localView.setUint16(28, 0)
    local.set(name, 30)
    locals.push(local, file.bytes)

    const central = new Uint8Array(46 + name.length)
    const centralView = new DataView(central.buffer)
    centralView.setUint32(0, 0x02014b50)
    centralView.setUint16(4, 20)
    centralView.setUint16(6, 20)
    centralView.setUint16(8, 0x0800)
    centralView.setUint16(10, 0)
    centralView.setUint16(12, 0)
    centralView.setUint16(14, DOS_DATE)
    centralView.setUint32(16, crc)
    centralView.setUint32(20, size)
    centralView.setUint32(24, size)
    centralView.setUint16(28, name.length)
    centralView.setUint16(30, 0)
    centralView.setUint16(32, 0)
    centralView.setUint16(34, 0)
    centralView.setUint16(36, 0)
    centralView.setUint32(38, 0)
    centralView.setUint32(42, offset)
    central.set(name, 46)
    centrals.push(central)

    offset += local.length + size
  }
  const centralBytes = concatBytes(centrals)
  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  endView.setUint32(0, 0x06054b50)
  endView.setUint16(4, 0)
  endView.setUint16(6, 0)
  endView.setUint16(8, files.length)
  endView.setUint16(10, files.length)
  endView.setUint32(12, centralBytes.length)
  endView.setUint32(16, offset)
  endView.setUint16(20, 0)
  return concatBytes([...locals, centralBytes, end])
}

export function buildIco(images: { size: number; png: Uint8Array }[]): Uint8Array {
  const header = new Uint8Array(6 + images.length * 16)
  const view = new DataView(header.buffer)
  view.setUint16(0, 0)
  view.setUint16(2, 1)
  view.setUint16(4, images.length)
  let imageOffset = header.length
  images.forEach((image, index) => {
    const base = 6 + index * 16
    const dimension = image.size >= 256 ? 0 : image.size
    header[base] = dimension
    header[base + 1] = dimension
    header[base + 2] = 0
    header[base + 3] = 0
    view.setUint16(base + 4, 1)
    view.setUint16(base + 6, 32)
    view.setUint32(base + 8, image.png.length)
    view.setUint32(base + 12, imageOffset)
    imageOffset += image.png.length
  })
  return concatBytes([header, ...images.map((image) => image.png)])
}

const ICNS_TYPES: Record<number, string> = {
  16: 'icp4',
  32: 'icp5',
  64: 'icp6',
  128: 'ic07',
  256: 'ic08',
  512: 'ic09',
  1024: 'ic10',
}

export function buildIcns(images: { size: number; png: Uint8Array }[]): Uint8Array {
  const entries: Uint8Array[] = []
  for (const image of images) {
    const type = ICNS_TYPES[image.size]
    if (!type) continue
    const entry = new Uint8Array(8 + image.png.length)
    for (let i = 0; i < 4; i++) entry[i] = type.charCodeAt(i)
    new DataView(entry.buffer).setUint32(4, entry.length)
    entry.set(image.png, 8)
    entries.push(entry)
  }
  const body = concatBytes(entries)
  const out = new Uint8Array(8 + body.length)
  out[0] = 0x69
  out[1] = 0x63
  out[2] = 0x6e
  out[3] = 0x73
  new DataView(out.buffer).setUint32(4, out.length)
  out.set(body, 8)
  return out
}

export function buildWebManifest(
  opts: { name?: string; shortName?: string; themeColor?: string; backgroundColor?: string } = {},
): string {
  const name = opts.name ?? 'App'
  return JSON.stringify(
    {
      name,
      short_name: opts.shortName ?? name,
      icons: [
        { src: 'android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      theme_color: opts.themeColor ?? '#000000',
      background_color: opts.backgroundColor ?? '#ffffff',
      display: 'standalone',
      start_url: '/',
    },
    null,
    2,
  )
}

export function buildIconReadme(opts: { name?: string } = {}): string {
  const name = (opts.name ?? 'App').replace(/[^\x20-\x7e]/g, '').trim() || 'App'
  return [
    `${name.toUpperCase()} - APP ICON EXPORT`,
    '================================',
    '',
    'WEB / PWA',
    '  Copy favicon-*.png, apple-touch-icon.png and android-chrome-*.png',
    '  to your site root, then add to <head>:',
    '    <link rel="icon" href="/favicon-32x32.png" sizes="32x32">',
    '    <link rel="icon" href="/favicon-16x16.png" sizes="16x16">',
    '    <link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '    <link rel="manifest" href="/site.webmanifest">',
    '',
    'XCODE / IOS',
    '  Open Assets.xcassets > AppIcon and drop each icon-<size>.png',
    '  into the matching slot. All iOS icons are opaque.',
    '',
    'ANDROID',
    '  Legacy: res/mipmap-<density>/ic_launcher.png (48 to 192 px).',
    '  Round: ic_launcher_round.png. Adaptive: ic_launcher_foreground.png',
    '  and ic_launcher_background.png in every mipmap density folder.',
    '',
    'MACOS',
    '  Use icon.icns for the app bundle, or drop the PNG sizes into',
    '  Assets.xcassets > AppIcon.',
    '',
    'WINDOWS',
    '  Use icon.ico for the executable, or the Square*Logo.png files',
    '  for Start menu tiles.',
    '',
    'LINUX',
    '  Install PNGs into /usr/share/icons/hicolor/<size>x<size>/apps/.',
    '',
  ].join('\n')
}
