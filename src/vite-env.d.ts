/// <reference types="vite/client" />

interface GhollBootstrap {
  widgetId?: string
  params?: Record<string, unknown>
  locale?: 'en' | 'zh'
}

interface Window {
  /** Injected into the HTML when a widget is inlined as an MCP Apps resource. */
  __GHOLL__?: GhollBootstrap
}
