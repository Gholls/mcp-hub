import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { decodeJwt } from '@shared/calc/jwt.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import { readString } from '../params.ts'

type Dict = Record<string, string>

const T: Record<Locale, Dict> = {
  en: {
    title: 'JWT Decoder',
    token: 'Token',
    header: 'Header',
    payload: 'Payload',
    claims: 'Claims',
    valid: 'Decoded',
    invalid: 'Invalid token',
    expired: 'Expired',
    active: 'Active',
    expiresIn: 'Expires in',
    expiresAt: 'Expires at',
    issuedAt: 'Issued at',
    notBefore: 'Not before',
    signature: 'Signature (not verified)',
    days: 'd', hours: 'h', minutes: 'm', seconds: 's',
    signNote: 'Signature is decoded only, never verified here.',
  },
  zh: {
    title: 'JWT 解析器',
    token: 'Token',
    header: '头部',
    payload: '载荷',
    claims: '声明',
    valid: '解析成功',
    invalid: 'Token 无效',
    expired: '已过期',
    active: '有效',
    expiresIn: '剩余有效期',
    expiresAt: '过期时间',
    issuedAt: '签发时间',
    notBefore: '生效时间',
    signature: '签名（未校验）',
    days: '天', hours: '小时', minutes: '分', seconds: '秒',
    signNote: '仅解码签名，不在此处校验。',
  },
}

const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxOTAwMDAwMDAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

function humanize(seconds: number, d: Dict): string {
  const abs = Math.abs(seconds)
  const days = Math.floor(abs / 86400)
  const hours = Math.floor((abs % 86400) / 3600)
  const minutes = Math.floor((abs % 3600) / 60)
  const secs = abs % 60
  if (days > 0) return `${days}${d.days} ${hours}${d.hours}`
  if (hours > 0) return `${hours}${d.hours} ${minutes}${d.minutes}`
  if (minutes > 0) return `${minutes}${d.minutes} ${secs}${d.seconds}`
  return `${secs}${d.seconds}`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString()
}

export default function JwtDecoderWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [token, setToken] = useState(() => readString(initial, 'token', SAMPLE))
  const result = useMemo(() => decodeJwt(token), [token])

  return (
    <WidgetShell title={d.title} icon="🔑" footer={d.signNote}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300">{d.token}</span>
          <span
            className={`rounded-md px-2 py-1 text-[11px] font-medium ${
              !result.valid
                ? 'bg-rose-500/15 text-rose-300'
                : result.expired
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-emerald-500/15 text-emerald-300'
            }`}
          >
            {!result.valid ? d.invalid : result.expired ? d.expired : d.active}
          </span>
        </div>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={4}
          spellCheck={false}
          className="w-full resize-y break-all rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-brand-400"
        />

        {!result.valid ? (
          <p className="text-sm text-rose-400">{result.error}</p>
        ) : (
          <>
            {result.claims?.exp !== undefined ? (
              <div className="flex flex-wrap gap-2 text-xs">
                <span
                  className={`rounded-md px-2 py-1 ${
                    result.expired ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300'
                  }`}
                >
                  {d.expiresIn}:{' '}
                  {result.expiresInSeconds !== undefined ? humanize(result.expiresInSeconds, d) : '—'}
                </span>
                <span className="rounded-md bg-white/5 px-2 py-1 text-slate-400">
                  {d.expiresAt}: {result.expiresAt ? formatTime(result.expiresAt) : '—'}
                </span>
                {result.issuedAt ? (
                  <span className="rounded-md bg-white/5 px-2 py-1 text-slate-400">
                    {d.issuedAt}: {formatTime(result.issuedAt)}
                  </span>
                ) : null}
                {result.notBefore ? (
                  <span className="rounded-md bg-white/5 px-2 py-1 text-slate-400">
                    {d.notBefore}: {formatTime(result.notBefore)}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-3 lg:grid-cols-2">
              {(
                [
                  ['header', d.header, result.header],
                  ['payload', d.payload, result.payload],
                ] as const
              ).map(([key, label, value]) => (
                <div key={key}>
                  <div className="mb-1.5 text-xs font-medium text-slate-300">{label}</div>
                  <pre className="max-h-56 overflow-auto rounded-lg border border-white/8 bg-ink-950 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </div>
              ))}
            </div>

            {result.claims ? (
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {Object.entries(result.claims)
                  .filter(([, v]) => v !== undefined)
                  .map(([k, v]) => (
                    <span key={k} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1">
                      <span className="text-slate-500">{k}</span>
                      <span className="max-w-[16rem] truncate font-mono text-slate-200">
                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </span>
                    </span>
                  ))}
              </div>
            ) : null}
            {result.signature ? (
              <div className="text-[11px] text-slate-500">
                <span className="text-slate-400">{d.signature}:</span>{' '}
                <span className="break-all font-mono">{result.signature}</span>
              </div>
            ) : null}
          </>
        )}
      </div>
    </WidgetShell>
  )
}
