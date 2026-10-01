import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TOOLS } from '@shared/tools.ts'
import { SITE_ORIGIN, type ToolMeta } from '@shared/types.ts'
import { useI18n } from '../lib/i18n.tsx'
import { useSeo } from '../lib/seo.ts'

function ToolCard({ tool }: { tool: ToolMeta }) {
  const { t, pick } = useI18n()
  return (
    <Link
      to={`/tools/${tool.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-white/8 bg-ink-800/50 p-5 transition hover:-translate-y-0.5 hover:border-brand-400/50 hover:bg-ink-800"
    >
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-700 text-xl">
          {tool.icon}
        </span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-400">
          {tool.status === 'beta' ? t('common.beta') : t('common.stable')}
        </span>
      </div>
      <div>
        <h3 className="font-semibold text-white group-hover:text-brand-300">{pick(tool.title)}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-400">{pick(tool.description)}</p>
      </div>
      <div className="mt-auto flex flex-wrap gap-1.5">
        {tool.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  )
}

export default function Home() {
  const { t } = useI18n()

  const seo = useMemo(
    () => ({
      title: 'mcp.gholl.com — Interactive micro-tools for humans & AI agents',
      description:
        'Fast, login-free interactive micro-tools. Use them in the browser or let your AI agent call them through the Model Context Protocol (MCP Apps).',
      path: '/',
      image: '/og/site.png',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'mcp.gholl.com',
        url: SITE_ORIGIN,
        description: 'Interactive micro-tools for humans and AI agents, served over MCP.',
      },
    }),
    [],
  )
  useSeo(seo)

  return (
    <div className="mx-auto w-full max-w-6xl px-5">
      <section className="py-16 sm:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
          MCP Apps · Model Context Protocol
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
          {t('home.hero.title')}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-400">{t('home.hero.subtitle')}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#tools"
            className="rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-3 font-medium text-ink-950 transition hover:opacity-90"
          >
            {t('home.hero.cta')}
          </a>
          <code className="rounded-xl border border-white/10 bg-ink-800/60 px-5 py-3 font-mono text-sm text-slate-300">
            https://mcp.gholl.com/mcp
          </code>
        </div>
      </section>

      <section id="tools" className="pb-20">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">{t('home.tools.title')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('home.tools.subtitle')}</p>
          </div>
        </div>
        {TOOLS.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-ink-800/30 p-12 text-center text-slate-400">
            {t('home.empty')}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
