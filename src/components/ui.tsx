import type { ReactNode } from 'react'
import { useMcp } from '../lib/mcp-app.ts'

const BRAND_URL = 'https://gholl.com/?utm_source=mcp-hub&utm_medium=widget&utm_campaign=powered-by'

/** Lightweight brand exposure shown at the bottom of every widget. */
function BrandLink() {
  const { openLink } = useMcp()
  return (
    <button
      type="button"
      onClick={() => void openLink(BRAND_URL)}
      className="flex-shrink-0 whitespace-nowrap text-slate-500 transition hover:text-slate-300"
    >
      Powered by <span className="font-medium text-brand-400">gholl.com</span>
    </button>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        {hint ? <span className="font-mono text-xs text-brand-300">{hint}</span> : null}
      </div>
      {children}
    </label>
  )
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-600 accent-brand-500"
    />
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex rounded-lg border border-white/10 bg-ink-900/70 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
            value === option.value
              ? 'bg-brand-500 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function StatCard({
  label,
  value,
  unit,
  accent,
}: {
  label: string
  value: string | number
  unit?: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-ink-900/60 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-0.5 font-mono text-lg font-semibold ${accent ?? 'text-white'}`}>
        {value}
        {unit ? <span className="ml-0.5 text-xs font-normal text-slate-400">{unit}</span> : null}
      </div>
    </div>
  )
}

export function WidgetShell({
  title,
  icon,
  children,
  footer,
}: {
  title: string
  icon?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-800/60 shadow-xl shadow-black/20">
      <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
        {icon ? <span className="text-base">{icon}</span> : null}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
      <div className="flex items-center justify-between gap-3 border-t border-white/8 px-4 py-2 text-xs text-slate-500">
        <span className="min-w-0 flex-1 truncate">{footer}</span>
        <BrandLink />
      </div>
    </div>
  )
}
