import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { TOOLS } from '@shared/tools.ts'
import { SITE_ORIGIN } from '@shared/types.ts'
import { useI18n } from '../lib/i18n.tsx'
import { useSeo } from '../lib/seo.ts'
import { searchTools } from '../lib/search.ts'
import { categoryLabel, categorySlug, groupByCategory } from '../lib/categories.ts'
import CopyButton from '../components/CopyButton.tsx'
import ToolCard from '../components/ToolCard.tsx'

const MCP_URL = 'https://mcp.gholl.com/mcp'
const REPO_URL = 'https://github.com/Gholls/mcp-hub'
const HOST_DOC = `${REPO_URL}/blob/main/docs/host-integration.md`

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-ink-800/40 px-4 py-3">
      <div className={`font-mono text-2xl font-bold ${accent ? 'text-accent-400' : 'text-white'}`}>
        {value}
      </div>
      <div className="mt-0.5 text-xs text-slate-400">{label}</div>
    </div>
  )
}

export default function Home() {
  const { t, locale } = useI18n()
  const { hash } = useLocation()
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!hash || !/^#[\w-]+$/.test(hash)) return
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
      if (event.key === '/' && !typing) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => searchTools(query), [query])
  const groups = useMemo(() => groupByCategory(results), [results])
  const categoryCount = new Set(TOOLS.map((tool) => tool.category)).size

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

  const cli = `claude mcp add --transport http gholl ${MCP_URL}`
  const config = JSON.stringify({ mcpServers: { gholl: { type: 'http', url: MCP_URL } } }, null, 2)

  return (
    <div className="mx-auto w-full max-w-6xl px-5">
      <section className="py-16 sm:py-20">
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
            className="rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-3 font-medium text-ink-950 transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            {t('home.hero.cta')}
          </a>
          <a
            href="#connect"
            className="rounded-xl border border-white/10 bg-ink-800/60 px-5 py-3 font-medium text-slate-200 transition hover:border-brand-400/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            {t('home.hero.ctaMcp')}
          </a>
        </div>

        <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
          <Stat value={String(TOOLS.length)} label={t('home.stats.tools')} accent />
          <Stat value={String(categoryCount)} label={t('home.stats.categories')} />
          <Stat value={t('home.stats.open')} label={t('home.stats.auth')} />
        </div>
      </section>

      <section id="connect" className="scroll-mt-24 pb-16">
        <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-ink-800/60 to-ink-900/60 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="lg:max-w-sm">
              <h2 className="text-xl font-semibold text-white">{t('home.connect.title')}</h2>
              <p className="mt-1 text-sm text-slate-400">{t('home.connect.subtitle')}</p>
              <a
                href={HOST_DOC}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-brand-400 hover:text-brand-300"
              >
                {t('home.connect.host')} →
              </a>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="mb-1 text-xs font-medium text-slate-300">{t('home.connect.cli')}</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-xs text-accent-300">
                    {cli}
                  </code>
                  <CopyButton value={cli} />
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-slate-300">mcpServers</div>
                <div className="flex items-start gap-2">
                  <pre className="flex-1 overflow-x-auto rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-xs leading-relaxed text-slate-300">
                    {config}
                  </pre>
                  <CopyButton value={config} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tools" className="scroll-mt-24 pb-20">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white">{t('home.tools.title')}</h2>
          <p className="mt-1 text-sm text-slate-400">{t('home.tools.subtitle')}</p>
        </div>

        <div className="mb-6">
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`${t('home.search.placeholder')}  /`}
            aria-label={t('home.search.placeholder')}
            className="w-full rounded-xl border border-white/10 bg-ink-800/60 px-4 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-brand-400 sm:max-w-xs"
          />
        </div>

        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-ink-800/30 p-12 text-center text-slate-400">
            {TOOLS.length === 0 ? t('home.empty') : t('home.noResults')}
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {groups.map(([category, tools]) => (
              <div key={category}>
                <div className="mb-4 flex items-baseline gap-3">
                  <Link
                    to={`/${categorySlug(category)}`}
                    className="text-lg font-semibold text-white hover:text-brand-300"
                  >
                    {categoryLabel(category, locale)}
                  </Link>
                  <span className="text-xs text-slate-500">{tools.length}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
