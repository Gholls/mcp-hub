import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createMcpServer } from './server.ts'

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

/**
 * MCP endpoint handler. `/mcp` and `/mcp/sse` both speak Streamable HTTP (the
 * modern, stateless-friendly transport). A fresh server + transport are created
 * per request so it runs anywhere on the edge.
 */
export async function handleMcpRequest(request: Request, appHtml?: string): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const url = new URL(request.url)
  if (url.pathname.endsWith('/health')) {
    return new Response(JSON.stringify({ status: 'ok', server: 'mcp.gholl.com' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }

  const server = createMcpServer(url.origin, appHtml)
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true })

  await server.connect(transport)
  try {
    const response = await transport.handleRequest(request)
    return withCors(response)
  } finally {
    await server.close().catch(() => undefined)
  }
}
