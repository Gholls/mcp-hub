import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getTool } from '@shared/tools.ts'
import { SITE_ORIGIN } from '@shared/types.ts'
import { useI18n } from '../lib/i18n.tsx'
import { useSeo } from '../lib/seo.ts'
import { getWidget } from '../widgets/registry.ts'
import CopyButton from '../components/CopyButton.tsx'
import WidgetErrorBoundary from '../components/WidgetErrorBoundary.tsx'

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

  const mcpConfig = JSON.stringify(
    { mcpServers: { gholl: { url: 'https://mcp.gholl.com/mcp' } } },
    null,
    2,
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <nav className="mb-6 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-300">
          {t('nav.tools')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-300">{pick(tool.title)}</span>
      </nav>

      <header className="flex items-start gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-700 text-2xl">
          {tool.icon}
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{pick(tool.title)}</h1>
          <p className="mt-2 max-w-2xl text-slate-400">{pick(tool.description)}</p>
        </div>
      </header>

      <section className="mt-8 overflow-hidden rounded-2xl border border-white/8 bg-ink-800/40">
        {Widget ? (
          <WidgetErrorBoundary>
            <Widget locale={locale} initial={{}} />
          </WidgetErrorBoundary>
        ) : (
          <div className="p-12 text-center text-slate-400">{t('common.comingSoon')}</div>
        )}
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-ink-800/40 p-6">
          <h2 className="font-semibold text-white">{t('tool.usageWeb')}</h2>
          <p className="mt-1 text-sm text-slate-400">{t('tool.usageWebDesc')}</p>
          <div className="mt-4 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-ink-900 px-3 py-2 font-mono text-xs text-slate-300">
              https://mcp.gholl.com{tool.embedPath}
            </code>
            <CopyButton value={`https://mcp.gholl.com${tool.embedPath}`} />
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

      <section className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-brand-500/20 bg-gradient-to-r from-brand-500/10 to-accent-500/10 p-6 sm:flex-row sm:items-center">
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
