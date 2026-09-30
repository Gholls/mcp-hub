import { useCallback, useEffect, useRef, useState } from 'react'
import { App } from '@modelcontextprotocol/ext-apps'
import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export interface McpAppBridge {
  /** True once the ext-apps `ui/initialize` handshake with the host completed. */
  connected: boolean
  /** True when the page is running inside an iframe (an MCP host or the site). */
  embedded: boolean
  hostContext?: McpUiHostContext
  /** Arguments the host passed to the tool call that produced this view. */
  toolInput?: Record<string, unknown>
  /** Call a tool exposed by the MCP server through the host. */
  callTool: (name: string, args: Record<string, unknown>) => Promise<CallToolResult>
  /** Send a user-visible message back to the conversation. */
  sendMessage: (text: string) => Promise<void>
  /** Ask the host to open a URL in the user's browser. */
  openLink: (url: string) => Promise<void>
}

function isEmbedded(): boolean {
  try {
    return window.parent !== window
  } catch {
    return true
  }
}

/**
 * Bridges a widget to an MCP Apps host over `postMessage` using the ext-apps
 * protocol. Outside a host (e.g. the standalone `/embed/:id` page or the site's
 * own playground) the bridge stays inert so widgets remain usable directly.
 */
export function useMcpApp(): McpAppBridge {
  const appRef = useRef<App | null>(null)
  const [connected, setConnected] = useState(false)
  const [hostContext, setHostContext] = useState<McpUiHostContext>()
  const [toolInput, setToolInput] = useState<Record<string, unknown>>()
  const [embedded] = useState(isEmbedded)

  useEffect(() => {
    if (!embedded) return

    const app = new App(
      { name: 'mcp.gholl.com', version: '0.1.0' },
      {},
      { autoResize: true },
    )
    appRef.current = app

    app.addEventListener('toolinput', (params) => {
      setToolInput(params.arguments as Record<string, unknown>)
    })
    app.addEventListener('hostcontextchanged', (params) => {
      setHostContext((prev) => ({ ...prev, ...params }))
    })

    let cancelled = false
    app
      .connect()
      .then(() => {
        if (cancelled) return
        setConnected(true)
        setHostContext(app.getHostContext())
        const initial = app.getHostContext()?.toolInfo
        if (initial && 'arguments' in initial) {
          const args = (initial as { arguments?: Record<string, unknown> }).arguments
          if (args) setToolInput(args)
        }
      })
      .catch(() => {
        /* Not running inside a compatible host — ignore. */
      })

    return () => {
      cancelled = true
      appRef.current = null
      void app.close?.().catch(() => {})
    }
  }, [embedded])

  const callTool = useCallback<McpAppBridge['callTool']>(async (name, args) => {
    const app = appRef.current
    if (!app) throw new Error('Not connected to an MCP host')
    return app.callServerTool({ name, arguments: args })
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const app = appRef.current
    if (!app) return
    await app.sendMessage({ role: 'user', content: [{ type: 'text', text }] })
  }, [])

  const openLink = useCallback(async (url: string) => {
    const app = appRef.current
    if (!app) {
      window.open(url, '_blank', 'noopener')
      return
    }
    await app.openLink({ url })
  }, [])

  return { connected, embedded, hostContext, toolInput, callTool, sendMessage, openLink }
}
