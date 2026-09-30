import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { TOOLS } from './shared/tools.ts'
import { SITE_ORIGIN } from './shared/types.ts'

/**
 * Emits machine-readable discovery documents straight from the shared tool
 * registry so SEO/GEO surfaces never drift from the code.
 */
function discoveryPlugin(): Plugin {
  return {
    name: 'gholl-discovery',
    apply: 'build',
    generateBundle() {
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

      const discovery = {
        name: 'mcp.gholl.com',
        description:
          'Interactive micro-tools for humans and AI agents. Each tool renders a sandboxed UI card.',
        version: '0.1.0',
        homepage: SITE_ORIGIN,
        protocol: 'mcp',
        protocolVersion: '2025-06-18',
        transport: 'streamable-http',
        endpoint: `${SITE_ORIGIN}/mcp`,
        mimeType: 'text/html;profile=mcp-app',
        tools,
      }

      const llmsTxt = [
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

      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...['/', ...TOOLS.map((t) => t.pagePath)].map(
          (path) => `  <url><loc>${SITE_ORIGIN}${path}</loc></url>`,
        ),
        '</urlset>',
        '',
      ].join('\n')

      const robots = ['User-agent: *', 'Allow: /', '', `Sitemap: ${SITE_ORIGIN}/sitemap.xml`, ''].join('\n')

      this.emitFile({
        type: 'asset',
        fileName: '.well-known/mcp.json',
        source: JSON.stringify(discovery, null, 2),
      })
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), discoveryPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  build: {
    target: 'esnext',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 2000,
  },
})
