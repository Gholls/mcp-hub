import { Link } from 'react-router-dom'
import type { ToolMeta } from '@shared/types.ts'
import { useI18n } from '../lib/i18n.tsx'

/** A tool summary card, reused on the home gallery and related-tools sections. */
export default function ToolCard({ tool }: { tool: ToolMeta }) {
  const { t, pick } = useI18n()
  return (
    <Link
      to={`/tools/${tool.id}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(160deg,#151c2c_0%,#0e1421_60%,#0b1018_100%)] p-5 shadow-[0_16px_44px_-20px_rgba(0,0,0,0.95)] transition hover:-translate-y-0.5 hover:border-brand-400/50 hover:shadow-[0_24px_54px_-20px_rgba(99,102,241,0.55)] focus-visible:border-brand-400 focus-visible:outline-none"
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500/25 to-accent-400/15 text-xl ring-1 ring-inset ring-white/10">
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
