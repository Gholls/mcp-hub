import { useState } from 'react'
import type { Locale } from '@shared/types.ts'
import {
  estimateVram,
  type Precision,
  type KvPrecision,
  type VramInput,
} from '@shared/calc/vram.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Segmented, Slider, StatCard, WidgetShell } from '../../components/ui.tsx'
import CopyButton from '../../components/CopyButton.tsx'

type Dict = Record<string, string>

const T: Record<Locale, Dict> = {
  en: {
    title: 'GPU VRAM & Deployment Estimator',
    params: 'Model parameters',
    precision: 'Weight precision',
    kvPrecision: 'KV-cache precision',
    context: 'Context length',
    batch: 'Batch size',
    tp: 'Tensor parallel (GPUs)',
    total: 'Total VRAM',
    breakdown: 'Memory breakdown',
    weights: 'Weights',
    kv: 'KV cache',
    activations: 'Activations',
    overhead: 'Overhead',
    recommended: 'Recommended GPU',
    copies: 'Estimated',
    noFit: 'Exceeds a single node — shard across GPUs/NVLink.',
    perGpu: 'per GPU',
    commands: 'Launch commands',
    estimateNote: 'Estimates for capacity planning. Actual usage varies by model, framework and kernel.',
  },
  zh: {
    title: 'GPU 显存与部署预估',
    params: '模型参数量',
    precision: '权重精度',
    kvPrecision: 'KV 缓存精度',
    context: '上下文长度',
    batch: '并发批大小',
    tp: '张量并行（GPU 数）',
    total: '所需显存',
    breakdown: '显存构成',
    weights: '权重',
    kv: 'KV 缓存',
    activations: '激活值',
    overhead: '运行时开销',
    recommended: '推荐 GPU',
    copies: '预估',
    noFit: '超出单卡承载，需要多卡/NVLink 拆分。',
    perGpu: '每卡',
    commands: '启动命令',
    estimateNote: '结果为容量规划估算值，实际占用因模型、框架与算子实现而异。',
  },
}

function num(initial: Record<string, unknown>, key: string, fallback: number): number {
  const raw = initial[key]
  const n = typeof raw === 'string' ? Number(raw) : typeof raw === 'number' ? raw : NaN
  return Number.isFinite(n) ? n : fallback
}

function str<T extends string>(initial: Record<string, unknown>, key: string, allowed: T[], fallback: T): T {
  const raw = initial[key]
  return typeof raw === 'string' && (allowed as string[]).includes(raw) ? (raw as T) : fallback
}

function formatGB(value: number): string {
  if (value < 1) return value.toFixed(2)
  if (value < 10) return value.toFixed(1)
  return Math.round(value).toString()
}

const pct = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0)

export default function VramCalcWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en

  const [modelParamsB, setModelParamsB] = useState(() => num(initial, 'modelParamsB', 7))
  const [precision, setPrecision] = useState<Precision>(() =>
    str(initial, 'precision', ['fp16', 'int8', 'int4'], 'fp16'),
  )
  const [kvPrecision, setKvPrecision] = useState<KvPrecision>(() =>
    str(initial, 'kvPrecision', ['fp16', 'int8'], 'fp16'),
  )
  const [contextLength, setContextLength] = useState(() => num(initial, 'contextLength', 8192))
  const [batchSize, setBatchSize] = useState(() => num(initial, 'batchSize', 1))
  const [tensorParallel, setTensorParallel] = useState(() => num(initial, 'tensorParallel', 1))
  const [cmdTab, setCmdTab] = useState<'vllm' | 'ollama'>('vllm')

  const input: VramInput = { modelParamsB, precision, contextLength, batchSize, kvPrecision, tensorParallel }
  const result = estimateVram(input)

  const bestFit = result.recommendations.find((r) => r.fits)
  const top = bestFit ?? result.recommendations[0]

  const segments = [
    { key: 'weights', label: d.weights, value: result.weightsGB, color: 'bg-brand-500' },
    { key: 'kv', label: d.kv, value: result.kvCacheGB, color: 'bg-accent-500' },
    { key: 'activations', label: d.activations, value: result.activationsGB, color: 'bg-emerald-500' },
    { key: 'overhead', label: d.overhead, value: result.overheadGB, color: 'bg-amber-500' },
  ]

  return (
    <WidgetShell title={d.title} icon="🖥️" footer={d.estimateNote}>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label={d.params} hint={`${modelParamsB}B`}>
            <Slider value={modelParamsB} min={0.5} max={405} step={0.5} onChange={setModelParamsB} />
          </Field>
          <Field label={d.precision}>
            <Segmented
              value={precision}
              onChange={setPrecision}
              options={[
                { value: 'fp16', label: 'FP16' },
                { value: 'int8', label: 'INT8' },
                { value: 'int4', label: 'INT4' },
              ]}
            />
          </Field>
          <Field label={d.kvPrecision}>
            <Segmented
              value={kvPrecision}
              onChange={setKvPrecision}
              options={[
                { value: 'fp16', label: 'FP16' },
                { value: 'int8', label: 'INT8' },
              ]}
            />
          </Field>
          <Field label={d.context} hint={`${(contextLength / 1024).toFixed(1)}K`}>
            <Slider value={contextLength} min={1024} max={131072} step={1024} onChange={setContextLength} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={d.batch} hint={String(batchSize)}>
              <Slider value={batchSize} min={1} max={64} onChange={setBatchSize} />
            </Field>
            <Field label={d.tp} hint={String(tensorParallel)}>
              <Slider value={tensorParallel} min={1} max={8} onChange={setTensorParallel} />
            </Field>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={d.total} value={formatGB(result.totalGB)} unit="GB" accent="text-accent-400" />
            <StatCard
              label={d.recommended}
              value={top ? top.name : '—'}
              accent={top?.fits ? 'text-emerald-400' : 'text-amber-400'}
            />
          </div>

          <div>
            <div className="mb-1.5 text-xs font-medium text-slate-300">{d.breakdown}</div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-ink-900">
              {segments.map((s) => (
                <div
                  key={s.key}
                  className={s.color}
                  style={{ width: `${pct(s.value, result.totalGB)}%` }}
                  title={`${s.label}: ${formatGB(s.value)} GB`}
                />
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {segments.map((s) => (
                <div key={s.key} className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${s.color}`} />
                    {s.label}
                  </span>
                  <span className="font-mono">{formatGB(s.value)} GB</span>
                </div>
              ))}
            </div>
          </div>

          {bestFit ? (
            <p className="text-xs text-slate-400">
              {bestFit.count} × {bestFit.name} · {bestFit.count > 1 ? `${d.perGpu} ` : ''}
              {formatGB(result.totalGB / bestFit.count)} GB {d.copies}
            </p>
          ) : (
            <p className="text-xs text-amber-400">{d.noFit}</p>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">{d.commands}</span>
              <div className="flex gap-1">
                {(['vllm', 'ollama'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setCmdTab(tab)}
                    className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      cmdTab === tab ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-ink-950 p-3 pr-16 font-mono text-[11px] leading-relaxed text-slate-300">
                {result.commands[cmdTab]}
              </pre>
              <div className="absolute right-2 top-2">
                <CopyButton value={result.commands[cmdTab]} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </WidgetShell>
  )
}
