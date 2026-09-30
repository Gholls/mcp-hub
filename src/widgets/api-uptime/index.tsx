import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import {
  isValidHttpUrl,
  summarize,
  synthesizeSeries,
  type UptimeSample,
} from '@shared/calc/uptime.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Segmented, StatCard, WidgetShell } from '../../components/ui.tsx'
import { useMcp } from '../../lib/mcp-app.ts'
import { readEnum, readString } from '../params.ts'

type Dict = Record<string, string>

const T: Record<Locale, Dict> = {
  en: {
    title: 'API Health & Latency',
    endpoint: 'Endpoint URL',
    method: 'Method',
    ping: 'Run live ping',
    pinging: 'Pinging…',
    uptime: '24h uptime',
    avg: 'Avg latency',
    p95: 'p95 latency',
    last: 'Last probe',
    invalid: 'Enter a valid http(s) URL',
    sampleNote: '24h series is illustrative sample data; the live ping is a real request.',
    reachable: 'Reachable',
    unreachable: 'Unreachable',
  },
  zh: {
    title: 'API 健康度与延迟',
    endpoint: '接口地址',
    method: '请求方法',
    ping: '发起 Live Ping',
    pinging: '测试中…',
    uptime: '24h 可用率',
    avg: '平均延迟',
    p95: 'p95 延迟',
    last: '最近一次探测',
    invalid: '请输入合法的 http(s) 地址',
    sampleNote: '24 小时曲线为示例数据；Live Ping 为真实请求。',
    reachable: '可达',
    unreachable: '不可达',
  },
}

function LatencyChart({ samples }: { samples: UptimeSample[] }) {
  const width = 320
  const height = 96
  const pad = 6
  const maxLatency = Math.max(100, ...samples.filter((s) => s.ok).map((s) => s.latencyMs))
  const ok = samples.filter((s) => s.ok)
  const points = ok.map((s, i) => {
    const x = pad + (i / Math.max(1, samples.length - 1)) * (width - pad * 2)
    const y = height - pad - (s.latencyMs / maxLatency) * (height - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const failed = samples.filter((s) => !s.ok)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="latency-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,211,238,0.35)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0)" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={pad}
          x2={width - pad}
          y1={pad + f * (height - pad * 2)}
          y2={pad + f * (height - pad * 2)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
      {points.length > 1 ? (
        <>
          <polygon
            points={`${pad},${height - pad} ${points.join(' ')} ${width - pad},${height - pad}`}
            fill="url(#latency-fill)"
          />
          <polyline points={points.join(' ')} fill="none" stroke="#22d3ee" strokeWidth="1.5" />
        </>
      ) : null}
      {failed.map((s, i) => {
        const idx = samples.indexOf(s)
        const x = pad + (idx / Math.max(1, samples.length - 1)) * (width - pad * 2)
        return <circle key={i} cx={x} cy={height - pad} r="2.5" fill="#f43f5e" />
      })}
    </svg>
  )
}

export default function ApiUptimeWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const mcp = useMcp()
  const [endpoint, setEndpoint] = useState(() => readString(initial, 'endpoint', 'https://api.github.com/'))
  const [method, setMethod] = useState(() => readEnum(initial, 'method', ['GET', 'HEAD'], 'HEAD'))
  const [samples, setSamples] = useState<UptimeSample[]>(() =>
    synthesizeSeries(readString(initial, 'endpoint', 'https://api.github.com/')),
  )
  const [ping, setPing] = useState<{ ok: boolean; reachable: boolean; latencyMs: number } | null>(null)
  const [pinging, setPinging] = useState(false)

  const valid = isValidHttpUrl(endpoint)
  const stats = summarize(samples)

  async function runPing() {
    if (!valid || pinging) return
    setPinging(true)
    try {
      if (mcp.connected) {
        const result = await mcp.callTool('api-uptime', { endpoint, method, locale })
        const structured = result.structuredContent as
          | { ok?: boolean; reachable?: boolean; latencyMs?: number }
          | undefined
        if (structured && typeof structured.latencyMs === 'number') {
          const reachable = structured.reachable ?? !!structured.ok
          setPing({ ok: !!structured.ok, reachable, latencyMs: structured.latencyMs })
          setSamples((prev) => [
            ...prev.slice(1),
            { t: Date.now(), latencyMs: structured.latencyMs as number, ok: reachable },
          ])
          return
        }
      }
      const start = performance.now()
      let ok = true
      try {
        await fetch(endpoint, { method, mode: 'no-cors' })
      } catch {
        ok = false
      }
      const latencyMs = Math.round(performance.now() - start)
      setPing({ ok, reachable: ok, latencyMs })
      setSamples((prev) => [...prev.slice(1), { t: Date.now(), latencyMs, ok }])
    } finally {
      setPinging(false)
    }
  }

  return (
    <WidgetShell title={d.title} icon="📡" footer={d.sampleNote}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Field
            label={d.endpoint}
            hint={!valid ? <span className="text-rose-400">{d.invalid}</span> : undefined}
          >
            <input
              value={endpoint}
              onChange={(e) => {
                setEndpoint(e.target.value)
                setPing(null)
              }}
              spellCheck={false}
              className={`w-full rounded-lg border bg-ink-950 px-3 py-2 font-mono text-sm outline-none ${
                valid ? 'border-white/10 text-accent-300 focus:border-brand-400' : 'border-rose-500/40 text-rose-300'
              }`}
            />
          </Field>
          <Field label={d.method}>
            <Segmented
              value={method}
              onChange={setMethod}
              options={[
                { value: 'GET', label: 'GET' },
                { value: 'HEAD', label: 'HEAD' },
              ]}
            />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              disabled={!valid || pinging}
              onClick={runPing}
              className="rounded-lg bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2 text-sm font-medium text-ink-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pinging ? d.pinging : d.ping}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label={d.uptime} value={stats.uptimePercent.toFixed(2)} unit="%" accent="text-emerald-400" />
          <StatCard label={d.avg} value={Math.round(stats.avgLatencyMs)} unit="ms" />
          <StatCard label={d.p95} value={Math.round(stats.p95LatencyMs)} unit="ms" />
        </div>

        <div className="rounded-xl border border-white/8 bg-ink-900/50 p-2">
          <LatencyChart samples={samples} />
        </div>

        {ping ? (
          <div
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
              ping.ok
                ? 'bg-emerald-500/10 text-emerald-300'
                : ping.reachable
                  ? 'bg-amber-500/10 text-amber-300'
                  : 'bg-rose-500/10 text-rose-300'
            }`}
          >
            <span>{ping.reachable ? d.reachable : d.unreachable}</span>
            <span className="font-mono">
              {d.last}: {ping.latencyMs}ms
            </span>
          </div>
        ) : null}
      </div>
    </WidgetShell>
  )
}
