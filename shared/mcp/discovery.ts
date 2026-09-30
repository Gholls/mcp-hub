import { TOOLS } from '../tools.ts'
import { SITE_ORIGIN } from '../types.ts'

export const RESOURCE_MIME_TYPE = 'text/html;profile=mcp-app'

/** Discovery document served at `/.well-known/mcp.json`. */
export function buildDiscoveryDocument() {
  const tools = TOOLS.map((tool) => ({
    name: tool.id,
    title: tool.name,
    description: tool.mcpDescription,
    category: tool.category,
    tags: tool.tags,
    inputSchema: tool.inputSchema,
    ui: {
      resourceUri: `ui://gholl/${tool.id}`,
      embedUrl: `${SITE_ORIGIN}${tool.embedPath}`,
      pageUrl: `${SITE_ORIGIN}${tool.pagePath}`,
    },
  }))

  return {
    name: 'mcp.gholl.com',
    description:
      'Interactive micro-tools for humans and AI agents. Each tool renders a sandboxed UI card.',
    version: '0.1.0',
    homepage: SITE_ORIGIN,
    protocol: 'mcp',
    protocolVersion: '2025-06-18',
    transport: 'streamable-http',
    endpoint: `${SITE_ORIGIN}/mcp`,
    mimeType: RESOURCE_MIME_TYPE,
    tools,
  }
}

/** Agent-readable index served at `/llms.txt`. */
export function buildLlmsTxt(): string {
  const tools = buildDiscoveryDocument().tools
  return [
    '# mcp.gholl.com',
    '',
    '> Interactive micro-tools for humans and AI agents. Every tool renders a sandboxed UI card inside MCP-compatible clients and works standalone in the browser.',
    '',
    '## MCP server',
    '',
    `- Endpoint (Streamable HTTP): ${SITE_ORIGIN}/mcp`,
    `- Discovery document: ${SITE_ORIGIN}/.well-known/mcp.json`,
    '- Protocol: Model Context Protocol (MCP Apps UI resources)',
    '',
    '## Tools',
    '',
    ...tools.flatMap((tool) => [
      `### ${tool.title}`,
      `- id: \`${tool.name}\``,
      `- page: ${tool.ui.pageUrl}`,
      `- embed: ${tool.ui.embedUrl}`,
      `- description: ${tool.description}`,
      '',
    ]),
  ].join('\n')
}

export function buildSitemap(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...['/', ...TOOLS.map((t) => t.pagePath)].map(
      (path) => `  <url><loc>${SITE_ORIGIN}${path}</loc></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n')
}

export function buildRobots(): string {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${SITE_ORIGIN}/sitemap.xml`, ''].join('\n')
}
