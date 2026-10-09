import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { jsonStats, sortJson, transformJson } from '@shared/calc/jsonfmt.ts'
import { parseJson } from '@shared/calc/jsonld.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import CopyButton from '../../components/CopyButton.tsx'
import { readString } from '../params.ts'

type Dict = Record<string, string>

const T: Record<Locale, Dict> = {
  en: {
    title: 'JSON Formatter',
    input: 'JSON',
    format: 'Format',
    minify: 'Minify',
    sort: 'Sort keys',
    valid: 'Valid',
    invalid: 'Invalid',
    bytes: 'Bytes',
    lines: 'Lines',
    nodes: 'Nodes',
    depth: 'Depth',
    note: 'Validate, format, minify and sort JSON. Nothing leaves your browser.',
  },
  zh: {
    title: 'JSON 格式化',
    input: 'JSON',
    format: '格式化',
    minify: '压缩',
    sort: '键排序',
    valid: '合法',
    invalid: '语法错误',
    bytes: '字节',
    lines: '行数',
    nodes: '节点',
    depth: '层级',
    note: '校验、格式化、压缩与键排序，全部本地完成。',
  },
}

const SAMPLE = '{"name":"mcp-hub","tools":11,"ok":true,"tags":["json","dev"]}'

export default function JsonFormatterWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [text, setText] = useState(() => readString(initial, 'json', SAMPLE))

  const parsed = useMemo(() => parseJson(text), [text])
  const stats = useMemo(() => (parsed.valid ? jsonStats(parsed.value) : undefined), [parsed])

  function apply(result: { ok: boolean; text: string }) {
    if (result.ok) setText(result.text)
  }

  return (
    <WidgetShell title={d.title} icon="🧾" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-300">{d.input}</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => apply(transformJson(text, 'format'))}
              className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-brand-400/60 hover:text-white"
            >
              {d.format}
            </button>
            <button
              type="button"
              onClick={() => apply(transformJson(text, 'minify'))}
              className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-brand-400/60 hover:text-white"
            >
              {d.minify}
            </button>
            <button
              type="button"
              onClick={() => apply(sortJson(text))}
              className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-brand-400/60 hover:text-white"
            >
              {d.sort}
            </button>
            <span
              className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                parsed.valid ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
              }`}
            >
              {parsed.valid ? d.valid : d.invalid}
            </span>
            <CopyButton value={text} />
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          rows={12}
          className={`w-full resize-y rounded-lg border bg-ink-950 px-3 py-2 font-mono text-xs leading-relaxed outline-none ${
            parsed.valid ? 'border-white/10 text-slate-200' : 'border-rose-500/40 text-rose-200'
          }`}
        />

        {parsed.valid && stats ? (
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
            <span className="rounded-md bg-white/5 px-2 py-1">
              {d.bytes}: <span className="font-mono text-slate-200">{stats.bytes}</span>
            </span>
            <span className="rounded-md bg-white/5 px-2 py-1">
              {d.lines}: <span className="font-mono text-slate-200">{stats.lines}</span>
            </span>
            <span className="rounded-md bg-white/5 px-2 py-1">
              {d.nodes}: <span className="font-mono text-slate-200">{stats.nodes}</span>
            </span>
            <span className="rounded-md bg-white/5 px-2 py-1">
              {d.depth}: <span className="font-mono text-slate-200">{stats.depth}</span>
            </span>
          </div>
        ) : (
          <p className="text-xs text-rose-400">
            {parsed.error}
            {parsed.errorLine ? ` (line ${parsed.errorLine})` : ''}
          </p>
        )}
      </div>
    </WidgetShell>
  )
}
