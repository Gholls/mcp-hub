import { Link } from 'react-router-dom'
import type { ToolMeta } from '@shared/types.ts'
import { useI18n } from '../lib/i18n.tsx'

/** A tool summary card, reused on the home gallery and related-tools sections. */
export default function ToolCard({ tool }: { tool: ToolMeta }) {
  const { t, pick } = useI18n()
  return (
    <Link
      to={`/tools/${tool.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-white/8 bg-ink-800/50 p-5 transition hover:-translate-y-0.5 hover:border-brand-400/50 hover:bg-ink-800 focus-visible:border-brand-400 focus-visible:outline-none"
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
