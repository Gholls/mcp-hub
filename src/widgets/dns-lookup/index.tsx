import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Segmented, WidgetShell } from '../../components/ui.tsx'
import { useMcp } from '../../lib/mcp-app.ts'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'DNS Lookup', domain: 'Domain', type: 'Type', lookup: 'Look up', records: 'Records', note: 'Resolve DNS records over DNS-over-HTTPS.' },
  zh: { title: 'DNS 查询', domain: '域名', type: '记录类型', lookup: '查询', records: '记录', note: '通过 DoH 解析 DNS 记录。' },
}

interface Answer {
  name: string
  type: number
  TTL: number
  data: string
}

const TYPE_NAMES: Record<number, string> = { 1: 'A', 2: 'NS', 5: 'CNAME', 15: 'MX', 16: 'TXT', 28: 'AAAA', 6: 'SOA' }

export default function DnsLookupWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const mcp = useMcp()
  const [domain, setDomain] = useState('mcp.gholl.com')
  const [type, setType] = useState('A')
  const [answers, setAnswers] = useState<Answer[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function lookup() {
    setBusy(true)
    setError('')
    setAnswers([])
    try {
      const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, {
        headers: { accept: 'application/dns-json' },
      })
      const json = (await res.json()) as { Answer?: Answer[] }
      setAnswers(json.Answer ?? [])
    } catch {
      setError(mcp.connected ? 'Lookup failed' : 'Network blocked — open inside an MCP host')
    } finally {
      setBusy(false)
    }
  }

  return (
    <WidgetShell title={d.title} icon="🌐" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Field label={d.domain}>
            <input value={domain} onChange={(e) => setDomain(e.target.value)} spellCheck={false} className="rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-sm text-slate-200 outline-none focus:border-brand-400" />
          </Field>
          <Field label={d.type}>
            <Segmented value={type} onChange={setType} options={['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'].map((t) => ({ value: t, label: t }))} />
          </Field>
          <button type="button" onClick={lookup} disabled={busy || !domain.trim()} className="rounded-lg bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2 text-sm font-medium text-ink-950 transition hover:opacity-90 disabled:opacity-50">
            {d.lookup}
          </button>
        </div>
        {error ? <p className="text-xs text-amber-400">{error}</p> : null}
        {answers.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {answers.map((a, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg border border-white/8 bg-ink-900/50 px-3 py-2 text-xs">
                <span className="rounded bg-brand-500/15 px-2 py-0.5 font-mono text-[11px] text-brand-200">{TYPE_NAMES[a.type] ?? a.type}</span>
                <span className="min-w-0 flex-1 break-all font-mono text-slate-200">{a.data}</span>
                <span className="text-slate-500">TTL {a.TTL}</span>
              </li>
            ))}
          </ul>
        ) : !busy && !error ? (
          <p className="text-sm text-slate-500">—</p>
        ) : null}
      </div>
    </WidgetShell>
  )
}
