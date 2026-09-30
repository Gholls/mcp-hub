import { handleMcpRequest } from '../shared/mcp/handler.ts'
import { buildDiscoveryDocument } from '../shared/mcp/discovery.ts'

interface Env {
  ASSETS: Fetcher
}

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300',
}

/**
 * Cloudflare Worker entrypoint for mcp.gholl.com.
 *
 * Static assets (the Vite build in `./dist`) are served by the `ASSETS`
 * binding; this worker only handles the dynamic routes:
 *   - `/mcp` and `/mcp/sse` → MCP Streamable HTTP
 *   - `/.well-known/mcp.json` → agent discovery document
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp/')) {
      return handleMcpRequest(request)
    }

    if (url.pathname === '/.well-known/mcp.json') {
      return new Response(JSON.stringify(buildDiscoveryDocument(), null, 2), { headers: JSON_HEADERS })
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return env.ASSETS.fetch(request)
    }

    const asset = await env.ASSETS.fetch(request)
    if (asset.status !== 404) return asset

    // SPA fallback for client-side routes (/tools/:id, /embed/:id, ...).
    const shellUrl = new URL('/index.html', request.url)
    const shell = await env.ASSETS.fetch(new Request(shellUrl, request))
    return new Response(shell.body, { status: 200, headers: shell.headers })
  },
} satisfies ExportedHandler<Env>
