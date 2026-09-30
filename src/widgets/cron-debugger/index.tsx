import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { CRON_PRESETS, describeCron, nextRuns, parseCron } from '@shared/calc/cron.ts'
import { testRegex } from '@shared/calc/regex.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Segmented, WidgetShell } from '../../components/ui.tsx'
import { readEnum, readString } from '../params.ts'

type Dict = Record<string, string>

const T: Record<Locale, Dict> = {
  en: {
    title: 'Cron & Regex Debugger',
    cron: 'Cron',
    regex: 'Regex',
    expression: 'Cron expression',
    presets: 'Presets',
    schedule: 'Schedule',
    next: 'Next runs',
    invalid: 'Invalid expression',
    pattern: 'Pattern',
    flags: 'Flags',
    sample: 'Sample text',
    matches: 'matches',
    groups: 'Groups',
    matchIndex: 'Index',
    noMatch: 'No matches',
  },
  zh: {
    title: 'Cron / 正则调试器',
    cron: 'Cron',
    regex: '正则',
    expression: 'Cron 表达式',
    presets: '常用示例',
    schedule: '执行计划',
    next: '未来 5 次执行',
    invalid: '表达式无效',
    pattern: '正则表达式',
    flags: '修饰符',
    sample: '测试文本',
    matches: '个匹配',
    groups: '捕获组',
    matchIndex: '位置',
    noMatch: '无匹配',
  },
}

const formatter = (locale: Locale) =>
  new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

export default function CronDebuggerWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [tab, setTab] = useState<'cron' | 'regex'>('cron')
  const [cron, setCron] = useState(() => readString(initial, 'cron', '*/5 * * * *'))
  const [pattern, setPattern] = useState(() => readString(initial, 'regex', '\\b\\w+@\\w+\\.\\w+\\b'))
  const [flags, setFlags] = useState(() => readEnum(initial, 'flags', ['g', 'gi', 'gm', 'i', 'm', 'gim'], 'g'))
  const [text, setText] = useState(() =>
    readString(initial, 'text', 'Contact ada@gholl.com or alan@example.org before 09:30.'),
  )

  const parsed = parseCron(cron)
  const runs = nextRuns(parsed, 5)
  const fmt = formatter(locale)
  const regex = testRegex(pattern, flags, text)

  return (
    <WidgetShell title={d.title} icon="⏱️">
      <div className="mb-4 w-40">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'cron', label: d.cron },
            { value: 'regex', label: d.regex },
          ]}
        />
      </div>

      {tab === 'cron' ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <Field label={d.expression}>
              <input
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                spellCheck={false}
                className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-sm text-accent-300 outline-none focus:border-brand-400"
              />
            </Field>
            <div>
              <div className="mb-1.5 text-xs font-medium text-slate-300">{d.presets}</div>
              <div className="flex flex-wrap gap-1.5">
                {CRON_PRESETS.map((p) => (
                  <button
                    key={p.expr}
                    type="button"
                    onClick={() => setCron(p.expr)}
                    className="rounded-md border border-white/10 px-2 py-1 font-mono text-[11px] text-slate-300 transition hover:border-brand-400/60 hover:text-white"
                  >
                    {p.expr}
                  </button>
                ))}
              </div>
            </div>
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                parsed.valid
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              <div className="text-[11px] uppercase tracking-wide opacity-70">
                {parsed.valid ? d.schedule : d.invalid}
              </div>
              <div className="mt-0.5">{parsed.valid ? describeCron(parsed, locale) : parsed.error}</div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-xs font-medium text-slate-300">{d.next}</div>
            <ol className="overflow-hidden rounded-lg border border-white/8">
              {runs.length === 0 ? (
                <li className="px-3 py-2 text-sm text-slate-500">—</li>
              ) : (
                runs.map((run, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 border-b border-white/5 px-3 py-2 text-sm last:border-0"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded bg-white/5 font-mono text-[11px] text-slate-400">
                      {i + 1}
                    </span>
                    <span className="text-slate-200">{fmt.format(run)}</span>
                  </li>
                ))
              )}
            </ol>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Field label={d.pattern}>
              <input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                spellCheck={false}
                className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-sm text-accent-300 outline-none focus:border-brand-400"
              />
            </Field>
            <Field label={d.flags}>
              <input
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                spellCheck={false}
                className="w-20 rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-sm text-accent-300 outline-none focus:border-brand-400"
              />
            </Field>
          </div>
          <Field label={d.sample}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              spellCheck={false}
              className="w-full resize-y rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-sm text-slate-200 outline-none focus:border-brand-400"
            />
          </Field>
          <div className="rounded-lg border border-white/8 bg-ink-900/60 p-3 font-mono text-sm leading-relaxed">
            {regex.segments.length === 0 ? (
              <span className="text-slate-500">—</span>
            ) : (
              regex.segments.map((seg, i) =>
                seg.match ? (
                  <mark key={i} className="rounded bg-brand-500/40 px-0.5 text-white">
                    {seg.text}
                  </mark>
                ) : (
                  <span key={i} className="text-slate-300">
                    {seg.text}
                  </span>
                ),
              )
            )}
          </div>
          <div className="text-xs text-slate-400">
            {regex.valid ? (
              <span>
                <span className="font-mono text-brand-300">{regex.matches.length}</span> {d.matches}
              </span>
            ) : (
              <span className="text-rose-400">{regex.error}</span>
            )}
          </div>
        </div>
      )}
    </WidgetShell>
  )
}
