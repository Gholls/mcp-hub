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
  const params = (schema: { properties?: Record<string, unknown>; required?: string[] }) =>
    Object.entries(schema.properties ?? {})
      .map(([name, raw]) => {
        const prop = raw as { type?: string; enum?: unknown[]; description?: string }
        const required = schema.required?.includes(name) ? ', required' : ''
        const type = Array.isArray(prop.enum) ? prop.enum.join('|') : (prop.type ?? 'any')
        return `${name} (${type}${required})`
      })
      .join(', ')

  return [
    '# mcp.gholl.com',
    '',
    '> Interactive micro-tools for humans and AI agents. Every tool renders a sandboxed UI card inside MCP-compatible clients and works standalone in the browser.',
    '',
    '## Key facts',
    '',
    `- ${tools.length} free micro-tools. No login, no API key.`,
    `- MCP server (Streamable HTTP / JSON-RPC): ${SITE_ORIGIN}/mcp`,
    `- Discovery document: ${SITE_ORIGIN}/.well-known/mcp.json`,
    '- UI delivered as MCP Apps resources (`text/html;profile=mcp-app`) via `resources/read`.',
    `- Source code: https://github.com/Gholls/mcp-hub`,
    '',
    '## MCP server',
    '',
    '- Transport: Streamable HTTP (stateless). Add the URL above to any MCP client.',
    '- Tool results include a text summary plus `structuredContent`.',
    '- Host implementation checklist: https://github.com/Gholls/mcp-hub/blob/main/docs/host-integration.md',
    '',
    '## Tools',
    '',
    ...tools.flatMap((tool) => [
      `### ${tool.title}`,
      `- id: \`${tool.name}\``,
      `- category: ${tool.category}`,
      `- page: ${tool.ui.pageUrl}`,
      `- embed: ${tool.ui.embedUrl}`,
      `- description: ${tool.description}`,
      `- parameters: ${params(tool.inputSchema)}`,
      '',
    ]),
  ].join('\n')
}

export function buildSitemap(): string {
  const lastmod = new Date().toISOString().slice(0, 10)
  const categories = [...new Set(TOOLS.map((t) => t.category))].map(
    (category) => `/${category.toLowerCase()}`,
  )
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...new Set(['/', ...categories, ...TOOLS.map((t) => t.pagePath)])].map(
      (path) => `  <url><loc>${SITE_ORIGIN}${path}</loc><lastmod>${lastmod}</lastmod></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n')
}

export function buildRobots(): string {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    '# AI search & answer engines: allow indexing, citation and on-demand fetches.',
    '# A CDN-injected managed robots.txt (e.g. Cloudflare Content Signals) can still',
    '# override these rules — disable it in the dashboard so these directives win.',
    ...[
      'OAI-SearchBot',
      'ChatGPT-User',
      'GPTBot',
      'Claude-SearchBot',
      'Claude-User',
      'ClaudeBot',
      'anthropic-ai',
      'PerplexityBot',
      'Perplexity-User',
      'Googlebot',
      'Google-Extended',
      'Bingbot',
    ].flatMap((agent) => [`User-agent: ${agent}`, 'Allow: /']),
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n')
}
