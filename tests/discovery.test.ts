import { describe, expect, it } from 'vitest'
import {
  buildDiscoveryDocument,
  buildLlmsTxt,
  buildRobots,
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
})
