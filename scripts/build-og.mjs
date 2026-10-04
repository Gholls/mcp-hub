import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Generates 1200x630 Open Graph share images (PNG) for the site and each tool.
 * Uses `sharp` (optional): if it is unavailable the build still succeeds.
 */
const root = fileURLToPath(new URL('..', import.meta.url))
const outDir = resolve(root, 'dist/og')
const WIDTH = 1200
const HEIGHT = 630

const TOOLS = JSON.parse(readFileSync(resolve(root, '.embed/tools.json'), 'utf8'))

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

function wrap(text, maxChars, maxLines) {
  const words = String(text).split(/\s+/)
  const lines = []
  let line = ''
  for (const word of words) {
    if ((line + ' ' + word).trim().length > maxChars) {
      lines.push(line.trim())
      line = word
      if (lines.length === maxLines) break
    } else {
      line = `${line} ${word}`
    }
  }
  if (lines.length < maxLines && line.trim()) lines.push(line.trim())
  return lines
}

function svg({ kicker, title, description, footer }) {
  const titleLines = wrap(title, 22, 3)
  const descLines = wrap(description, 62, 3)
  const titleParts = titleLines
    .map((l, i) => `<text x="88" y="${250 + i * 78}" class="title">${esc(l)}</text>`)
    .join('')
  const descTop = 250 + titleLines.length * 78 + 6
  const descParts = descLines
    .map((l, i) => `<text x="88" y="${descTop + i * 40}" class="desc">${esc(l)}</text>`)
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="-10%" r="80%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="#070a12" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#070a12"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
  <rect x="0" y="0" width="${WIDTH}" height="8" fill="url(#bar)"/>
  <circle cx="108" cy="120" r="28" fill="url(#bar)"/>
  <text x="108" y="134" text-anchor="middle" class="logo">M</text>
  <text x="156" y="130" class="brand">mcp.gholl.com</text>
  <text x="88" y="196" class="kicker">${esc(kicker)}</text>
  ${titleParts}
  ${descParts}
  <text x="88" y="${HEIGHT - 56}" class="footer">${esc(footer)}</text>
  <text x="${WIDTH - 88}" y="${HEIGHT - 56}" text-anchor="end" class="footer">Model Context Protocol</text>
  <style>
    .logo { font-family: 'DejaVu Sans', 'Helvetica', sans-serif; font-size: 32px; font-weight: bold; fill: #070a12; }
    .brand { font-family: 'DejaVu Sans', 'Helvetica', sans-serif; font-size: 30px; font-weight: 600; fill: #e5e7eb; }
    .kicker { font-family: 'DejaVu Sans', 'Helvetica', sans-serif; font-size: 22px; letter-spacing: 3px; text-transform: uppercase; fill: #818cf8; }
    .title { font-family: 'DejaVu Sans', 'Helvetica', sans-serif; font-size: 64px; font-weight: bold; fill: #ffffff; }
    .desc { font-family: 'DejaVu Sans', 'Helvetica', sans-serif; font-size: 27px; fill: #94a3b8; }
    .footer { font-family: 'DejaVu Sans', 'Helvetica', sans-serif; font-size: 22px; fill: #64748b; }
  </style>
</svg>`
}

async function main() {
  let sharp
  try {
    ;({ default: sharp } = await import('sharp'))
  } catch {
    console.warn('  ! sharp unavailable — skipping OG images')
    return
  }

  mkdirSync(outDir, { recursive: true })

  const images = [
    {
      name: 'site',
      svg: svg({
        kicker: 'Interactive micro-tools',
        title: 'Micro-tools for humans & AI agents',
        description:
          'Interactive widgets you can use in the browser or call from your AI agent over the Model Context Protocol.',
        footer: 'https://mcp.gholl.com · MCP Apps',
      }),
    },
    ...TOOLS.map((tool) => ({
      name: tool.id,
      svg: svg({
        kicker: tool.category,
        title: tool.title.en,
        description: tool.description.en,
        footer: `https://mcp.gholl.com/tools/${tool.id}`,
      }),
    })),
  ]

  for (const image of images) {
    const png = await sharp(Buffer.from(image.svg)).png().toBuffer()
    writeFileSync(resolve(outDir, `${image.name}.png`), png)
    console.log(`  ✓ dist/og/${image.name}.png`)
  }
}

await main()
