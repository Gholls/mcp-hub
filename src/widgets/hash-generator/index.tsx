import { useEffect, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import {
  HASH_ALGORITHMS,
  hashText,
  type HashAlgorithm,
  type HashResult,
} from '@shared/calc/hash.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import CopyButton from '../../components/CopyButton.tsx'
import { readString } from '../params.ts'

type Dict = Record<string, string>

const T: Record<Locale, Dict> = {
  en: {
    title: 'Hash Generator',
    input: 'Text',
    algorithms: 'Algorithms',
    bytes: 'bytes',
    lowercase: 'lowercase',
    note: 'Hashing runs locally with the Web Crypto API. Nothing is uploaded.',
    empty: 'Type something to hash.',
  },
  zh: {
    title: '哈希生成器',
    input: '文本',
    algorithms: '算法',
    bytes: '字节',
    lowercase: '小写',
    note: '使用 Web Crypto API 本地计算，不会上传任何内容。',
    empty: '输入内容以计算哈希。',
  },
}

export default function HashGeneratorWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [text, setText] = useState(() => readString(initial, 'text', 'hello world'))
  const [selected, setSelected] = useState<HashAlgorithm[]>(HASH_ALGORITHMS)
  const [results, setResults] = useState<HashResult[]>([])

  useEffect(() => {
    let cancelled = false
    const algorithms = HASH_ALGORITHMS.filter((a) => selected.includes(a))
    if (algorithms.length === 0) {
      setResults([])
      return
    }
    hashText(text, algorithms)
      .then((next) => {
        if (!cancelled) setResults(next)
      })
      .catch(() => {
        if (!cancelled) setResults([])
      })
    return () => {
      cancelled = true
    }
  }, [text, selected])

  function toggle(algorithm: HashAlgorithm) {
    setSelected((prev) =>
      prev.includes(algorithm) ? prev.filter((a) => a !== algorithm) : [...prev, algorithm],
    )
  }

  const byteLength = new TextEncoder().encode(text).length

  return (
    <WidgetShell title={d.title} icon="#️⃣" footer={d.note}>
      <div className="space-y-3">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-xs font-medium text-slate-300">{d.input}</span>
            <span className="font-mono text-xs text-slate-500">
              {byteLength} {d.bytes}
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            spellCheck={false}
            className="w-full resize-y rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-sm text-slate-200 outline-none focus:border-brand-400"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {HASH_ALGORITHMS.map((algorithm) => (
            <button
              key={algorithm}
              type="button"
              onClick={() => toggle(algorithm)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                selected.includes(algorithm)
                  ? 'border-brand-400/60 bg-brand-500/15 text-brand-200'
                  : 'border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              {algorithm}
            </button>
          ))}
        </div>

        {results.length === 0 ? (
          <p className="text-sm text-slate-500">{d.empty}</p>
        ) : (
          <div className="space-y-2">
            {results.map((result) => (
              <div key={result.algorithm} className="rounded-lg border border-white/8 bg-ink-900/50 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-brand-300">
                    {result.algorithm}
                    <span className="ml-2 font-normal text-slate-500">{result.bits} bit</span>
                  </span>
                  <CopyButton value={result.hex} />
                </div>
                <p className="break-all font-mono text-[11px] leading-relaxed text-slate-300">{result.hex}</p>
                <p className="mt-1 break-all font-mono text-[10px] text-slate-500">base64: {result.base64}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetShell>
  )
}
