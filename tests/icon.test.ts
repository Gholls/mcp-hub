import { describe, expect, it } from 'vitest'
import {
  ICON_PLATFORMS,
  ICON_TARGETS,
  buildIconReadme,
  buildIcns,
  buildIco,
  buildWebManifest,
  buildZip,
  composeIcon,
  decodePng,
  encodePng,
  getIconTarget,
  iconDrawPlan,
  resampleRgba,
  resolveIconTargets,
  type IconTarget,
  type RgbaImage,
} from '../shared/calc/icon.ts'

/* ------------------------------------------------------------------ helpers */

function solid(width: number, height: number, r: number, g: number, b: number, a: number): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = r
    data[i * 4 + 1] = g
    data[i * 4 + 2] = b
    data[i * 4 + 3] = a
  }
  return { width, height, data }
}

function pixel(image: RgbaImage, x: number, y: number): [number, number, number, number] {
  const index = (y * image.width + x) * 4
  return [image.data[index], image.data[index + 1], image.data[index + 2], image.data[index + 3]]
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let value = n
    for (let bit = 0; bit < 8; bit++) {
      value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[n] = value >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

function ihdrChunk(width: number, height: number, bitDepth: number, colorType: number, interlace = 0): Uint8Array {
  const data = new Uint8Array(13)
  const view = new DataView(data.buffer)
  view.setUint32(0, width)
  view.setUint32(4, height)
  data[8] = bitDepth
  data[9] = colorType
  data[10] = 0
  data[11] = 0
  data[12] = interlace
  return pngChunk('IHDR', data)
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new CompressionStream('deflate')
  const reader = stream.readable.getReader()
  const reading = (async () => {
    const chunks: Uint8Array[] = []
    for (;;) {
      const result = await reader.read()
      if (result.done) break
      if (result.value) chunks.push(result.value)
    }
    return concat(chunks)
  })()
  const writer = stream.writable.getWriter()
  await writer.write(bytes)
  await writer.close()
  return reading
}

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

function target(id: string): IconTarget {
  const found = getIconTarget(id)
  if (!found) throw new Error(`missing target ${id}`)
  return found
}

/* ------------------------------------------------------------------ catalog */

describe('catalog', () => {
  it('exposes the six real platforms in order with the expected target counts', () => {
    expect(ICON_PLATFORMS.map((platform) => platform.id)).toEqual([
      'web',
      'ios',
      'macos',
      'android',
      'windows',
      'linux',
    ])
    const counts = new Map(ICON_PLATFORMS.map((platform) => [platform.id, platform.targets.length]))
    expect(counts.get('web')).toBe(7)
    expect(counts.get('ios')).toBe(13)
    expect(counts.get('macos')).toBe(7)
    expect(counts.get('android')).toBe(21)
    expect(counts.get('windows')).toBe(9)
    expect(counts.get('linux')).toBe(8)
    expect(ICON_TARGETS).toHaveLength(65)
  })

  it('has unique ids, non-empty filenames and consistent labels', () => {
    const ids = new Set(ICON_TARGETS.map((item) => item.id))
    expect(ids.size).toBe(ICON_TARGETS.length)
    for (const item of ICON_TARGETS) {
      expect(item.filename.length).toBeGreaterThan(0)
      expect(item.label).toBe(`${item.size}×${item.size}`)
      expect(item.purpose && item.purpose.length > 0).toBe(true)
      expect(getIconTarget(item.id)).toEqual(item)
    }
  })

  it('looks targets up case-insensitively', () => {
    expect(getIconTarget(' WEB-FAVICON-32 ')?.size).toBe(32)
    expect(getIconTarget('nope')).toBeUndefined()
  })
})

/* ------------------------------------------------------------------ resolve */

describe('resolveIconTargets', () => {
  it('defaults to web when nothing is provided', () => {
    const result = resolveIconTargets()
    expect(result.targets.every((item) => item.platform === 'web')).toBe(true)
    expect(result.targets).toHaveLength(7)
    expect(resolveIconTargets({}).targets).toHaveLength(7)
  })

  it('treats "all" and an empty list as every real platform', () => {
    expect(resolveIconTargets({ platforms: 'all' }).targets).toHaveLength(65)
    expect(resolveIconTargets({ platforms: [] }).targets).toHaveLength(65)
    expect(resolveIconTargets({ platforms: '' }).targets).toHaveLength(65)
  })

  it('parses comma separated strings with trimming and casing', () => {
    const result = resolveIconTargets({ platforms: ' WEB , iOS ' })
    expect(result.targets).toHaveLength(20)
    expect(result.unknown).toEqual([])
    expect(new Set(result.targets.map((item) => item.platform))).toEqual(new Set(['web', 'ios']))
  })

  it('returns explicit targets in catalog order and ignores other options', () => {
    const result = resolveIconTargets({
      targets: 'ios-120, web-favicon-32',
      platforms: 'macos',
      size: 512,
    })
    expect(result.targets.map((item) => item.id)).toEqual(['web-favicon-32', 'ios-120'])
  })

  it('dedupes target ids and reports unknown tokens', () => {
    const result = resolveIconTargets({ targets: 'web-favicon-32,web-favicon-32,ios-999' })
    expect(result.targets).toHaveLength(1)
    expect(result.unknown).toEqual(['ios-999'])
    const platforms = resolveIconTargets({ platforms: 'web,nope,web' })
    expect(platforms.targets).toHaveLength(7)
    expect(platforms.unknown).toEqual(['nope'])
  })

  it('clamps the size shortcut into a custom target', () => {
    const huge = resolveIconTargets({ size: 5000 })
    expect(huge.targets[0]).toEqual({
      id: 'custom-2048',
      platform: 'custom',
      filename: 'icon-2048.png',
      size: 2048,
      label: '2048×2048',
      purpose: 'Custom size',
    })
    expect(resolveIconTargets({ size: 3 }).targets[0].size).toBe(16)
    expect(resolveIconTargets({ size: '100.4' }).targets[0].size).toBe(100)
    expect(resolveIconTargets({ size: 900 }).targets).toHaveLength(1)
  })

  it('never throws on bad input', () => {
    expect(() => resolveIconTargets({ platforms: 42, targets: null, size: Number.NaN })).not.toThrow()
  })
})

/* --------------------------------------------------------------- draw plans */

describe('iconDrawPlan', () => {
  it('fills the canvas with the default plan', () => {
    const plan = iconDrawPlan(target('web-pwa-192'))
    expect(plan).toEqual({
      size: 192,
      background: null,
      content: { x: 0, y: 0, w: 192, h: 192 },
      radius: 0,
      circle: false,
    })
  })

  it('applies padding and scale about the center', () => {
    const plan = iconDrawPlan({ ...target('web-pwa-192'), scale: 0.5 }, { padding: 10 })
    expect(plan.content).toEqual({ x: 57.6, y: 57.6, w: 76.8, h: 76.8 })
  })

  it('clamps padding to 0..40', () => {
    const padded = iconDrawPlan(target('web-pwa-192'), { padding: 100 })
    expect(padded.content).toEqual({ x: 76.8, y: 76.8, w: 38.4, h: 38.4 })
    const unpadded = iconDrawPlan(target('web-pwa-192'), { padding: -10 })
    expect(unpadded.content).toEqual({ x: 0, y: 0, w: 192, h: 192 })
  })

  it('uses a full radius for circular targets', () => {
    const plan = iconDrawPlan(target('android-round-mdpi'))
    expect(plan.circle).toBe(true)
    expect(plan.radius).toBe(24)
  })

  it('clamps the corner radius percentage at 50', () => {
    const plan = iconDrawPlan({ ...target('web-pwa-192'), radius: 100 })
    expect(plan.radius).toBe(48)
  })

  it('falls back to white for transparent opaque targets', () => {
    expect(iconDrawPlan(target('web-apple-touch'), { background: 'transparent' }).background).toBe('#ffffff')
    expect(iconDrawPlan(target('web-pwa-192'), { background: '  TRANSPARENT ' }).background).toBeNull()
    expect(iconDrawPlan(target('web-pwa-192'), { background: '#123456' }).background).toBe('#123456')
  })

  it('drops content for color-only and non-positive scale targets', () => {
    const colorOnly = iconDrawPlan(target('android-background-mdpi'))
    expect(colorOnly.content).toBeNull()
    expect(colorOnly.background).toBe('#ffffff')
    expect(iconDrawPlan({ ...target('web-pwa-192'), scale: 0 }).content).toBeNull()
  })
})

/* ---------------------------------------------------------------- resampling */

describe('resampleRgba', () => {
  it('averages a 2x2 block down to 1x1', () => {
    const data = new Uint8ClampedArray([
      255, 0, 0, 255,
      0, 255, 0, 255,
      0, 0, 255, 255,
      255, 255, 255, 255,
    ])
    const out = resampleRgba({ width: 2, height: 2, data }, 1, 1)
    expect(out.width).toBe(1)
    expect(out.height).toBe(1)
    expect(Array.from(out.data)).toEqual([128, 128, 128, 255])
  })

  it('keeps color when averaging transparent and opaque pixels', () => {
    const data = new Uint8ClampedArray([
      255, 255, 255, 255,
      0, 0, 0, 0,
      0, 0, 0, 0,
      255, 255, 255, 255,
    ])
    const out = resampleRgba({ width: 2, height: 2, data }, 1, 1)
    const [r, g, b, a] = pixel(out, 0, 0)
    expect([r, g, b]).toEqual([255, 255, 255])
    expect(a).toBe(128)
  })

  it('upscales with bilinear sampling', () => {
    const out = resampleRgba(solid(1, 1, 10, 20, 30, 255), 3, 3)
    expect(out.width).toBe(3)
    expect(out.height).toBe(3)
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        expect(pixel(out, x, y)).toEqual([10, 20, 30, 255])
      }
    }
  })
})

/* ------------------------------------------------------------------ compose */

describe('composeIcon', () => {
  it('produces a square image at the target size', () => {
    const out = composeIcon(solid(1, 1, 0, 0, 255, 255), target('web-favicon-32'))
    expect(out.width).toBe(32)
    expect(out.height).toBe(32)
    expect(out.data.length).toBe(32 * 32 * 4)
    expect(pixel(out, 16, 16)).toEqual([0, 0, 255, 255])
  })

  it('letterboxes with contain and leaves the background visible', () => {
    const out = composeIcon(solid(4, 2, 0, 0, 255, 255), target('web-favicon-32'), { background: '#00ff00' })
    expect(pixel(out, 16, 4)).toEqual([0, 255, 0, 255])
    expect(pixel(out, 16, 16)).toEqual([0, 0, 255, 255])
  })

  it('crops with cover so the content fills the canvas', () => {
    const out = composeIcon(solid(4, 2, 0, 0, 255, 255), target('web-favicon-32'), {
      background: '#00ff00',
      fit: 'cover',
    })
    expect(pixel(out, 0, 0)).toEqual([0, 0, 255, 255])
    expect(pixel(out, 31, 31)).toEqual([0, 0, 255, 255])
  })

  it('clips circular targets so the corners stay transparent', () => {
    const out = composeIcon(solid(2, 2, 255, 0, 0, 255), target('android-round-mdpi'))
    expect(pixel(out, 0, 0)[3]).toBe(0)
    expect(pixel(out, 47, 47)[3]).toBe(0)
    expect(pixel(out, 24, 24)).toEqual([255, 0, 0, 255])
  })

  it('keeps opaque targets fully opaque', () => {
    const out = composeIcon(solid(2, 2, 10, 20, 30, 255), target('web-apple-touch'))
    for (const [x, y] of [[0, 0], [179, 0], [0, 179], [179, 179], [90, 90]]) {
      expect(pixel(out, x, y)[3]).toBe(255)
    }
  })

  it('paints only the background for color-only targets', () => {
    const out = composeIcon(solid(2, 2, 255, 0, 0, 255), target('android-background-xhdpi'))
    expect(pixel(out, 0, 0)).toEqual([255, 255, 255, 255])
    expect(pixel(out, 108, 108)).toEqual([255, 255, 255, 255])
  })

  it('leaves the canvas empty when scale is zero', () => {
    const out = composeIcon(solid(2, 2, 255, 0, 0, 255), { ...target('web-favicon-32'), scale: 0 })
    expect(Array.from(out.data).every((value) => value === 0)).toBe(true)
  })
})

/* ---------------------------------------------------------------------- png */

describe('png codec', () => {
  it('round-trips arbitrary RGBA pixels', async () => {
    const original: RgbaImage = {
      width: 3,
      height: 2,
      data: new Uint8ClampedArray([
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        200, 100, 50, 255,
        0, 0, 0, 0,
        255, 255, 255, 128,
      ]),
    }
    const encoded = await encodePng(original)
    expect(Array.from(encoded.subarray(0, 8))).toEqual(Array.from(PNG_SIGNATURE))
    const decoded = await decodePng(encoded)
    expect(decoded.width).toBe(3)
    expect(decoded.height).toBe(2)
    expect(Array.from(decoded.data)).toEqual(Array.from(original.data))
  })

  it('decodes a palette PNG with tRNS', async () => {
    const raw = new Uint8Array([0, 0, 1, 0, 1, 0])
    const png = concat([
      PNG_SIGNATURE,
      ihdrChunk(2, 2, 8, 3),
      pngChunk('PLTE', new Uint8Array([255, 0, 0, 0, 255, 0])),
      pngChunk('tRNS', new Uint8Array([0, 255])),
      pngChunk('IDAT', await deflate(raw)),
      pngChunk('IEND', new Uint8Array(0)),
    ])
    const decoded = await decodePng(png)
    expect(pixel(decoded, 0, 0)).toEqual([255, 0, 0, 0])
    expect(pixel(decoded, 1, 0)).toEqual([0, 255, 0, 255])
    expect(pixel(decoded, 0, 1)).toEqual([0, 255, 0, 255])
    expect(pixel(decoded, 1, 1)).toEqual([255, 0, 0, 0])
  })

  it('decodes 16-bit RGBA with a non-zero filter and takes the high byte', async () => {
    const pixelBytes = new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88])
    const raw = concat([
      new Uint8Array([0]),
      pixelBytes,
      new Uint8Array([2]),
      new Uint8Array(8),
    ])
    const png = concat([
      PNG_SIGNATURE,
      ihdrChunk(1, 2, 16, 6),
      pngChunk('IDAT', await deflate(raw)),
      pngChunk('IEND', new Uint8Array(0)),
    ])
    const decoded = await decodePng(png)
    expect(pixel(decoded, 0, 0)).toEqual([0x11, 0x33, 0x55, 0x77])
    expect(pixel(decoded, 0, 1)).toEqual([0x11, 0x33, 0x55, 0x77])
  })

  it('rejects interlaced images and bad signatures', async () => {
    const interlaced = concat([PNG_SIGNATURE, ihdrChunk(1, 1, 8, 6, 1), pngChunk('IEND', new Uint8Array(0))])
    await expect(decodePng(interlaced)).rejects.toThrow(/interlaced/i)
    await expect(decodePng(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).rejects.toThrow(/signature/i)
  })
})

/* ---------------------------------------------------------------------- zip */

describe('buildZip', () => {
  const files = [
    { path: 'a.txt', bytes: new TextEncoder().encode('hello') },
    { path: 'dir\\b.bin', bytes: new Uint8Array([1, 2, 3, 4]) },
  ]

  it('writes stored entries with a readable central directory', () => {
    const zip = buildZip(files)
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength)
    const eocd = zip.length - 22
    expect(view.getUint32(eocd)).toBe(0x06054b50)
    expect(view.getUint16(eocd + 10)).toBe(files.length)
    const centralSize = view.getUint32(eocd + 12)
    const centralOffset = view.getUint32(eocd + 16)
    expect(centralOffset + centralSize).toBe(eocd)

    let pointer = centralOffset
    const names = ['a.txt', 'dir/b.bin']
    files.forEach((file, index) => {
      expect(view.getUint32(pointer)).toBe(0x02014b50)
      expect(view.getUint16(pointer + 8)).toBe(0x0800)
      expect(view.getUint16(pointer + 10)).toBe(0)
      expect(view.getUint32(pointer + 16)).toBe(crc32(file.bytes))
      expect(view.getUint32(pointer + 20)).toBe(file.bytes.length)
      expect(view.getUint32(pointer + 24)).toBe(file.bytes.length)
      const nameLength = view.getUint16(pointer + 28)
      const localOffset = view.getUint32(pointer + 42)
      expect(new TextDecoder().decode(zip.subarray(pointer + 46, pointer + 46 + nameLength))).toBe(names[index])

      expect(view.getUint32(localOffset)).toBe(0x04034b50)
      expect(view.getUint16(localOffset + 6)).toBe(0x0800)
      expect(view.getUint16(localOffset + 8)).toBe(0)
      const dataStart = localOffset + 30 + view.getUint16(localOffset + 26)
      expect(Array.from(zip.subarray(dataStart, dataStart + file.bytes.length))).toEqual(Array.from(file.bytes))
      pointer += 46 + nameLength
    })
  })

  it('accepts more than one hundred entries', () => {
    const many = Array.from({ length: 120 }, (_value, index) => ({
      path: `f${index}.txt`,
      bytes: new Uint8Array([index & 0xff]),
    }))
    const zip = buildZip(many)
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength)
    expect(view.getUint16(zip.length - 12)).toBe(120)
  })
})

/* ------------------------------------------------------------------ icns/ico */

describe('buildIco', () => {
  it('writes the icon directory with embedded PNG payloads', () => {
    const payloads = [16, 32, 256].map((size) => new Uint8Array([...PNG_SIGNATURE, size & 0xff]))
    const ico = buildIco([{ size: 16, png: payloads[0] }, { size: 32, png: payloads[1] }, { size: 256, png: payloads[2] }])
    const view = new DataView(ico.buffer, ico.byteOffset, ico.byteLength)
    expect(view.getUint16(0)).toBe(0)
    expect(view.getUint16(2)).toBe(1)
    expect(view.getUint16(4)).toBe(3)

    const expectedOffsets = [54, 54 + payloads[0].length, 54 + payloads[0].length + payloads[1].length]
    for (let index = 0; index < 3; index++) {
      const base = 6 + index * 16
      const size = index === 2 ? 0 : [16, 32][index]
      expect(ico[base]).toBe(size)
      expect(ico[base + 1]).toBe(size)
      expect(view.getUint16(base + 4)).toBe(1)
      expect(view.getUint16(base + 6)).toBe(32)
      expect(view.getUint32(base + 8)).toBe(payloads[index].length)
      expect(view.getUint32(base + 12)).toBe(expectedOffsets[index])
      expect(Array.from(ico.subarray(expectedOffsets[index], expectedOffsets[index] + 8))).toEqual(Array.from(PNG_SIGNATURE))
    }
  })
})

describe('buildIcns', () => {
  it('writes icns entries in the documented order and skips unsupported sizes', () => {
    const sizes = [16, 32, 64, 128, 256, 512, 1024, 48]
    const icns = buildIcns(sizes.map((size) => ({ size, png: new Uint8Array([1, 2, 3, size & 0xff]) })))
    expect(new TextDecoder().decode(icns.subarray(0, 4))).toBe('icns')
    const view = new DataView(icns.buffer, icns.byteOffset, icns.byteLength)
    expect(view.getUint32(4)).toBe(icns.length)

    const types: string[] = []
    let offset = 8
    while (offset < icns.length) {
      const type = String.fromCharCode(icns[offset], icns[offset + 1], icns[offset + 2], icns[offset + 3])
      const length = view.getUint32(offset + 4)
      types.push(type)
      expect(length).toBe(8 + 4)
      offset += length
    }
    expect(offset).toBe(icns.length)
    expect(types).toEqual(['icp4', 'icp5', 'icp6', 'ic07', 'ic08', 'ic09', 'ic10'])
  })
})

/* ------------------------------------------------------------------- assets */

interface ManifestShape {
  name: string
  short_name: string
  icons: { src: string; sizes: string; type: string; purpose?: string }[]
  theme_color: string
  background_color: string
  display: string
  start_url: string
}

describe('text assets', () => {
  it('builds a valid web manifest', () => {
    const manifest = JSON.parse(
      buildWebManifest({ name: 'Hub', shortName: 'H', themeColor: '#111111', backgroundColor: '#222222' }),
    ) as ManifestShape
    expect(manifest.name).toBe('Hub')
    expect(manifest.short_name).toBe('H')
    expect(manifest.theme_color).toBe('#111111')
    expect(manifest.background_color).toBe('#222222')
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/')
    expect(manifest.icons).toHaveLength(3)
    expect(manifest.icons.map((icon) => icon.src)).toEqual([
      'android-chrome-192x192.png',
      'android-chrome-512x512.png',
      'maskable-512x512.png',
    ])
    expect(manifest.icons[2].purpose).toBe('maskable')
  })

  it('builds a short ASCII readme', () => {
    const readme = buildIconReadme({ name: 'Hub' })
    const isAscii = Array.from(readme).every((char) => {
      const code = char.charCodeAt(0)
      return code === 9 || code === 10 || (code >= 0x20 && code <= 0x7e)
    })
    expect(isAscii).toBe(true)
    expect(readme).toContain('XCODE')
    expect(readme).toContain('ANDROID')
    expect(readme.split('\n').length).toBeLessThanOrEqual(32)
    expect(readme.split('\n').length).toBeGreaterThanOrEqual(20)
  })
})
