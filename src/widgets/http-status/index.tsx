import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { HTTP_STATUSES, categoryOf, findStatus } from '@shared/calc/httpstatus.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'HTTP Status Codes', search: 'Search code or phrase…', note: 'Color-coded reference for HTTP status codes.' },
  zh: { title: 'HTTP 状态码', search: '搜索状态码或短语…', note: '按类别着色的 HTTP 状态码速查。' },
}

const COLORS: Record<string, string> = {
  Informational: '#64748b',
  Success: '#22c55e',
  Redirect: '#38bdf8',
  'Client error': '#f59e0b',
  'Server error': '#ef4444',
}

export default function HttpStatusWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [query, setQuery] = useState('')
  const results = useMemo(() => findStatus(query), [query])
  const grouped = useMemo(() => {
    const map = new Map<string, typeof HTTP_STATUSES>()
    for (const s of results) {
      const key = categoryOf(s.code).en
      map.set(key, [...(map.get(key) ?? []), s])
    }
    return [...map.entries()]
  }, [results])

  return (
    <WidgetShell title={d.title} icon="🚦" footer={d.note}>
      <div className="flex flex-col gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={d.search}
          className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-brand-400"
        />
        {grouped.length === 0 ? (
          <p className="text-sm text-slate-500">—</p>
        ) : (
          grouped.map(([cat, items]) => (
            <div key={cat}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[cat] }} />
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{cat}</span>
                <span className="text-[11px] text-slate-600">{items.length}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((s) => (
                  <div key={s.code} className="flex items-start gap-3 rounded-lg border border-white/8 bg-ink-900/50 p-2.5">
                    <span className="rounded-md px-2 py-1 font-mono text-sm font-bold" style={{ background: `${COLORS[cat]}22`, color: COLORS[cat] }}>
                      {s.code}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-slate-200">{s.phrase}</div>
                      <div className="text-[11px] text-slate-500">{s.description[locale]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </WidgetShell>
  )
}
