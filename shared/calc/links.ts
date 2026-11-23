/**
 * Normalization for the `link-nav` tool: turns whatever an agent passed into a
 * bounded, display-safe list of sites. Pure and DOM-free so the widget and the
 * MCP server share exactly the same rules.
 */

export interface NavSite {
  name: string
  url: string
  description?: string
  /** Emoji, an http(s) image URL, or a `data:image/...` URI. */
  icon?: string
  category?: string
}

export interface NavDirectory {
  title?: string
  subtitle?: string
  sites: NavSite[]
  /** Category labels in first-appearance order (display casing). */
  categories: string[]
  /** Entries that were invalid, duplicated, or beyond the limit. */
  dropped: number
}

export const MAX_NAV_SITES = 120
const MAX_NAME = 80
const MAX_DESCRIPTION = 240
const MAX_TITLE = 80
const MAX_SUBTITLE = 160
const MAX_CATEGORY = 40
const MAX_ICON_URL = 2048
const MAX_ICON_DATA = 60_000
const MAX_GLYPH = 16

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** Accepts bare domains, `//host`, and full URLs; rejects non-http(s) schemes. */
export function normalizeNavUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  let text = raw.trim()
  if (!text) return null
  if (text.startsWith('//')) text = `https:${text}`
  else if (!/^[a-z][a-z\d+.-]*:/i.test(text)) text = `https://${text}`
  let parsed: URL
  try {
    parsed = new URL(text)
  } catch {
    return null
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
  if (!parsed.hostname.includes('.')) return null
  if (parsed.username || parsed.password) return null
  return parsed.toString()
}

/** Hostname for display: lower-case, `www.` stripped, no port. */
export function navSiteHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '')
  } catch {
    return url
  }
}

export function normalizeNavIcon(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const text = raw.trim()
  if (!text) return undefined
  if (/^data:image\/[a-z0-9.+-]+[;,]/i.test(text)) {
    return text.length <= MAX_ICON_DATA ? text : undefined
  }
  if (/^https?:\/\//i.test(text)) return text.length <= MAX_ICON_URL ? text : undefined
  if (text.startsWith('//')) return text.length <= MAX_ICON_URL ? `https:${text}` : undefined
  if (/^[\w.-]+\.[a-z]{2,}(?:[/?#].*)?$/i.test(text) && !/\s/.test(text)) return `https://${text}`
  // Anything else short and whitespace-free is treated as a glyph (emoji).
  return text.length <= MAX_GLYPH && !/\s/.test(text) ? text : undefined
}

function readCategory(value: Record<string, unknown>): string | undefined {
  for (const key of ['category', 'group', 'section', 'tag'] as const) {
    const raw = value[key]
    const text = Array.isArray(raw) ? readText(raw[0]) : readText(raw)
    if (text) return text.slice(0, MAX_CATEGORY)
  }
  return undefined
}

function readSites(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed: unknown = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
      if (parsed && typeof parsed === 'object') {
        const nested = (parsed as { sites?: unknown; links?: unknown }).sites ?? (parsed as { links?: unknown }).links
        if (Array.isArray(nested)) return nested
      }
    } catch {
      return []
    }
  }
  return []
}

function dedupeKey(url: string): string {
  return url.replace(/\/+$/, '')
}

export function normalizeNavSite(value: unknown): NavSite | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const url = normalizeNavUrl(record.url ?? record.href ?? record.link)
  if (!url) return null
  const host = navSiteHost(url)
  const name = (
    readText(record.name) ||
    readText(record.title) ||
    readText(record.label) ||
    host
  ).slice(0, MAX_NAME)
  const description = (
    readText(record.description) ||
    readText(record.desc) ||
    readText(record.note) ||
    readText(record.summary)
  ).slice(0, MAX_DESCRIPTION)
  const icon = normalizeNavIcon(record.icon ?? record.favicon ?? record.logo ?? record.ico)
  const category = readCategory(record)
  return {
    name,
    url,
    ...(description ? { description } : {}),
    ...(icon ? { icon } : {}),
    ...(category ? { category } : {}),
  }
}

export function normalizeNavDirectory(args: Record<string, unknown>): NavDirectory {
  const title = (readText(args.title) || readText(args.heading)).slice(0, MAX_TITLE)
  const subtitle = (readText(args.subtitle) || readText(args.tagline) || readText(args.description)).slice(
    0,
    MAX_SUBTITLE,
  )
  const raw = readSites(args.sites ?? args.links ?? args.items)
  const sites: NavSite[] = []
  const seen = new Set<string>()
  let dropped = 0
  for (const entry of raw) {
    if (sites.length >= MAX_NAV_SITES) {
      dropped++
      continue
    }
    const site = normalizeNavSite(entry)
    if (!site) {
      dropped++
      continue
    }
    const key = dedupeKey(site.url)
    if (seen.has(key)) {
      dropped++
      continue
    }
    seen.add(key)
    sites.push(site)
  }
  const categories: string[] = []
  const seenCategories = new Set<string>()
  for (const site of sites) {
    if (!site.category) continue
    const key = site.category.toLowerCase()
    if (seenCategories.has(key)) continue
    seenCategories.add(key)
    categories.push(site.category)
  }
  return {
    ...(title ? { title } : {}),
    ...(subtitle ? { subtitle } : {}),
    sites,
    categories,
    dropped,
  }
}

export interface NavGroup {
  /** Display label, or `null` for sites without a category. */
  category: string | null
  sites: NavSite[]
}

/** Groups in first-appearance order, with uncategorized sites last. */
export function groupNavSites(sites: NavSite[]): NavGroup[] {
  const groups = new Map<string, NavGroup>()
  for (const site of sites) {
    const key = site.category ? site.category.toLowerCase() : ''
    let group = groups.get(key)
    if (!group) {
      group = { category: site.category ?? null, sites: [] }
      groups.set(key, group)
    }
    group.sites.push(site)
  }
  const ordered = [...groups.values()].filter((group) => group.category !== null)
  const rest = groups.get('')
  if (rest) ordered.push(rest)
  return ordered
}
