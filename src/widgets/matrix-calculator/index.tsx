import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { determinant, multiply, parseMatrix, transpose, type Matrix } from '@shared/calc/matrix.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: { title: 'Matrix Calculator', a: 'Matrix A', b: 'Matrix B', multiply: 'A × B', det: 'det(A)', transpose: 'Aᵀ', result: 'Result', note: 'Multiply, transpose and determinant (rows = new line).' },
  zh: { title: '矩阵计算', a: '矩阵 A', b: '矩阵 B', multiply: 'A × B', det: 'det(A)', transpose: 'Aᵀ', result: '结果', note: '乘法、转置与行列式（每行一行）。' },
}

function Grid({ m }: { m: Matrix }) {
  return (
    <div className="inline-flex flex-col gap-1">
      {m.map((row, i) => (
        <div key={i} className="flex gap-1">
          {row.map((v, j) => (
            <span key={j} className="grid h-8 w-12 place-items-center rounded-md bg-gradient-to-br from-brand-500/20 to-accent-500/10 font-mono text-xs text-slate-100">
              {Math.round(v * 1e4) / 1e4}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function MatrixCalculatorWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [textA, setTextA] = useState('1 2\n3 4')
  const [textB, setTextB] = useState('5 6\n7 8')
  const [result, setResult] = useState<{ m?: Matrix; label: string; error?: string } | null>(null)

  function run(kind: 'multiply' | 'transpose' | 'det') {
    const a = parseMatrix(textA)
    if (kind === 'transpose') {
      setResult({ m: transpose(a), label: d.transpose })
      return
    }
    if (kind === 'det') {
      const value = determinant(a)
      setResult(value === null ? { label: d.det, error: 'Not square' } : { label: `${d.det} = ${Math.round(value * 1e6) / 1e6}` })
      return
    }
    const product = multiply(a, parseMatrix(textB))
    setResult(product ? { m: product, label: d.multiply } : { label: d.multiply, error: 'Dimension mismatch' })
  }

  return (
    <WidgetShell title={d.title} icon="🧮" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1 text-[11px] font-medium text-slate-400">{d.a}</div>
            <textarea value={textA} onChange={(e) => setTextA(e.target.value)} rows={3} spellCheck={false} className="w-full resize-y rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-brand-400" />
          </div>
          <div>
            <div className="mb-1 text-[11px] font-medium text-slate-400">{d.b}</div>
            <textarea value={textB} onChange={(e) => setTextB(e.target.value)} rows={3} spellCheck={false} className="w-full resize-y rounded-lg border border-white/10 bg-ink-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-brand-400" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['multiply', 'transpose', 'det'] as const).map((k) => (
            <button key={k} type="button" onClick={() => run(k)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-brand-400/60 hover:text-white">
              {d[k]}
            </button>
          ))}
        </div>
        {result ? (
          <div className="rounded-xl border border-white/8 bg-ink-900/50 p-3">
            <div className="mb-2 text-[11px] font-medium text-slate-400">{result.error ? result.label : result.label}</div>
            {result.error ? <span className="text-sm text-rose-400">{result.error}</span> : result.m ? <Grid m={result.m} /> : <span className="font-mono text-lg text-accent-300">{result.label}</span>}
          </div>
        ) : null}
      </div>
    </WidgetShell>
  )
}
