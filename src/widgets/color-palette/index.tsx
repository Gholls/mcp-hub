import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { bestForeground, paletteFrom } from '@shared/calc/palette.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, WidgetShell } from '../../components/ui.tsx'
import CopyButton from '../../components/CopyButton.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Color Palette', base: 'Base color', note: 'Harmonious palette generated from a base color.' },
  zh: { title: '调色板', base: '基色', note: '从基色生成协调配色。' },
}

export default function ColorPaletteWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [base, setBase] = useState('#6366f1')
  const palette = paletteFrom(base)

  return (
    <WidgetShell title={d.title} icon="🎨" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Field label={d.base}>
            <input type="color" value={base} onChange={(e) => setBase(e.target.value)} className="h-10 w-20 cursor-pointer rounded-lg border border-white/10 bg-ink-950" />
          </Field>
          <code className="rounded-lg bg-ink-950 px-3 py-2 font-mono text-sm text-slate-300">{base}</code>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {palette.map((hex) => (
            <div key={hex} className="group flex flex-col overflow-hidden rounded-xl border border-white/10">
              <div className="flex h-24 items-end justify-center p-1" style={{ background: hex }}>
                <CopyButton value={hex} label={hex} />
              </div>
              <div className="px-1 py-1 text-center font-mono text-[10px]" style={{ background: bestForeground(hex) === '#000000' ? '#ffffff' : '#0b0f19', color: bestForeground(hex) }}>
                {hex}
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetShell>
  )
}
