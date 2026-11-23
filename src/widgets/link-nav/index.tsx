import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { groupNavSites, navSiteHost, normalizeNavDirectory } from '@shared/calc/links.ts'
import type { NavGroup, NavSite } from '@shared/calc/links.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import { useMcp } from '../../lib/mcp-app.ts'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: {
    title: 'Link Directory',
    search: 'Search sites…',
    noMatches: 'No sites match “{q}”.',
    other: 'Other',
    emptyTitle: 'No sites to show yet',
    emptyHint: 'Pass a list of sites with a name and a URL to build the directory.',
    footer: '{sites} sites · {groups} groups · opens in a new tab',
    footerFlat: '{sites} sites · opens in a new tab',
  },
  zh: {
    title: '网址导航',
    search: '搜索网站…',
    noMatches: '没有匹配“{q}”的网站。',
    other: '其他',
    emptyTitle: '还没有可显示的网站',
    emptyHint: '传入包含 name 和 url 的网站列表，即可生成导航。',
    footer: '{sites} 个网站 · {groups} 个分组 · 新标签页打开',
    footerFlat: '{sites} 个网站 · 新标签页打开',
  },
}

interface DemoSite {
  name: string
  url: string
  description: string
  icon: string
  category: string
}

const DEMO: Record<Locale, { title: string; subtitle: string; sites: DemoSite[] }> = {
  en: {
    title: 'Link Directory',
    subtitle: 'A starter set of sites — replace it with your own.',
    sites: [
      { name: 'GitHub', url: 'github.com', description: 'Code hosting, reviews and CI for teams.', icon: '🐙', category: 'Developer' },
      { name: 'MDN Web Docs', url: 'developer.mozilla.org', description: 'The reference for HTML, CSS and JavaScript.', icon: '📚', category: 'Developer' },
      { name: 'Stack Overflow', url: 'stackoverflow.com', description: 'Answers to programming questions, from beginners to experts.', icon: '💬', category: 'Developer' },
      { name: 'Figma', url: 'figma.com', description: 'Collaborative interface design and prototyping.', icon: '🎨', category: 'Design' },
      { name: 'Dribbble', url: 'dribbble.com', description: 'Design inspiration and portfolios.', icon: '🏀', category: 'Design' },
      { name: 'Coolors', url: 'coolors.co', description: 'Generate and browse color palettes in seconds.', icon: '🌈', category: 'Design' },
      { name: 'Wikipedia', url: 'wikipedia.org', description: 'The free encyclopedia anyone can edit.', icon: '📖', category: 'Everyday' },
      { name: 'Hacker News', url: 'news.ycombinator.com', description: 'Technology news and discussion.', icon: '📰', category: 'Everyday' },
    ],
  },
  zh: {
    title: '网址导航',
    subtitle: '一组常用网站示例——可替换为你自己的收藏。',
    sites: [
      { name: 'GitHub', url: 'github.com', description: '面向团队的代码托管、评审与 CI。', icon: '🐙', category: '开发' },
      { name: 'MDN Web Docs', url: 'developer.mozilla.org', description: 'HTML、CSS 和 JavaScript 的权威参考。', icon: '📚', category: '开发' },
      { name: 'Stack Overflow', url: 'stackoverflow.com', description: '从入门到进阶的编程问答社区。', icon: '💬', category: '开发' },
      { name: 'Figma', url: 'figma.com', description: '协作式的界面设计与原型制作。', icon: '🎨', category: '设计' },
      { name: 'Dribbble', url: 'dribbble.com', description: '设计灵感与作品集。', icon: '🏀', category: '设计' },
      { name: 'Coolors', url: 'coolors.co', description: '几秒钟生成并浏览配色方案。', icon: '🌈', category: '设计' },
      { name: 'Wikipedia', url: 'wikipedia.org', description: '人人可编辑的自由百科全书。', icon: '📖', category: '日常' },
      { name: 'Hacker News', url: 'news.ycombinator.com', description: '科技新闻与技术讨论。', icon: '📰', category: '日常' },
    ],
  },
}

const EXAMPLE = '{"sites":[{"name":"GitHub","url":"github.com","icon":"🐙","description":"Code hosting"}]}'

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match))
}

function hueFor(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index++) hash = (hash * 31 + value.charCodeAt(index)) % 360
  return hash
}

const TILE = 'grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-ink-950/90 ring-1 ring-inset ring-white/5'

function SiteIcon({ site }: { site: NavSite }) {
  const [failed, setFailed] = useState(false)
  const icon = site.icon
  const isImage = icon !== undefined && (/^data:image\//i.test(icon) || /^https?:\/\//i.test(icon))

  if (isImage && !failed) {
    return (
      <span className={TILE}>
        <img
          src={icon}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-0.5"
        />
      </span>
    )
  }

  if (icon && !isImage) {
    return <span className={`${TILE} text-lg leading-none`}>{icon}</span>
  }

  const letter = Array.from(site.name.trim())[0]?.toUpperCase() ?? '?'
  return (
    <span
      aria-hidden="true"
      className={`${TILE} text-sm font-semibold text-white`}
      style={{ background: `hsl(${hueFor(site.url)} 62% 42%)` }}
    >
      {letter}
    </span>
  )
}

export default function LinkNavWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const { openLink } = useMcp()
  const [query, setQuery] = useState('')

  const directory = useMemo(() => {
    const hasSites = 'sites' in initial || 'links' in initial || 'items' in initial
    if (hasSites) return normalizeNavDirectory(initial)
    const demo = DEMO[locale] ?? DEMO.en
    return normalizeNavDirectory({ title: demo.title, subtitle: demo.subtitle, sites: demo.sites })
  }, [initial, locale])

  const sites = directory.sites
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return sites
    return sites.filter(
      (site) =>
        site.name.toLowerCase().includes(needle) ||
        (site.description?.toLowerCase().includes(needle) ?? false) ||
        navSiteHost(site.url).toLowerCase().includes(needle),
    )
  }, [sites, query])

  const grouped = directory.categories.length > 0
  const visibleGroups = useMemo<NavGroup[]>(
    () => (grouped ? groupNavSites(filtered) : [{ category: null, sites: filtered }]),
    [grouped, filtered],
  )

  const showSearch = sites.length > 6
  const footer = grouped
    ? fill(d.footer, { sites: sites.length, groups: directory.categories.length })
    : fill(d.footerFlat, { sites: sites.length })

  return (
    <WidgetShell title={directory.title ?? d.title} icon="🧭" footer={footer}>
      <div className="flex flex-col gap-3">
        {directory.subtitle ? <p className="text-xs text-slate-400">{directory.subtitle}</p> : null}

        {showSearch ? (
          <div className="relative">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500">
              <circle cx="7" cy="7" r="4.25" />
              <path d="m10.5 10.5 3 3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={d.search}
              aria-label={d.search}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg border border-white/10 bg-ink-950/80 py-2 pl-9 pr-3 text-xs text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-brand-400/60"
            />
          </div>
        ) : null}

        {sites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-ink-900/40 px-4 py-7 text-center">
            <div className="text-2xl">🧭</div>
            <p className="mt-2 text-sm font-medium text-slate-200">{d.emptyTitle}</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{d.emptyHint}</p>
            <pre className="mx-auto mt-3 max-w-full overflow-x-auto rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-left font-mono text-[11px] leading-relaxed text-slate-400">
              {EXAMPLE}
            </pre>
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-ink-900/40 px-3 py-7 text-center text-xs text-slate-500">{fill(d.noMatches, { q: query.trim() })}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {visibleGroups.map((group) => (
              <div key={group.category ?? '__other'} className="flex flex-col gap-2">
                {grouped ? (
                  <div className="flex items-center gap-2">
                    <h4 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{group.category ?? d.other}</h4>
                    <span className="min-w-5 rounded-full border border-white/10 px-1.5 py-px text-center font-mono text-[10px] leading-4 text-slate-500">{group.sites.length}</span>
                  </div>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.sites.map((site) => {
                    const host = navSiteHost(site.url)
                    return (
                      <button
                        key={site.url}
                        type="button"
                        onClick={() => void openLink(site.url)}
                        aria-label={`${site.name} — ${host}`}
                        title={site.url}
                        className="group relative flex w-full items-start gap-2.5 rounded-xl border border-white/10 bg-ink-900/50 p-2.5 text-left transition hover:-translate-y-0.5 hover:border-brand-400/50 hover:bg-ink-800/70 focus-visible:border-brand-400/60 focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
                      >
                        <SiteIcon site={site} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate pr-4 text-sm font-medium text-slate-100">{site.name}</span>
                          {site.description ? <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-slate-400">{site.description}</span> : null}
                          <span className="mt-1 block truncate font-mono text-[10px] text-slate-500">{host}</span>
                        </span>
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="absolute right-2 top-2 h-3.5 w-3.5 text-slate-500 opacity-0 transition group-hover:text-brand-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                          <path d="M6.5 3.5h6v6m0-6-8 8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetShell>
  )
}
