import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { analyzeColor, parseColor, scaleColor } from '@shared/calc/color.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import CopyButton from '../../components/CopyButton.tsx'
import { readString } from '../params.ts'

type Dict = Record<string, string>

const T: Record<Locale, Dict> = {
  en: {
    title: 'Color Studio & Contrast',
    color: 'Color (hex / rgb / hsl)',
    invalid: 'Unrecognized color format',
    contrast: 'Contrast',
    vsWhite: 'on white',
    vsBlack: 'on black',
    luminance: 'Luminance',
    scale: 'Tints & shades',
    best: 'Recommended text',
    pass: 'Pass',
    fail: 'Fail',
    note: 'WCAG thresholds: AA 4.5:1, AAA 7:1.',
  },
  zh: {
    title: '颜色工具与对比度',
    color: '颜色（hex / rgb / hsl）',
    invalid: '无法识别的颜色格式',
    contrast: '对比度',
    vsWhite: '白底',
    vsBlack: '黑底',
    luminance: '亮度',
    scale: '深浅色阶',
    best: '推荐文字色',
    pass: '通过',
    fail: '不通过',
    note: 'WCAG 阈值：AA 4.5:1，AAA 7:1。',
  },
}

function Badge({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
        ok ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
      }`}
    >
      {label}
    </span>
  )
}

export default function ColorStudioWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [color, setColor] = useState(() => readString(initial, 'color', '#6366f1'))
  const info = useMemo(() => analyzeColor(color), [color])
  const rgb = useMemo(() => parseColor(color), [color])
  const scale = useMemo(() => (rgb ? scaleColor(rgb, 4) : []), [rgb])

  return (
    <WidgetShell title={d.title} icon="🎨" footer={d.note}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="h-14 w-14 flex-shrink-0 rounded-xl border border-white/10"
            style={{ backgroundColor: info.valid ? info.hex : '#000' }}
          />
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            spellCheck={false}
            className={`w-full rounded-lg border bg-ink-950 px-3 py-2 font-mono text-sm outline-none ${
              info.valid ? 'border-white/10 text-accent-300 focus:border-brand-400' : 'border-rose-500/40 text-rose-300'
            }`}
          />
        </div>

        {!info.valid ? (
          <p className="text-sm text-rose-400">{d.invalid}</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'HEX', value: info.hex ?? '' },
                { label: 'RGB', value: `${info.rgb?.r}, ${info.rgb?.g}, ${info.rgb?.b}` },
                { label: 'HSL', value: `${info.hsl?.h}°, ${info.hsl?.s}%, ${info.hsl?.l}%` },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/8 bg-ink-900/50 p-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">{item.label}</div>
                  <div className="mt-0.5 break-all font-mono text-xs text-slate-200">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ['vsWhite', d.vsWhite, info.contrastWhite, info.aaWhite, info.aaaWhite, '#ffffff'],
                  ['vsBlack', d.vsBlack, info.contrastBlack, info.aaBlack, info.aaaBlack, '#000000'],
                ] as const
              ).map(([key, label, ratio, aa, aaa, bg]) => (
                <div
                  key={key}
                  className="rounded-lg border border-white/8 p-2"
                  style={{ backgroundColor: bg }}
                >
                  <div
                    className="flex items-center justify-between text-xs font-medium"
                    style={{ color: key === 'vsWhite' ? '#0b0f19' : '#e5e7eb' }}
                  >
                    <span>{label}</span>
                    <span className="font-mono">{ratio}:1</span>
                  </div>
                  <div className="mt-1 flex gap-1">
                    <Badge label={`AA ${aa ? d.pass : d.fail}`} ok={aa} />
                    <Badge label={`AAA ${aaa ? d.pass : d.fail}`} ok={aaa} />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">{d.scale}</span>
                <span className="text-[11px] text-slate-500">
                  {d.luminance}: {info.luminance}
                </span>
              </div>
              <div className="flex overflow-hidden rounded-lg">
                {scale.map((step) => (
                  <div key={step.label} className="flex-1" title={`${step.label} ${step.hex}`}>
                    <div className="h-8" style={{ backgroundColor: step.hex }} />
                    <div className="bg-ink-900 py-0.5 text-center text-[9px] text-slate-500">{step.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                {d.best}: <span className="font-medium text-slate-200">{info.bestTextColor}</span>
              </span>
              <CopyButton value={info.hex ?? ''} />
            </div>
          </>
        )}
      </div>
    </WidgetShell>
  )
}
