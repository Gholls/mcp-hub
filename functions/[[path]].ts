import { buildDiscoveryDocument } from '../shared/mcp/discovery.ts'

/**
 * SPA fallback. Static assets and the more specific `functions/mcp/*` routes
 * always win; this only runs for client-side routes like `/tools/:id` or
 * `/embed/:id` that have no matching file, serving the single-page shell.
 *
 * Replaces a `_redirects` rule, which Cloudflare's validator rejects with an
 * "infinite loop" error when the destination is `/index.html`.
 */
interface Env {
  ASSETS: Fetcher
}

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300',
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  const url = new URL(request.url)

  // Serve the discovery document from code so it never depends on how the
  // runtime treats dot-directories in static assets.
  if (url.pathname === '/.well-known/mcp.json') {
    return new Response(JSON.stringify(buildDiscoveryDocument(), null, 2), { headers: JSON_HEADERS })
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return context.next()
  }

  const asset = await env.ASSETS.fetch(request)
  if (asset.status !== 404 && asset.status !== 500) {
    return asset
  }

  const shellUrl = new URL('/index.html', request.url)
  const shell = await env.ASSETS.fetch(new Request(shellUrl, request))
  return new Response(shell.body, {
    status: 200,
    headers: shell.headers,
  })
}
