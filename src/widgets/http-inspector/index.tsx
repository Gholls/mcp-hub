import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import { useMcp } from '../../lib/mcp-app.ts'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'HTTP Inspector', url: 'URL', inspect: 'Inspect', status: 'Status', chain: 'Redirect chain', headers: 'Response headers', hint: 'Cross-origin headers can only be read inside an MCP host.', note: 'Fetch a URL and inspect status, redirects and headers.' },
  zh: { title: 'HTTP 响应检查', url: '网址', inspect: '检查', status: '状态', chain: '重定向链', headers: '响应头', hint: '跨域响应头只能在 MCP 宿主内读取。', note: '请求网址并查看状态、重定向与响应头。' },
}

interface InspectResult {
  status: number
  chain: string[]
  headers: Record<string, string>
}

export default function HttpInspectorWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const mcp = useMcp()
  const [url, setUrl] = useState('https://mcp.gholl.com')
  const [result, setResult] = useState<InspectResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function inspect() {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      if (mcp.connected) {
        const res = await mcp.callTool('http-inspector', { url })
        setResult((res.structuredContent as unknown as InspectResult) ?? null)
      } else {
        const res = await fetch(url, { method: 'GET' })
        setResult({ status: res.status, chain: [url], headers: { 'content-type': res.headers.get('content-type') ?? '' } })
      }
    } catch {
      setError(d.hint)
    } finally {
      setBusy(false)
    }
  }

  return (
    <WidgetShell title={d.title} icon="🔍" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} spellCheck={false} aria-label={d.url} className="flex-1 rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-brand-400" />
          <button type="button" onClick={inspect} disabled={busy || !url.trim()} className="rounded-lg bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2 text-sm font-medium text-ink-950 transition hover:opacity-90 disabled:opacity-50">
            {d.inspect}
          </button>
        </div>
        {error ? <p className="text-xs text-amber-400">{error}</p> : null}
        {result ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className={`rounded-md px-2.5 py-1 font-mono text-sm font-bold ${result.status < 400 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>{result.status}</span>
              <div className="flex flex-1 flex-wrap items-center gap-1 text-[11px] text-slate-400">
                {result.chain.map((step, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 ? <span className="text-slate-600">→</span> : null}
                    <span className="break-all">{step}</span>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-medium text-slate-400">{d.headers}</div>
              <ul className="flex flex-col gap-1 rounded-lg border border-white/8 bg-ink-950/50 p-3">
                {Object.entries(result.headers).map(([k, v]) => (
                  <li key={k} className="flex gap-2 text-[11px]">
                    <span className="w-40 flex-shrink-0 text-slate-500">{k}</span>
                    <span className="break-all font-mono text-slate-300">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </WidgetShell>
  )
}
