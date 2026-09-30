import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
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
