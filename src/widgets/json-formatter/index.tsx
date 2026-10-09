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
    input: 'Edit JSON',
    format: 'Format',
    minify: 'Minify',
    sort: 'Sort keys',
    valid: 'Valid',
    invalid: 'Invalid',
    bytes: 'Bytes',
    lines: 'Lines',
    nodes: 'Nodes',
    depth: 'Depth',
    tree: 'Tree view',
    note: 'Color-coded tree + editor. Everything runs in your browser.',
  },
  zh: {
    title: 'JSON 格式化',
    input: '编辑 JSON',
    format: '格式化',
    minify: '压缩',
    sort: '键排序',
    valid: '合法',
    invalid: '语法错误',
    bytes: '字节',
    lines: '行数',
    nodes: '节点',
    depth: '层级',
    tree: '树形视图',
    note: '彩色树 + 编辑器，全部本地完成。',
  },
}

const SAMPLE = '{\n  "name": "mcp-hub",\n  "tools": 16,\n  "active": true,\n  "tags": ["json", "dev"],\n  "owner": { "org": "gholl", "tier": null }\n}'

function JsonNode({ name, value, depth = 0 }: { name: string; value: unknown; depth?: number }) {
  const [open, setOpen] = useState(depth < 2)
  const isObject = value !== null && typeof value === 'object'
  const entries = isObject ? Object.entries(value as Record<string, unknown>) : []
  const isArray = Array.isArray(value)

  const key = name ? <span className="text-indigo-300">{name}</span> : null
  if (!isObject) {
    const rendered =
      typeof value === 'string' ? (
        <span className="text-emerald-300">"{value}"</span>
      ) : typeof value === 'number' ? (
        <span className="text-amber-300">{value}</span>
      ) : typeof value === 'boolean' ? (
        <span className="text-cyan-300">{String(value)}</span>
      ) : (
        <span className="text-slate-500">null</span>
      )
    return (
      <div className="flex gap-1.5" style={{ paddingLeft: depth * 14 }}>
        {key}
        {key ? <span className="text-slate-600">:</span> : null}
        {rendered}
      </div>
    )
  }

  const bracket = isArray ? ['[', ']'] : ['{', '}']
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 hover:text-white"
        style={{ paddingLeft: depth * 14 }}
      >
        <span className="w-3 text-slate-500">{open ? '▾' : '▸'}</span>
        {key}
        {key ? <span className="text-slate-600">:</span> : null}
        <span className="text-slate-500">{bracket[0]}</span>
        {!open ? <span className="text-slate-600">… {bracket[1]}</span> : null}
      </button>
      {open ? (
        <div>
          {entries.map(([childKey, child]) => (
            <JsonNode key={childKey} name={isArray ? '' : childKey} value={child} depth={depth + 1} />
          ))}
          <div className="text-slate-500" style={{ paddingLeft: depth * 14 + 18 }}>
            {bracket[1]}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function JsonFormatterWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [text, setText] = useState(() => readString(initial, 'json', SAMPLE))

  const parsed = useMemo(() => parseJson(text), [text])
  const stats = useMemo(() => (parsed.valid ? jsonStats(parsed.value) : undefined), [parsed])

  function apply(result: { ok: boolean; text: string }) {
    if (result.ok) setText(result.text)
  }

  const badges: [string, string | number][] = stats
    ? [
        [d.bytes, stats.bytes],
        [d.lines, stats.lines],
        [d.nodes, stats.nodes],
        [d.depth, stats.depth],
      ]
    : []

  return (
    <WidgetShell title={d.title} icon="🧾" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => apply(transformJson(text, 'format'))} className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-brand-400/60 hover:text-white">
            {d.format}
          </button>
          <button type="button" onClick={() => apply(transformJson(text, 'minify'))} className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-brand-400/60 hover:text-white">
            {d.minify}
          </button>
          <button type="button" onClick={() => apply(sortJson(text))} className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-brand-400/60 hover:text-white">
            {d.sort}
          </button>
          <span className={`rounded-md px-2 py-1 text-[11px] font-medium ${parsed.valid ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
            {parsed.valid ? d.valid : d.invalid}
          </span>
          <CopyButton value={text} />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            rows={13}
            aria-label={d.input}
            className={`w-full resize-y rounded-lg border bg-ink-950 px-3 py-2 font-mono text-xs leading-relaxed outline-none ${parsed.valid ? 'border-white/10 text-slate-200' : 'border-rose-500/40 text-rose-200'}`}
          />
          <div className="rounded-lg border border-white/8 bg-ink-950/60 p-3">
            <div className="mb-1.5 text-[11px] font-medium text-slate-400">{d.tree}</div>
            <div className="max-h-[300px] overflow-auto font-mono text-xs leading-relaxed">
              {parsed.valid ? <JsonNode name="" value={parsed.value} /> : <span className="text-rose-400">{parsed.error}</span>}
            </div>
          </div>
        </div>

        {stats ? (
          <div className="flex flex-wrap gap-2 text-[11px]">
            {badges.map(([label, value]) => (
              <span key={label} className="rounded-md bg-white/5 px-2 py-1 text-slate-400">
                {label}: <span className="font-mono text-slate-200">{value}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </WidgetShell>
  )
}
