import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Prerenders crawler-visible HTML for `/` and `/tools/<id>`.
 *
 * The React app is client-rendered, but most AI crawlers (GPTBot, ClaudeBot,
 * PerplexityBot, CCBot) don't run JS. This emits semantic, styled HTML with
 * full content + structured data into `#root`; React replaces it on hydration.
 */
const root = fileURLToPath(new URL('..', import.meta.url))
const ORIGIN = 'https://mcp.gholl.com'
const TOOLS = JSON.parse(readFileSync(resolve(root, '.embed/tools.json'), 'utf8'))
const SOURCE_HTML = readFileSync(resolve(root, 'dist/index.html'), 'utf8')

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const json = (data) => JSON.stringify(data).replace(/</g, '\\u003c')

const assetTags = [
  ...(SOURCE_HTML.match(/<script type="module"[^>]*><\/script>/g) ?? []),
  ...(SOURCE_HTML.match(/<link rel="modulepreload"[^>]*>/g) ?? []),
  ...(SOURCE_HTML.match(/<link rel="stylesheet"[^>]*>/g) ?? []),
].join('\n    ')

const STYLE = `
  .seo { max-width: 860px; margin: 0 auto; padding: 32px 20px 64px; color: #cbd5e1;
    font: 15px/1.65 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
    "PingFang SC", "Microsoft YaHei", sans-serif; }
  .seo a { color: #818cf8; text-decoration: none; }
  .seo a:hover { text-decoration: underline; }
  .seo .brand { display:flex; align-items:center; gap:10px; margin-bottom:24px; color:#fff; font-weight:600; }
  .seo .brand .logo { display:grid; place-items:center; width:34px; height:34px; border-radius:10px;
    background: linear-gradient(135deg,#6366f1,#22d3ee); color:#070a12; font-weight:800; }
  .seo h1 { color:#fff; font-size:30px; line-height:1.2; margin:0 0 10px; }
  .seo h2 { color:#e5e7eb; font-size:17px; margin:32px 0 8px; }
  .seo p { margin:8px 0; }
  .seo .lead { font-size:17px; color:#94a3b8; }
  .seo .tags { display:flex; flex-wrap:wrap; gap:6px; margin:14px 0 0; padding:0; list-style:none; }
  .seo .tags li { background:rgba(255,255,255,.06); border-radius:6px; padding:2px 8px; font-size:12px; color:#94a3b8; }
  .seo table { width:100%; border-collapse:collapse; margin-top:6px; font-size:13px; }
  .seo th, .seo td { text-align:left; padding:8px 10px; border-bottom:1px solid rgba(255,255,255,.08); vertical-align:top; }
  .seo th { color:#94a3b8; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:.04em; }
  .seo code, .seo pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .seo code { background:rgba(255,255,255,.06); border-radius:5px; padding:1px 5px; color:#a5b4fc; font-size:13px; }
  .seo pre { background:#0b0f19; border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:12px 14px; overflow:auto; font-size:12.5px; color:#cbd5e1; }
  .seo .grid { display:grid; gap:10px; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); margin-top:8px; }
  .seo .card { border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:14px; background:rgba(255,255,255,.02); }
  .seo .card h3 { margin:0 0 4px; color:#fff; font-size:15px; }
  .seo .card p { margin:0; color:#94a3b8; font-size:13px; }
  .seo footer { margin-top:40px; padding-top:16px; border-top:1px solid rgba(255,255,255,.08); color:#64748b; font-size:13px; }
  .seo footer a { margin-right:12px; }
`

const CONFIG = JSON.stringify({ mcpServers: { gholl: { type: 'http', url: `${ORIGIN}/mcp` } } }, null, 2)

function typeLabel(prop) {
  if (Array.isArray(prop.enum) && prop.enum.length) return prop.enum.join(' | ')
  const type = Array.isArray(prop.type) ? prop.type.join(' | ') : prop.type
  if (type === 'array' && prop.items?.type) return `${prop.items.type}[]`
  return type ?? 'any'
}

function paramsTable(schema) {
  const required = new Set(schema.required ?? [])
  const rows = Object.entries(schema.properties ?? {})
  if (rows.length === 0) return ''
  const body = rows
    .map(([name, prop]) => {
      const def = prop.default !== undefined ? ` <span style="color:#64748b">(default: ${esc(JSON.stringify(prop.default))})</span>` : ''
      return `<tr><td><code>${esc(name)}</code>${required.has(name) ? ' <span style="color:#fca5a5">*</span>' : ''}</td><td><code>${esc(typeLabel(prop))}</code></td><td>${esc(prop.description ?? '')}${def}</td></tr>`
    })
    .join('')
  return `<table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody>${body}</tbody></table>`
}

function head({ title, description, path, image, jsonLd }) {
  return `<meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0b0f19" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${ORIGIN}${path}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="mcp.gholl.com" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${ORIGIN}${path}" />
    <meta property="og:image" content="${ORIGIN}${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${ORIGIN}${image}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <script type="application/ld+json">${json(jsonLd)}</script>
    ${assetTags}`
}

function brandHeader() {
  return `<div class="brand"><span class="logo">M</span><span>mcp.gholl.com — Interactive micro-tools</span></div>`
}

function toolBody(tool) {
  const related = TOOLS.filter((t) => t.category === tool.category && t.id !== tool.id)
  const examples = (tool.examples ?? []).map((e) => `<li>${esc(e.en)}</li>`).join('')
  const relatedHtml = related
    .map((t) => `<li><a href="/tools/${t.id}">${esc(t.title.en)}</a> — ${esc(t.description.en)}</li>`)
    .join('')
  return `<div class="seo">
    ${brandHeader()}
    <nav aria-label="Breadcrumb"><a href="/">Tools</a> / <span>${esc(tool.title.en)}</span></nav>
    <main>
      <h1>${esc(tool.title.en)}</h1>
      <p class="lead">${esc(tool.description.en)}</p>
      <ul class="tags"><li>${esc(tool.category)}</li>${tool.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>

      <h2>About</h2>
      <p>${esc(tool.mcpDescription)}</p>

      <h2>Parameters</h2>
      ${paramsTable(tool.inputSchema)}

      ${examples ? `<h2>Examples</h2><ul>${examples}</ul>` : ''}

      <h2>Use it</h2>
      <p>In the browser: <a href="${ORIGIN}${tool.embedPath}">${ORIGIN}${tool.embedPath}</a></p>
      <p>As an AI tool: call <code>${esc(tool.id)}</code> on the MCP endpoint <code>${ORIGIN}/mcp</code>.</p>
      <pre>${esc(CONFIG)}</pre>

      ${relatedHtml ? `<h2>Related tools</h2><ul>${relatedHtml}</ul>` : ''}
    </main>
    <footer>
      <a href="/">All tools</a>
      <a href="/llms.txt">llms.txt</a>
      <a href="/.well-known/mcp.json">MCP discovery</a>
      <a href="https://github.com/Gholls/mcp-hub">GitHub</a>
    </footer>
  </div>`
}

function homeBody() {
  const cards = TOOLS.map(
    (t) => `<div class="card"><h3><a href="/tools/${t.id}">${esc(t.title.en)}</a></h3><p>${esc(t.description.en)}</p></div>`,
  ).join('')
  return `<div class="seo">
    ${brandHeader()}
    <main>
      <h1>Interactive micro-tools for humans and AI agents</h1>
      <p class="lead">mcp.gholl.com is a hub of free, login-free micro-tools. Use the interactive cards in your browser, or connect any MCP-capable AI client to the Model Context Protocol endpoint and let your agent call them.</p>
      <h2>Connect via MCP</h2>
      <p>Endpoint: <code>${ORIGIN}/mcp</code> · Discovery: <a href="/.well-known/mcp.json">/.well-known/mcp.json</a> · Agent index: <a href="/llms.txt">/llms.txt</a></p>
      <pre>${esc(CONFIG)}</pre>
      <h2>${TOOLS.length} tools</h2>
      <div class="grid">${cards}</div>
    </main>
    <footer>
      <a href="/llms.txt">llms.txt</a>
      <a href="/.well-known/mcp.json">MCP discovery</a>
      <a href="https://github.com/Gholls/mcp-hub">GitHub</a>
    </footer>
  </div>`
}

function faqLd(tool) {
  return {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is ${tool.title.en}?`,
        acceptedAnswer: { '@type': 'Answer', text: tool.description.en },
      },
      {
        '@type': 'Question',
        name: `How do I use ${tool.title.en} in an AI agent?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Add the MCP server ${ORIGIN}/mcp to any MCP-capable client, then call the "${tool.id}" tool. In the browser, open ${ORIGIN}${tool.embedPath}.`,
        },
      },
    ],
  }
}

function page(fullHead, body) {
  return `<!doctype html>
<html lang="en">
  <head>
    ${fullHead}
    <style>${STYLE}</style>
  </head>
  <body>
    <div id="root">${body}</div>
  </body>
</html>
`
}

// 1. Tool pages
for (const tool of TOOLS) {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: tool.name,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      description: tool.mcpDescription,
      url: `${ORIGIN}${tool.pagePath}`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Tools', item: `${ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: tool.title.en, item: `${ORIGIN}${tool.pagePath}` },
      ],
    },
    { '@context': 'https://schema.org', ...faqLd(tool) },
  ]
  const out = resolve(root, `dist/tools/${tool.id}/index.html`)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(
    out,
    page(
      head({
        title: `${tool.title.en} · mcp.gholl.com`,
        description: tool.description.en,
        path: tool.pagePath,
        image: `/og/${tool.id}.png`,
        jsonLd,
      }),
      toolBody(tool),
    ),
  )
  console.log(`  ✓ dist/tools/${tool.id}/index.html`)
}

// 2. Home page: inject prerendered content into the existing index.html #root
const homeJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'mcp.gholl.com',
    url: `${ORIGIN}/`,
    description: 'Interactive micro-tools for humans and AI agents, served over the Model Context Protocol.',
    inLanguage: 'en',
    publisher: { '@type': 'Organization', name: 'gholl.com', url: 'https://gholl.com' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'mcp.gholl.com tools',
    itemListElement: TOOLS.map((tool, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: tool.title.en,
      url: `${ORIGIN}${tool.pagePath}`,
    })),
  },
]
const homeLd = `<script type="application/ld+json">${json(homeJsonLd)}</script>`
let html = SOURCE_HTML
if (!html.includes('"ItemList"')) {
  html = html.replace('</head>', `    ${homeLd}\n  </head>`)
}
html = html.replace(
  /<div id="root">[\s\S]*?<\/div>\s*<style>/,
  `<div id="root">${homeBody()}</div>\n    <style>${STYLE}</style>\n    <style>`,
)
writeFileSync(resolve(root, 'dist/index.html'), html)
console.log('  ✓ dist/index.html (prerendered home)')
