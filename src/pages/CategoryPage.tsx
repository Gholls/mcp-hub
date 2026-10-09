import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TOOLS } from '@shared/tools.ts'
import { SITE_ORIGIN } from '@shared/types.ts'
import { useI18n } from '../lib/i18n.tsx'
import { useSeo } from '../lib/seo.ts'
import {
  CATEGORY_DESCRIPTIONS,
  categoryFromSlug,
  categoryLabel,
  categorySlug,
} from '../lib/categories.ts'
import ToolCard from '../components/ToolCard.tsx'
import NotFound from './NotFound.tsx'

export default function CategoryPage() {
  const { categorySlug: slug = '' } = useParams()
  const { t, locale } = useI18n()
  const category = categoryFromSlug(slug)
  const tools = useMemo(
    () => (category ? TOOLS.filter((tool) => tool.category === category) : []),
    [category],
  )

  const seo = useMemo(
    () =>
      category
        ? {
            title: `${categoryLabel(category, locale)} · mcp.gholl.com`,
            description: CATEGORY_DESCRIPTIONS[category]?.[locale] ?? categoryLabel(category, locale),
            path: `/${categorySlug(category)}`,
            jsonLd: {
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: categoryLabel(category, locale),
              url: `${SITE_ORIGIN}/${categorySlug(category)}`,
              mainEntity: {
                '@type': 'ItemList',
                itemListElement: tools.map((tool, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  name: tool.title.en,
                  url: `${SITE_ORIGIN}${tool.pagePath}`,
                })),
              },
            },
          }
        : null,
    [category, locale, tools],
  )
  useSeo(
    seo ?? {
      title: 'Not found · mcp.gholl.com',
      description: 'Interactive micro-tools for humans and AI agents.',
      path: '/',
    },
  )

  if (!category) return <NotFound />

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10">
      <nav className="mb-6 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-300">
          {t('nav.tools')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-300">{categoryLabel(category, locale)}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {categoryLabel(category, locale)}
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          {CATEGORY_DESCRIPTIONS[category]?.[locale] ?? ''}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  )
}
