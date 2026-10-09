import { useMemo, useState } from 'react'
import { useEffect } from 'react'
import type { Locale } from '@shared/types.ts'
import {
  GRAPHER_FAMILIES,
  defaultParams,
  features,
  getFamily,
  sampleFamily,
  substitutedLatex,
  type GrapherFamilyId,
  type ParamValues,
} from '@shared/calc/grapher.ts'
import type { EChartsOption } from '@shared/calc/echarts.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Slider, WidgetShell } from '../../components/ui.tsx'
import CopyButton from '../../components/CopyButton.tsx'
import MathTex from '../../components/Math.tsx'
import { useECharts } from '../../lib/use-echarts.ts'
import { useMcp } from '../../lib/mcp-app.ts'
import { readString } from '../params.ts'

type Dict = Record<string, string>

const T: Record<Locale, Dict> = {
  en: {
    title: 'Function Grapher',
    junior: 'Junior high',
    senior: 'Senior high',
    features: 'Key features',
    equation: 'Equation',
    explain: 'Ask AI to explain',
    quiz: 'Ask AI for a quiz',
    copied: 'Copied',
    drag: 'Drag to pan, scroll to zoom',
    note: 'Pick a function family, adjust the sliders, and watch the curve update.',
    sos: 'Explain this function graph',
    quizMsg: 'Create one practice problem about this function',
  },
  zh: {
    title: '函数图像绘制器',
    junior: '初中',
    senior: '高中',
    features: '图像特征',
    equation: '函数表达式',
    explain: '让 AI 讲解',
    quiz: '让 AI 出题',
    copied: '已复制',
    drag: '拖动平移，滚轮缩放',
    note: '选择函数类型，拖动滑块，图像实时变化。',
    sos: '讲解这个函数图像',
    quizMsg: '针对这个函数出一道练习题',
  },
}

function buildOption(
  familyId: GrapherFamilyId,
  params: ParamValues,
  points: { x: number; y: number | null }[],
  domain: [number, number],
): EChartsOption {
  const [x0, x1] = domain
  const data = points.map((p) => [p.x, p.y])

  const markLines: Record<string, number>[] = []
  if (familyId === 'inverse') markLines.push({ xAxis: 0 }, { yAxis: 0 })
  if (familyId === 'exponential') markLines.push({ yAxis: 0 })
  if (familyId === 'logarithmic') markLines.push({ xAxis: 0 })
  if (familyId === 'quadratic' && (params.a ?? 0) !== 0) {
    markLines.push({ xAxis: -(params.b ?? 0) / (2 * (params.a ?? 1)) })
  }

  const series: Record<string, unknown>[] = [
    {
      type: 'line',
      showSymbol: false,
      connectNulls: false,
      smooth: false,
      data,
      lineStyle: { width: 2.5 },
      markLine:
        markLines.length > 0
          ? {
              silent: true,
              symbol: 'none',
              data: markLines,
              lineStyle: { type: 'dashed', color: 'rgba(148,163,184,0.55)' },
              label: { show: false },
            }
          : undefined,
    },
  ]

  if (familyId === 'exponential' || familyId === 'logarithmic') {
    series.push({
      type: 'line',
      showSymbol: false,
      silent: true,
      data: [
        [x0, x0],
        [x1, x1],
      ],
      lineStyle: { type: 'dashed', width: 1, color: 'rgba(129,140,248,0.6)' },
      tooltip: { show: false },
    })
  }

  return {
    grid: { left: 12, right: 20, top: 20, bottom: 12, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value', min: x0, max: x1, name: 'x' },
    yAxis: { type: 'value', name: 'y' },
    dataZoom: [{ type: 'inside' }],
    series,
  }
}

export default function FunctionGrapherWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const mcp = useMcp()

  const [familyId, setFamilyId] = useState<GrapherFamilyId>(() => {
    const requested = readString(initial, 'family', '')
    return (getFamily(requested)?.id ?? 'quadratic') as GrapherFamilyId
  })
  const family = getFamily(familyId) ?? GRAPHER_FAMILIES[0]
  const [params, setParams] = useState<ParamValues>(() => defaultParams(family))

  useEffect(() => {
    setParams(defaultParams(family))
  }, [family])

  const points = useMemo(() => sampleFamily(family, params), [family, params])
  const option = useMemo(
    () => buildOption(family.id, params, points, family.domain),
    [family, params, points],
  )
  const containerRef = useECharts(option)

  const equation = substitutedLatex(family, params)
  const facts = features(family, params)

  function askAi(kind: 'explain' | 'quiz') {
    const paramText = Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')
    const header = `${d[kind === 'explain' ? 'sos' : 'quizMsg']}: ${family.label[locale]} ${equation} (${paramText}).`
    const ask =
      kind === 'explain'
        ? locale === 'zh'
          ? '请讲解它的图像特征（单调性、顶点/渐近线等）并说明理由。'
          : 'Explain its graph features (monotonicity, vertex/asymptotes) and why.'
        : locale === 'zh'
          ? '请给出一道相关的练习题（含答案）。'
          : 'Give one related practice problem (with the answer).'
    void mcp.sendMessage(`${header}\n${ask}`).catch(() => undefined)
  }

  const stageOf = (stage: 'junior' | 'senior') => GRAPHER_FAMILIES.filter((f) => f.stage === stage)

  return (
    <WidgetShell title={d.title} icon="📈" footer={d.note}>
      <div className="flex flex-col gap-4">
        {(['junior', 'senior'] as const).map((stage) => (
          <div key={stage} className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] uppercase tracking-wide text-slate-500">{d[stage]}</span>
            {stageOf(stage).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFamilyId(f.id)}
                aria-pressed={familyId === f.id}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                  familyId === f.id
                    ? 'border-brand-400/60 bg-brand-500/15 text-brand-200'
                    : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                {f.label[locale]}
              </button>
            ))}
          </div>
        ))}

        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-xl border border-white/8 bg-ink-950/50 p-1">
              <div ref={containerRef} className="h-[320px] w-full" />
            </div>
            <p className="text-[11px] text-slate-500">{d.drag}</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-white/8 bg-ink-900/50 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">{d.equation}</span>
                <CopyButton value={equation} />
              </div>
              <div className="overflow-x-auto py-1 text-slate-100">
                <MathTex tex={equation} />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-white/8 bg-ink-900/50 p-3">
              {family.params.map((p) => (
                <Field key={p.name} label={p.label[locale]} hint={String(params[p.name] ?? p.default)}>
                  <Slider
                    value={params[p.name] ?? p.default}
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    onChange={(value) => setParams((prev) => ({ ...prev, [p.name]: value }))}
                  />
                </Field>
              ))}
            </div>

            <div className="rounded-xl border border-white/8 bg-ink-900/50 p-3">
              <div className="mb-1.5 text-[11px] font-medium text-slate-400">{d.features}</div>
              <ul className="flex flex-col gap-1.5">
                {facts.map((fact, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500">{fact.label[locale]}</span>
                    <span className="text-slate-200">
                      <MathTex tex={fact.latex} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {mcp.connected ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => askAi('explain')}
                  className="flex-1 rounded-lg bg-brand-500/90 px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-500"
                >
                  {d.explain}
                </button>
                <button
                  type="button"
                  onClick={() => askAi('quiz')}
                  className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-brand-400/60 hover:text-white"
                >
                  {d.quiz}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </WidgetShell>
  )
}
