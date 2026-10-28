import { describe, expect, it } from 'vitest'
import {
  buildDiscoveryDocument,
  buildLlmsTxt,
  buildRobots,
  buildSecurityTxt,
  buildSitemap,
} from '../shared/mcp/discovery.ts'
import { TOOLS } from '../shared/tools.ts'

describe('discovery documents', () => {
  it('lists every tool with a ui resource and embed url', () => {
    const doc = buildDiscoveryDocument()
    expect(doc.tools).toHaveLength(TOOLS.length)
    expect(doc.endpoint).toBe('https://mcp.gholl.com/mcp')
    for (const tool of doc.tools) {
      expect(tool.ui.resourceUri).toBe(`ui://gholl/${tool.name}`)
      expect(tool.ui.embedUrl).toBe(`https://mcp.gholl.com/embed/${tool.name}`)
      expect(tool.inputSchema).toBeTruthy()
    }
  })

  it('llms.txt mentions every tool id and endpoint', () => {
    const txt = buildLlmsTxt()
    expect(txt).toContain('https://mcp.gholl.com/mcp')
    for (const tool of TOOLS) {
      expect(txt).toContain(tool.id)
    }
  })

  it('sitemap includes home and every tool page', () => {
    const xml = buildSitemap()
    expect(xml).toContain('<loc>https://mcp.gholl.com/</loc>')
    for (const tool of TOOLS) {
      expect(xml).toContain(`<loc>https://mcp.gholl.com${tool.pagePath}</loc>`)
    }
  })

  it('robots points at the sitemap', () => {
    expect(buildRobots()).toContain('Sitemap: https://mcp.gholl.com/sitemap.xml')
  })

  it('discovery document declares both languages and its directory listing', () => {
    const doc = buildDiscoveryDocument()
    expect(doc.languages).toEqual(['en', 'zh'])
    expect(doc.directoryListings.glama).toContain('glama.ai/mcp/connectors/com.gholl.mcp')
    for (const tool of doc.tools) {
      expect(tool.titleZh).toBeTruthy()
    }
  })

  it('llms.txt carries Chinese names, a category index and a call example', () => {
    const txt = buildLlmsTxt()
    for (const tool of TOOLS) {
      expect(txt).toContain(tool.title.zh)
    }
    for (const category of new Set(TOOLS.map((t) => t.category))) {
      expect(txt).toContain(`- ${category} (`)
    }
    expect(txt).toContain('"method":"tools/call"')
    expect(txt).toContain('Languages: English and Chinese')
  })

  it('security.txt follows RFC 9116 with a live contact channel', () => {
    const txt = buildSecurityTxt(new Date('2026-01-01T00:00:00Z'))
    expect(txt).toContain('Contact: https://github.com/Gholls/mcp-hub/security/advisories/new')
    expect(txt).toContain('Preferred-Languages: en, zh')
    expect(txt).toContain('Expires: 2026-06-30T00:00:00.000Z')
  })

  it.each(['OAI-SearchBot', 'ClaudeBot', 'PerplexityBot'])(
    'robots explicitly allows %s',
    (agent) => {
      expect(buildRobots()).toContain(`User-agent: ${agent}\nAllow: /\n`)
    },
  )
})
