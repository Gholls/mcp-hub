import { describe, expect, it } from 'vitest'
import {
  groupNavSites,
  MAX_NAV_SITES,
  navSiteHost,
  normalizeNavDirectory,
  normalizeNavIcon,
  normalizeNavSite,
  normalizeNavUrl,
  type NavSite,
} from '../shared/calc/links.ts'

describe('normalizeNavUrl', () => {
  it('accepts bare domains and protocol-relative URLs', () => {
    expect(normalizeNavUrl('github.com')).toBe('https://github.com/')
    expect(normalizeNavUrl('//example.com/docs')).toBe('https://example.com/docs')
    expect(normalizeNavUrl('http://example.com/a?b=1')).toBe('http://example.com/a?b=1')
  })

  it('rejects dangerous or unusable schemes', () => {
    expect(normalizeNavUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeNavUrl('data:text/html,<script>')).toBeNull()
    expect(normalizeNavUrl('ftp://example.com/file')).toBeNull()
    expect(normalizeNavUrl('localhost:8080')).toBeNull()
    expect(normalizeNavUrl('')).toBeNull()
    expect(normalizeNavUrl('   ')).toBeNull()
    expect(normalizeNavUrl(42)).toBeNull()
  })

  it('rejects URLs carrying credentials', () => {
    expect(normalizeNavUrl('https://user:pass@example.com')).toBeNull()
  })
})

describe('normalizeNavIcon', () => {
  it('keeps emoji, data URIs and image URLs', () => {
    expect(normalizeNavIcon('🐙')).toBe('🐙')
    expect(normalizeNavIcon('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA')
    expect(normalizeNavIcon('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
    expect(normalizeNavIcon('//cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
  })

  it('promotes bare image paths and drops oversized glyphs', () => {
    expect(normalizeNavIcon('github.com/favicon.ico')).toBe('https://github.com/favicon.ico')
    expect(normalizeNavIcon('two words')).toBeUndefined()
    expect(normalizeNavIcon('x'.repeat(20))).toBeUndefined()
    expect(normalizeNavIcon(undefined)).toBeUndefined()
  })
})

describe('normalizeNavSite', () => {
  it('falls back to the host and reads aliases', () => {
    const site = normalizeNavSite({
      href: 'https://www.github.com',
      title: 'GitHub',
      desc: 'Where the world builds software',
      logo: '🐙',
      group: 'Dev',
    })
    expect(site).toEqual({
      name: 'GitHub',
      url: 'https://www.github.com/',
      description: 'Where the world builds software',
      icon: '🐙',
      category: 'Dev',
    })
  })

  it('derives a name from the host when none is supplied', () => {
    expect(normalizeNavSite({ url: 'https://www.example.com/tools' })?.name).toBe('example.com')
  })

  it('rejects entries without a usable URL', () => {
    expect(normalizeNavSite({ name: 'Bad', url: 'javascript:alert(1)' })).toBeNull()
    expect(normalizeNavSite(null)).toBeNull()
  })
})

describe('normalizeNavDirectory', () => {
  it('normalizes a directory and preserves category order', () => {
    const directory = normalizeNavDirectory({
      title: '  My Links  ',
      subtitle: 'Handy sites',
      sites: [
        { name: 'GitHub', url: 'github.com', category: 'Dev' },
        { name: 'MDN', url: 'https://developer.mozilla.org', category: 'Docs' },
        { name: 'News', url: 'news.ycombinator.com', category: 'dev' },
        { name: 'Plain', url: 'example.com' },
      ],
    })
    expect(directory.title).toBe('My Links')
    expect(directory.subtitle).toBe('Handy sites')
    expect(directory.sites).toHaveLength(4)
    expect(directory.categories).toEqual(['Dev', 'Docs'])
    expect(directory.dropped).toBe(0)
  })

  it('deduplicates URLs that differ only by a trailing slash', () => {
    const directory = normalizeNavDirectory({
      sites: [
        { name: 'A', url: 'https://example.com/' },
        { name: 'B', url: 'https://example.com' },
      ],
    })
    expect(directory.sites.map((site) => site.name)).toEqual(['A'])
    expect(directory.dropped).toBe(1)
  })

  it('accepts a JSON string and the `links` alias', () => {
    const directory = normalizeNavDirectory({
      links: JSON.stringify([{ name: 'JSON', url: 'example.com' }]),
    })
    expect(directory.sites[0]?.name).toBe('JSON')
  })

  it('counts invalid entries and caps the list', () => {
    const many = Array.from({ length: MAX_NAV_SITES + 5 }, (_, index) => ({
      name: `Site ${index}`,
      url: `https://site-${index}.example.com`,
    }))
    const directory = normalizeNavDirectory({ sites: [...many, { name: 'Bad' }] })
    expect(directory.sites).toHaveLength(MAX_NAV_SITES)
    expect(directory.dropped).toBe(6)
  })

  it('returns an empty directory when nothing usable was passed', () => {
    const directory = normalizeNavDirectory({})
    expect(directory.sites).toEqual([])
    expect(directory.categories).toEqual([])
    expect(directory.dropped).toBe(0)
  })
})

describe('groupNavSites', () => {
  it('orders categories by first appearance and puts uncategorized last', () => {
    const sites: NavSite[] = [
      { name: 'A', url: 'https://a.example.com', category: 'One' },
      { name: 'B', url: 'https://b.example.com' },
      { name: 'C', url: 'https://c.example.com', category: 'Two' },
      { name: 'D', url: 'https://d.example.com', category: 'one' },
    ]
    const groups = groupNavSites(sites)
    expect(groups.map((group) => group.category)).toEqual(['One', 'Two', null])
    expect(groups[0]?.sites.map((site) => site.name)).toEqual(['A', 'D'])
    expect(groups[2]?.sites.map((site) => site.name)).toEqual(['B'])
  })

  it('returns a single uncategorized group when no category is set', () => {
    const groups = groupNavSites([{ name: 'A', url: 'https://a.example.com' }])
    expect(groups).toHaveLength(1)
    expect(groups[0]?.category).toBeNull()
  })
})

describe('navSiteHost', () => {
  it('strips www and keeps the host', () => {
    expect(navSiteHost('https://www.example.com/a/b')).toBe('example.com')
    expect(navSiteHost('not a url')).toBe('not a url')
  })
})
