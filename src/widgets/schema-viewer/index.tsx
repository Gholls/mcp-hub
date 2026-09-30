import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { formatJson, parseJson, summarizeJsonLd } from '@shared/calc/jsonld.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import { useMcp } from '../../lib/mcp-app.ts'
import { readString } from '../params.ts'

type Dict = Record<string, string>

const T: Record<Locale, Dict> = {
  en: {
    title: 'JSON-LD / Schema Viewer',
    input: 'JSON input',
    format: 'Format',
    valid: 'Valid JSON',
    invalid: 'Syntax error',
    line: 'line',
    summary: 'Summary',
    types: 'Types',
    context: 'Context',
    nodes: 'Nodes',
    keys: 'Top-level keys',
    tree: 'Tree',
    askAi: 'Ask AI to analyze',
    sent: 'Sent to AI',
    notJsonLd: 'Not detected as JSON-LD (missing @context / @type)',
    empty: 'Paste JSON or JSON-LD to inspect it.',
  },
  zh: {
    title: 'JSON-LD / Schema 可视化',
    input: 'JSON 输入',
    format: '格式化',
    valid: 'JSON 合法',
    invalid: '语法错误',
    line: '行',
    summary: '概览',
    types: '类型',
    context: '上下文',
    nodes: '节点数',
    keys: '顶层字段',
    tree: '树形视图',
    askAi: '让 AI 分析',
    sent: '已发送给 AI',
    notJsonLd: '未检测为 JSON-LD（缺少 @context / @type）',
    empty: '粘贴 JSON 或 JSON-LD 以查看结构。',
  },
}

const DEFAULT_JSON = `{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "MCP Hub Pro",
  "description": "Interactive micro-tools for AI agents",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}`

function JsonNode({
  name,
  value,
  depth = 0,
}: {
  name: string
  value: unknown
  depth?: number
}) {
  const [open, setOpen] = useState(depth < 2)
  const isObject = !!value && typeof value === 'object'
  const entries = isObject ? Object.entries(value as Record<string, unknown>) : []
  const isArray = Array.isArray(value)

  const label = <span className="text-brand-300">{name}</span>

  if (!isObject) {
    const rendered =
      typeof value === 'string' ? (
        <span className="text-emerald-300">"{value}"</span>
      ) : typeof value === 'number' ? (
        <span className="text-amber-300">{value}</span>
      ) : typeof value === 'boolean' ? (
        <span className="text-accent-300">{String(value)}</span>
      ) : (
        <span className="text-slate-500">null</span>
      )
    return (
      <div className="flex gap-1.5" style={{ paddingLeft: depth * 12 }}>
        {label}
        <span className="text-slate-600">:</span>
        {rendered}
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 hover:text-white"
        style={{ paddingLeft: depth * 12 }}
      >
        <span className="w-3 text-slate-500">{open ? '▾' : '▸'}</span>
        {label}
        <span className="text-slate-600">
          {isArray ? `[${entries.length}]` : `{${entries.length}}`}
        </span>
      </button>
      {open ? (
        <div>
          {entries.map(([key, child]) => (
            <JsonNode
              key={key}
              name={isArray ? `[${key}]` : key}
              value={child}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function SchemaViewerWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const mcp = useMcp()
  const [text, setText] = useState(() => readString(initial, 'json', DEFAULT_JSON))
  const [sent, setSent] = useState(false)

  const parsed = useMemo(() => parseJson(text), [text])
  const summary = useMemo(
    () => (parsed.valid ? summarizeJsonLd(parsed.value) : undefined),
    [parsed],
  )

  async function askAi() {
    if (!mcp.connected) return
    await mcp.sendMessage(
      `Analyze this JSON-LD / structured data and summarize its meaning, correctness and SEO implications:\n\n${formatJson(text)}`,
    )
    setSent(true)
    window.setTimeout(() => setSent(false), 2000)
  }

  return (
    <WidgetShell title={d.title} icon="🧩">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">{d.input}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setText((t) => formatJson(t))}
                className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-300 transition hover:border-brand-400/60 hover:text-white"
              >
                {d.format}
              </button>
              <span
                className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                  parsed.valid
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-rose-500/15 text-rose-300'
                }`}
              >
                {parsed.valid ? d.valid : `✕ ${d.invalid}`}
              </span>
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
          {!parsed.valid ? (
            <p className="text-xs text-rose-400">
              {parsed.error}
              {parsed.errorLine ? ` (${d.line} ${parsed.errorLine})` : ''}
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          {summary ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                <Chip label={d.nodes} value={String(summary.nodeCount)} />
                {summary.context ? <Chip label={d.context} value={summary.context} /> : null}
                {summary.types.map((type) => (
                  <Chip key={type} label={d.types} value={type} />
                ))}
              </div>
              {!summary.looksLikeJsonLd ? (
                <p className="text-xs text-amber-400">{d.notJsonLd}</p>
              ) : null}
              <div>
                <div className="mb-1.5 text-xs font-medium text-slate-300">{d.tree}</div>
                <div className="max-h-72 overflow-auto rounded-lg border border-white/8 bg-ink-900/60 p-3 font-mono text-xs leading-relaxed">
                  <JsonNode name="$" value={parsed.value} />
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">{d.empty}</p>
          )}
        </div>
      </div>
      {mcp.connected ? (
        <button
          type="button"
          onClick={askAi}
          className="mt-4 w-full rounded-lg bg-brand-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-500"
        >
          {sent ? d.sent : d.askAi}
        </button>
      ) : null}
    </WidgetShell>
  )
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px]">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[12rem] truncate font-mono text-slate-200">{value}</span>
    </span>
  )
}
