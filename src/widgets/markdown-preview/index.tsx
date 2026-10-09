import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { renderMarkdown } from '@shared/calc/markdown.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import { readString } from '../params.ts'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Markdown Preview', input: 'Markdown', preview: 'Preview', note: 'Write Markdown and see it rendered live.' },
  zh: { title: 'Markdown 预览', input: 'Markdown', preview: '预览', note: '边写 Markdown 边实时预览。' },
}

const SAMPLE = '# Hello\n\nThis is **Markdown** with `inline code`.\n\n- list item\n- [a link](https://mcp.gholl.com)\n\n```js\nconsole.log("hi")\n```'

export default function MarkdownPreviewWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [text, setText] = useState(() => readString(initial, 'markdown', SAMPLE))
  const html = useMemo(() => renderMarkdown(text), [text])

  return (
    <WidgetShell title={d.title} icon="📝" footer={d.note}>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-400">{d.input}</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={14} spellCheck={false} className="w-full resize-y rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-brand-400" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-400">{d.preview}</span>
          <div className="md-preview min-h-[280px] overflow-auto rounded-lg border border-white/8 bg-ink-950/50 px-4 py-3" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </WidgetShell>
  )
}
