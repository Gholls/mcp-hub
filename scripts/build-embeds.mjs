import { build } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { existsSync, readFileSync, renameSync, writeFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Builds one lightweight, self-contained HTML file per widget into
 * `dist/app/<id>/index.html`. These are served at `/embed/:id` and returned as
 * MCP Apps UI resources, so each card only ships the code it needs.
 *
 * The widget component is injected through the `virtual:gholl-widget` alias so
 * the bundle does not pull in the full registry (all widgets).
 */
const root = fileURLToPath(new URL('..', import.meta.url))
const tools = JSON.parse(readFileSync(resolve(root, '.embed/tools.json'), 'utf8'))

for (const tool of tools) {
  const widgetModule = resolve(root, `.embed/widget-${tool.id}.tsx`)
  writeFileSync(widgetModule, `export { default } from '../src/widgets/${tool.id}/index.tsx'\n`)

  const outDir = resolve(root, `dist/app/${tool.id}`)
  await build({
    configFile: false,
    root,
    logLevel: 'warn',
    publicDir: false,
    define: { __GHOLL_WIDGET_ID__: JSON.stringify(tool.id) },
    plugins: [react(), tailwindcss(), viteSingleFile()],
    resolve: {
      alias: [
        { find: 'virtual:gholl-widget', replacement: widgetModule },
        { find: '@shared', replacement: resolve(root, 'shared') },
        { find: '@', replacement: resolve(root, 'src') },
      ],
    },
    build: {
      outDir,
      emptyOutDir: true,
      target: 'esnext',
      cssCodeSplit: false,
      assetsInlineLimit: 100_000_000,
      rollupOptions: { input: resolve(root, 'embed.html') },
    },
  })

  rmSync(widgetModule, { force: true })

  const built = resolve(outDir, 'embed.html')
  if (existsSync(built)) renameSync(built, resolve(outDir, 'index.html'))
  console.log(`  ✓ dist/app/${tool.id}/index.html`)
}
