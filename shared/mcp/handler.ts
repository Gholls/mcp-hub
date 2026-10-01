import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createMcpServer, type AppHtmlResolver } from './server.ts'
import { buildDiscoveryDocument } from './discovery.ts'
import { TOOLS } from '../tools.ts'

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, Mcp-Session-Id, Accept, Mcp-Protocol-Version, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function json(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

const htmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Friendly page shown when a human opens the endpoint in a browser. */
function landingPage(origin: string): string {
  const endpoint = `${origin}/mcp`
  const config = JSON.stringify({ mcpServers: { gholl: { type: 'http', url: endpoint } } }, null, 2)
  const cli = `claude mcp add --transport http gholl ${endpoint}`
  const toolList = TOOLS.map(
    (tool) =>
      `<li><a href="${origin}${tool.pagePath}">${htmlEscape(tool.title.en)}</a> <span class="muted">· ${htmlEscape(tool.category)}</span></li>`,
  ).join('\n      ')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Connect to the MCP endpoint · mcp.gholl.com</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: radial-gradient(1200px 600px at 50% -10%, rgba(99,102,241,.15), transparent 60%), #070a12;
    color: #e5e7eb; font: 15px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { width: min(720px, 92vw); padding: 36px 0; }
  .badge { display:inline-flex; align-items:center; gap:8px; border:1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.05); border-radius:999px; padding:4px 12px; font-size:12px; color:#cbd5e1; }
  .dot { width:6px; height:6px; border-radius:999px; background:#22d3ee; }
  h1 { font-size:28px; margin:18px 0 6px; color:#fff; }
  h2 { font-size:15px; margin:24px 0 8px; color:#cbd5e1; }
  p { color:#94a3b8; margin:6px 0; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background:rgba(255,255,255,.06); border-radius:6px; padding:2px 6px; color:#a5b4fc; }
  pre { background:#0b0f19; border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:14px 16px; overflow:auto; color:#cbd5e1; font-size:13px; }
  a { color:#818cf8; text-decoration:none; }
  a:hover { color:#a5b4fc; }
  ul { columns: 2; margin:8px 0; padding-left:18px; color:#cbd5e1; }
  li { margin:3px 0; break-inside: avoid; }
  .muted { font-size:12px; color:#64748b; }
</style>
</head>
<body>
<main>
  <span class="badge"><span class="dot"></span> MCP · Streamable HTTP</span>
  <h1>This is an MCP endpoint, not a web page</h1>
  <p>Connect an MCP-capable AI client to <code>${endpoint}</code> — no auth, no keys. Browsers can't call it directly.</p>

  <h2>Claude Code / CLI</h2>
  <pre>${htmlEscape(cli)}</pre>

  <h2>Claude Desktop · Cursor · VS Code · Cline</h2>
  <pre>${htmlEscape(config)}</pre>

  <h2>8 interactive tools</h2>
  <ul>
      ${toolList}
  </ul>

  <p class="muted">
    Discovery: <a href="${origin}/.well-known/mcp.json">/.well-known/mcp.json</a> ·
    Agent index: <a href="${origin}/llms.txt">/llms.txt</a> ·
    Host checklist: <a href="https://github.com/Gholls/mcp-hub/blob/main/docs/host-integration.md">docs/host-integration.md</a> ·
    Site: <a href="${origin}/">${origin}</a>
  </p>
</main>
</body>
</html>`
}

/**
 * MCP endpoint handler. `/mcp` and `/mcp/sse` both speak Streamable HTTP (the
 * modern, stateless-friendly transport). A fresh server + transport are created
 * per request so it runs anywhere on the edge.
 *
 * A browser `GET` (Accept: text/html) gets a friendly info page instead of the
 * protocol-level `406 Not Acceptable`.
 */
export async function handleMcpRequest(
  request: Request,
  resolveAppHtml?: AppHtmlResolver,
): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const url = new URL(request.url)
  if (url.pathname.endsWith('/health')) {
    return json({ status: 'ok', server: 'mcp.gholl.com' })
  }

  const accept = request.headers.get('accept') ?? ''
  const wantsSse = accept.includes('text/event-stream')

  // A plain GET (a browser, or an agent probing the configured URL) is not a
  // JSON-RPC request. Serve the discovery document, or an HTML help page for
  // browsers. `GET` with `Accept: text/event-stream` falls through to the
  // transport (SSE), as the spec requires.
  if (request.method === 'GET' && !wantsSse) {
    const discoveryLink = `<${url.origin}/.well-known/mcp.json>; rel="describedby"`
    const noStore = { 'Cache-Control': 'no-store' }
    if (accept.includes('text/html')) {
      return new Response(landingPage(url.origin), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8', Link: discoveryLink, ...noStore, ...CORS_HEADERS },
      })
    }
    return new Response(JSON.stringify(buildDiscoveryDocument(), null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Link: discoveryLink,
        ...noStore,
        ...CORS_HEADERS,
      },
    })
  }

  const server = createMcpServer(url.origin, resolveAppHtml)
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true })

  await server.connect(transport)
  try {
    const response = await transport.handleRequest(request)
    return withCors(response)
  } finally {
    await server.close().catch(() => undefined)
  }
}
