import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { diffLines, diffStats } from '@shared/calc/difflib.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Text Diff', a: 'Original', b: 'Changed', added: 'added', removed: 'removed', note: 'Line-by-line difference between two texts.' },
  zh: { title: '文本差异', a: '原文', b: '新文', added: '新增', removed: '删除', note: '逐行对比两段文本的差异。' },
}

export default function TextDiffWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [a, setA] = useState('the quick brown fox\njumps over\nthe lazy dog')
  const [b, setB] = useState('the quick red fox\njumps over\nthe sleepy dog\nand runs')
  const lines = useMemo(() => diffLines(a, b), [a, b])
  const stats = useMemo(() => diffStats(lines), [lines])

  return (
    <WidgetShell title={d.title} icon="🆚" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <textarea value={a} onChange={(e) => setA(e.target.value)} rows={5} spellCheck={false} aria-label={d.a} className="w-full resize-y rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-brand-400" />
          <textarea value={b} onChange={(e) => setB(e.target.value)} rows={5} spellCheck={false} aria-label={d.b} className="w-full resize-y rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-brand-400" />
        </div>
        <div className="flex gap-3 text-[11px]">
          <span className="text-emerald-400">+{stats.added} {d.added}</span>
          <span className="text-rose-400">-{stats.removed} {d.removed}</span>
        </div>
        <div className="overflow-hidden rounded-lg border border-white/8">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`flex gap-2 px-3 py-0.5 font-mono text-xs ${
                line.type === 'add' ? 'bg-emerald-500/10 text-emerald-300' : line.type === 'del' ? 'bg-rose-500/10 text-rose-300' : 'text-slate-500'
              }`}
            >
              <span className="w-3 flex-shrink-0">{line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}</span>
              <span className="whitespace-pre-wrap break-all">{line.text || ' '}</span>
            </div>
          ))}
        </div>
      </div>
    </WidgetShell>
  )
}
