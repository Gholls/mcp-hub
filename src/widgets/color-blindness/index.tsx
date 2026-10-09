import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { CVD_TYPES, simulate } from '@shared/calc/colorblind.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, WidgetShell } from '../../components/ui.tsx'
import CopyButton from '../../components/CopyButton.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Color Blindness Simulator', base: 'Color', note: 'Preview how a color looks with different color-vision deficiencies.' },
  zh: { title: '色盲模拟', base: '颜色', note: '预览色觉异常者看到的颜色效果。' },
}

export default function ColorBlindnessWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [base, setBase] = useState('#e11d48')

  return (
    <WidgetShell title={d.title} icon="👁️" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Field label={d.base}>
            <input type="color" value={base} onChange={(e) => setBase(e.target.value)} className="h-10 w-20 cursor-pointer rounded-lg border border-white/10 bg-ink-950" />
          </Field>
          <code className="rounded-lg bg-ink-950 px-3 py-2 font-mono text-sm text-slate-300">{base}</code>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CVD_TYPES.map((t) => {
            const hex = simulate(base, t.id)
            return (
              <div key={t.id} className="overflow-hidden rounded-xl border border-white/10">
                <div className="h-24" style={{ background: hex }} />
                <div className="flex items-center justify-between gap-1 bg-ink-900/60 px-2 py-1.5">
                  <span className="text-[11px] text-slate-300">{t.label[locale]}</span>
                  <CopyButton value={hex} label={hex} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </WidgetShell>
  )
}
