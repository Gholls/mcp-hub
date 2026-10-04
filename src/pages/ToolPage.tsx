import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TOOLS, getTool } from '@shared/tools.ts'
import { SITE_ORIGIN, type JsonSchema } from '@shared/types.ts'
import { useI18n } from '../lib/i18n.tsx'
import { useSeo } from '../lib/seo.ts'
import { getWidget } from '../widgets/registry.ts'
import CopyButton from '../components/CopyButton.tsx'
import ToolCard from '../components/ToolCard.tsx'
import ParamTable from '../components/ParamTable.tsx'
import WidgetErrorBoundary from '../components/WidgetErrorBoundary.tsx'

function schemaDefaults(schema: JsonSchema): Record<string, unknown> {
  const args: Record<string, unknown> = {}
  for (const [key, raw] of Object.entries(schema.properties ?? {})) {
    const prop = raw as { default?: unknown }
    if (prop.default !== undefined) args[key] = prop.default
  }
  return args
}

export default function ToolPage() {
  const { widgetId = '' } = useParams()
  const tool = getTool(widgetId)
  const Widget = getWidget(widgetId)
  const { t, pick, locale } = useI18n()

  const seo = useMemo(
    () =>
      tool
        ? {
            title: `${pick(tool.title)} · mcp.gholl.com`,
            description: pick(tool.description),
            path: tool.pagePath,
            image: `/og/${tool.id}.png`,
            jsonLd: {
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: tool.name,
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Any',
              description: tool.mcpDescription,
              url: `${SITE_ORIGIN}${tool.pagePath}`,
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            },
          }
        : null,
    [tool, pick],
  )
  useSeo(
    seo ?? {
      title: 'Tool not found · mcp.gholl.com',
      description: 'Interactive micro-tools for humans and AI agents.',
      path: '/',
    },
  )

  if (!tool) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-24 text-center">
        <h1 className="text-2xl font-semibold text-white">{t('tool.notFound')}</h1>
        <Link to="/" className="mt-4 inline-block text-brand-400 hover:text-brand-300">
          {t('tool.backHome')}
        </Link>
      </div>
    )
  }

  const embedUrl = `${SITE_ORIGIN}${tool.embedPath}`
  const mcpConfig = JSON.stringify(
    { mcpServers: { gholl: { type: 'http', url: `${SITE_ORIGIN}/mcp` } } },
    null,
    2,
  )
  const callParams = { name: tool.id, arguments: schemaDefaults(tool.inputSchema) }
  const rpc = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: callParams }, null, 2)
  const curl = `curl -s ${SITE_ORIGIN}/mcp \\\n  -H 'Content-Type: application/json' \\\n  -H 'Accept: application/json, text/event-stream' \\\n  -d '${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: callParams })}'`

  const related = TOOLS.filter((item) => item.category === tool.category && item.id !== tool.id)

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <nav className="mb-6 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-300">
          {t('nav.tools')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-300">{pick(tool.title)}</span>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-ink-700 text-2xl">
            {tool.icon}
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{pick(tool.title)}</h1>
            <p className="mt-2 max-w-2xl text-slate-400">{pick(tool.description)}</p>
          </div>
        </div>
        <a
          href={tool.embedPath}
          target="_blank"
          rel="noreferrer"
          className="flex-shrink-0 rounded-xl border border-white/10 bg-ink-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-brand-400/60 hover:text-white"
        >
          {t('tool.openWidget')} ↗
        </a>
      </header>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="rounded-md bg-brand-500/10 px-2 py-0.5 text-[11px] text-brand-300">
          {tool.category}
        </span>
        {tool.tags.map((tag) => (
          <span key={tag} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
            {tag}
          </span>
        ))}
      </div>

      <section className="mt-8">
        {Widget ? (
          <WidgetErrorBoundary>
            <Widget locale={locale} initial={{}} />
          </WidgetErrorBoundary>
        ) : (
          <div className="rounded-2xl border border-white/8 bg-ink-800/40 p-12 text-center text-slate-400">
            {t('common.comingSoon')}
          </div>
        )}
      </section>

      {tool.examples && tool.examples.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-white/8 bg-ink-800/40 p-5">
          <h2 className="text-sm font-semibold text-white">{t('tool.examples')}</h2>
          <ul className="mt-3 space-y-2">
            {tool.examples.map((example, i) => {
              const text = pick(example)
              return (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-slate-600">“</span>
                  <span className="flex-1 text-sm text-slate-300">{text}</span>
                  <CopyButton value={text} />
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      <div className="mt-6">
        <ParamTable schema={tool.inputSchema} />
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-ink-800/40 p-6">
          <h2 className="font-semibold text-white">{t('tool.usageWeb')}</h2>
          <p className="mt-1 text-sm text-slate-400">{t('tool.usageWebDesc')}</p>
          <div className="mt-4 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-ink-900 px-3 py-2 font-mono text-xs text-slate-300">
              {embedUrl}
            </code>
            <CopyButton value={embedUrl} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-ink-800/40 p-6">
          <h2 className="font-semibold text-white">{t('tool.usageMcp')}</h2>
          <p className="mt-1 text-sm text-slate-400">{t('tool.usageMcpDesc')}</p>
          <div className="mt-4 flex items-start gap-2">
            <pre className="flex-1 overflow-x-auto rounded-lg bg-ink-900 px-3 py-2 font-mono text-xs text-slate-300">
              {mcpConfig}
            </pre>
            <CopyButton value={mcpConfig} />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/8 bg-ink-800/40 p-6">
        <h2 className="font-semibold text-white">{t('tool.api')}</h2>
        <p className="mt-1 text-sm text-slate-400">{t('tool.apiDesc')}</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="flex items-start gap-2">
            <pre className="flex-1 overflow-x-auto rounded-lg bg-ink-900 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-300">
              {curl}
            </pre>
            <CopyButton value={curl} />
          </div>
          <div className="flex items-start gap-2">
            <pre className="flex-1 overflow-x-auto rounded-lg bg-ink-900 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-300">
              {rpc}
            </pre>
            <CopyButton value={rpc} />
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-white">{t('tool.related')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ToolCard key={item.id} tool={item} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-brand-500/20 bg-gradient-to-r from-brand-500/10 to-accent-500/10 p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-semibold text-white">{t('promo.title')}</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{t('promo.body')}</p>
        </div>
        <a
          href="https://gholl.com/?utm_source=mcp-hub&utm_medium=tool-page&utm_campaign=referral"
          target="_blank"
          rel="noreferrer"
          className="flex-shrink-0 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 font-medium text-ink-950 transition hover:opacity-90"
        >
          {t('promo.cta')}
        </a>
      </section>
    </div>
  )
}
