import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { toTable } from '@shared/calc/table.ts'
import { parseJson } from '@shared/calc/jsonld.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import { readString } from '../params.ts'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'JSON to Table', input: 'JSON (array of objects)', rows: 'rows', note: 'Turn JSON into a readable table.' },
  zh: { title: 'JSON 转表格', input: 'JSON（对象数组）', rows: '行', note: '把 JSON 转成易读表格。' },
}

const SAMPLE = '[{"name":"vram-calc","cat":"Infra","ms":12},{"name":"gomoku","cat":"Games","ms":3},{"name":"echarts","cat":"Data","ms":28}]'

export default function JsonToTableWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [text, setText] = useState(() => readString(initial, 'json', SAMPLE))
  const parsed = useMemo(() => parseJson(text), [text])
  const table = useMemo(() => (parsed.valid ? toTable(parsed.value) : null), [parsed])

  return (
    <WidgetShell title={d.title} icon="🧮" footer={d.note}>
      <div className="flex flex-col gap-3">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} spellCheck={false} aria-label={d.input} className={`w-full resize-y rounded-lg border bg-ink-950 px-3 py-2 font-mono text-xs outline-none ${parsed.valid ? 'border-white/10 text-slate-200' : 'border-rose-500/40 text-rose-200'}`} />
        {!parsed.valid ? (
          <p className="text-xs text-rose-400">{parsed.error}</p>
        ) : table && table.columns.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-white/8">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-white/5 text-[11px] uppercase tracking-wide text-slate-400">
                  {table.columns.map((c) => (
                    <th key={c} className="px-3 py-2 font-medium">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-1.5 font-mono text-slate-300">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-white/5 px-3 py-1.5 text-[11px] text-slate-500">{table.rows.length} {d.rows}</div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">—</p>
        )}
      </div>
    </WidgetShell>
  )
}
