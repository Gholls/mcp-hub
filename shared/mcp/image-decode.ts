import { decode as decodeJpeg } from 'jpeg-js'
import { decodePng, type RgbaImage } from '../calc/icon.ts'

export interface DecodedImage {
  image: RgbaImage
  format: 'png' | 'jpeg'
}

/** Reject decompression bombs before decoding. */
const MAX_PIXELS = 16_000_000

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const

function isPng(bytes: Uint8Array): boolean {
  if (bytes.length < PNG_SIGNATURE.length) return false
  return PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
}

function pngDimensions(bytes: Uint8Array): { width: number; height: number } {
  if (bytes.length < 24) throw new Error('Invalid PNG: truncated IHDR header')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return { width: view.getUint32(16), height: view.getUint32(20) }
}

export async function decodeImageBytes(bytes: Uint8Array): Promise<DecodedImage> {
  if (isPng(bytes)) {
    const { width, height } = pngDimensions(bytes)
    if (width * height > MAX_PIXELS) {
      throw new Error(`Image too large: ${width}×${height} exceeds the ${MAX_PIXELS} pixel limit`)
    }
    return { image: await decodePng(bytes), format: 'png' }
  }
  if (isJpeg(bytes)) {
    const decoded = decodeJpeg(bytes, {
      useTArray: true,
      formatAsRGBA: true,
      maxResolutionInMP: 12,
      maxMemoryUsageInMB: 64,
    })
    return {
      image: { width: decoded.width, height: decoded.height, data: new Uint8ClampedArray(decoded.data) },
      format: 'jpeg',
    }
  }
  throw new Error('Unsupported image format: expected PNG or JPEG')
}

export function bytesToBase64(bytes: Uint8Array): string {
  const chunk = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}
