import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { TOOLS } from './shared/tools.ts'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { buildLlmsTxt, buildRobots, buildSitemap } from './shared/mcp/discovery.ts'

/**
 * Emits machine-readable discovery documents straight from the shared tool
 * registry so SEO/GEO surfaces never drift from the code.
 *
 * `/.well-known/mcp.json` is served by the Pages Function fallback instead of a
 * static file (Cloudflare's asset server handles dot-directories inconsistently).
 */
function discoveryPlugin(): Plugin {
  return {
    name: 'gholl-discovery',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: buildLlmsTxt() })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemap() })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobots() })
    },
    closeBundle() {
      // Hand the tool list to the per-widget embed build (scripts/build-embeds.mjs).
      const dir = fileURLToPath(new URL('./.embed', import.meta.url))
      mkdirSync(dir, { recursive: true })
      // Full metadata (serializable) for the per-widget, OG and prerender builds.
      writeFileSync(new URL('./.embed/tools.json', import.meta.url), JSON.stringify(TOOLS, null, 2))
    },
  }
}

export default defineConfig({
  // The main site is code-split (small first paint, lazy widgets); the
  // per-widget `dist/app/<id>` bundles are built separately as single files by
  // `scripts/build-embeds.mjs` for MCP Apps / iframe use.
  plugins: [react(), tailwindcss(), discoveryPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
