import { handleMcpRequest } from '../shared/mcp/handler.ts'
import { buildDiscoveryDocument, buildSecurityTxt } from '../shared/mcp/discovery.ts'
import type { AppHtmlResolver } from '../shared/mcp/server.ts'

interface Env {
  ASSETS: Fetcher
}

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300',
}

const EMBED_PATH = /^\/embed\/([a-z0-9-]+)\/?$/

// Glama connector-claim document (served statically; same dot-directory
// rationale as /.well-known/mcp.json — see vite.config.ts).
const GLAMA_CLAIM = JSON.stringify(
  {
    $schema: 'https://glama.ai/mcp/schemas/connector.json',
    claim: 'glama_claim__0FvHtZ-Avdk0QruMWt6Yo-el8ChWOzR',
  },
  null,
  2,
)
const TOOL_PATH = /^\/tools\/([a-z0-9-]+)\/?$/
const CATEGORY_PATH = /^\/([a-z][a-z0-9-]*)\/?$/

/**
 * Cloudflare Worker entrypoint for mcp.gholl.com.
 *
 * Static assets (the Vite build in `./dist`) are served by the `ASSETS`
 * binding; this worker handles the dynamic routes:
 *   - `/mcp` and `/mcp/sse` → MCP Streamable HTTP
 *   - `/.well-known/mcp.json` → agent discovery document
 *   - `/.well-known/glama.json` → Glama connector claim document
 *   - `/.well-known/security.txt` → RFC 9116 vulnerability-reporting channel
 *   - `/embed/:id` → pre-built, single-widget HTML (also used by MCP resources)
 *   - `/tools/:id` → prerendered, crawler-visible landing page (SPA-enhanced)
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/.well-known/mcp.json') {
      return new Response(JSON.stringify(buildDiscoveryDocument(), null, 2), { headers: JSON_HEADERS })
    }

    if (url.pathname === '/.well-known/glama.json') {
      return new Response(GLAMA_CLAIM, { headers: JSON_HEADERS })
    }

    if (url.pathname === '/.well-known/security.txt') {
      return new Response(buildSecurityTxt(), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // Per-widget single-file build; falls back to the SPA shell if missing.
    const embed = EMBED_PATH.exec(url.pathname)
    if (embed) {
      const appUrl = new URL(`/app/${embed[1]}/index.html`, request.url)
      appUrl.search = url.search
      const asset = await env.ASSETS.fetch(new Request(appUrl, request))
      if (asset.status !== 404) return asset
    }

    // Prerendered tool landing page (full content for non-JS crawlers).
    const tool = TOOL_PATH.exec(url.pathname)
    if (tool && (request.method === 'GET' || request.method === 'HEAD')) {
      const page = await env.ASSETS.fetch(
        new Request(new URL(`/tools/${tool[1]}/index.html`, request.url)),
      )
      if (page.status !== 404) return page
    }

    if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp/')) {
      const cache = new Map<string, string>()
      const resolveAppHtml: AppHtmlResolver = async (toolId) => {
        const cached = cache.get(toolId)
        if (cached !== undefined) return cached || undefined
        const asset = await env.ASSETS.fetch(
          new Request(new URL(`/app/${toolId}/index.html`, request.url)),
        )
        const html = asset.ok ? await asset.text() : ''
        cache.set(toolId, html)
        return html || undefined
      }
      return handleMcpRequest(request, resolveAppHtml)
    }

    // Prerendered category landing page (/math, /developer, ...).
    const category = CATEGORY_PATH.exec(url.pathname)
    if (category && (request.method === 'GET' || request.method === 'HEAD')) {
      const page = await env.ASSETS.fetch(
        new Request(new URL(`/${category[1]}/index.html`, request.url)),
      )
      if (page.status !== 404) return page
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return env.ASSETS.fetch(request)
    }

    const asset = await env.ASSETS.fetch(request)
    if (asset.status !== 404) return asset

    // SPA fallback for client-side routes (/tools/:id, ...).
    const shellUrl = new URL('/index.html', request.url)
    const shell = await env.ASSETS.fetch(new Request(shellUrl, request))
    return new Response(shell.body, { status: 200, headers: shell.headers })
  },
} satisfies ExportedHandler<Env>
