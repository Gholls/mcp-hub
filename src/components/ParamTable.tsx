import type { JsonSchema } from '@shared/types.ts'
import { useI18n } from '../lib/i18n.tsx'

interface PropShape {
  type?: string | string[]
  description?: string
  enum?: unknown[]
  default?: unknown
  items?: { type?: string }
  minimum?: number
  maximum?: number
}

function typeLabel(prop: PropShape): string {
  if (Array.isArray(prop.enum) && prop.enum.length > 0) {
    return prop.enum.map((v) => String(v)).join(' | ')
  }
  const type = Array.isArray(prop.type) ? prop.type.join(' | ') : prop.type
  if (type === 'array' && prop.items?.type) return `${prop.items.type}[]`
  return type ?? 'any'
}

function formatDefault(value: unknown): string {
  return typeof value === 'string' ? `"${value}"` : JSON.stringify(value)
}

/** Renders a tool's JSON Schema input properties as a readable table. */
export default function ParamTable({ schema }: { schema: JsonSchema }) {
  const { t } = useI18n()
  const required = new Set(schema.required ?? [])
  const entries = Object.entries(schema.properties ?? {}) as [string, PropShape][]

  if (entries.length === 0) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04]">
      <div className="border-b border-white/8 px-5 py-3">
        <h2 className="text-sm font-semibold text-white">{t('params.title')}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-5 py-2 font-medium">{t('params.name')}</th>
              <th className="px-5 py-2 font-medium">{t('params.type')}</th>
              <th className="px-5 py-2 font-medium">{t('params.desc')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([name, prop]) => (
              <tr key={name} className="border-t border-white/5 align-top">
                <td className="whitespace-nowrap px-5 py-3">
                  <span className="font-mono text-xs text-brand-300">{name}</span>
                  <span
                    className={`ml-2 rounded px-1.5 py-0.5 text-[10px] ${
                      required.has(name)
                        ? 'bg-rose-500/15 text-rose-300'
                        : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    {required.has(name) ? t('params.required') : t('params.optional')}
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-accent-300">
                    {typeLabel(prop)}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-400">
                  {prop.description ?? '—'}
                  {prop.default !== undefined ? (
                    <span className="ml-1 text-slate-500">
                      ({t('params.default')}: {formatDefault(prop.default)})
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
