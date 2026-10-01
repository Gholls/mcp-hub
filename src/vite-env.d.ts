/// <reference types="vite/client" />

/** Replaced at build time by `scripts/build-embeds.mjs` for per-widget bundles. */
declare const __GHOLL_WIDGET_ID__: string

/** Aliased per widget by `scripts/build-embeds.mjs`. */
declare module 'virtual:gholl-widget' {
  import type { WidgetComponent } from './widgets/registry.ts'
  const Widget: WidgetComponent
  export default Widget
}
