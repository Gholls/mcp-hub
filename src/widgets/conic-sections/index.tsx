import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import {
  conicCurve,
  conicEquation,
  conicFeatures,
  type ConicParams,
  type ConicType,
} from '@shared/calc/conic.ts'
import type { EChartsOption } from '@shared/calc/echarts.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Slider, WidgetShell } from '../../components/ui.tsx'
import MathTex from '../../components/Math.tsx'
import { useECharts } from '../../lib/use-echarts.ts'
import { useMcp } from '../../lib/mcp-app.ts'

type Dict = Record<string, string>

const T: Record<Locale, Dict> = {
  en: {
    title: 'Conic Sections',
    circle: 'Circle',
    ellipse: 'Ellipse',
    parabola: 'Parabola',
    hyperbola: 'Hyperbola',
    a: 'a (semi-major / r)',
    b: 'b (semi-minor)',
    p: 'p (focal parameter)',
    equation: 'Standard equation',
    features: 'Features',
    explain: 'Ask AI to explain',
    quiz: 'Ask AI for a quiz',
    export: 'Export image',
    note: 'Circle, ellipse, parabola and hyperbola with live foci, eccentricity and asymptotes.',
    sos: 'Explain this conic section',
    quizMsg: 'Create one practice problem about this conic section',
  },
  zh: {
    title: '圆锥曲线',
    circle: '圆',
    ellipse: '椭圆',
    parabola: '抛物线',
    hyperbola: '双曲线',
    a: 'a（长半轴 / 半径）',
    b: 'b（短半轴）',
    p: 'p（焦准距参数）',
    equation: '标准方程',
    features: '几何性质',
    explain: '让 AI 讲解',
    quiz: '让 AI 出题',
    export: '导出图片',
    note: '圆、椭圆、抛物线、双曲线，实时显示焦点、离心率与渐近线。',
    sos: '讲解这条圆锥曲线',
    quizMsg: '针对这条圆锥曲线出一道练习题',
  },
}

export default function ConicSectionsWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const mcp = useMcp()

  const [type, setType] = useState<ConicType>(() => {
    const t = String(initial.type ?? 'ellipse')
    return (['circle', 'ellipse', 'parabola', 'hyperbola'].includes(t) ? t : 'ellipse') as ConicType
  })
  const [a, setA] = useState(3)
  const [b, setB] = useState(2)
  const [p, setP] = useState(2)

  const params: ConicParams = useMemo(() => ({ type, a, b, p }), [type, a, b, p])
  const curve = useMemo(() => conicCurve(params), [params])
  const facts = useMemo(() => conicFeatures(params), [params])
  const equation = conicEquation(params)

  const option = useMemo<EChartsOption>(() => {
    const series: Record<string, unknown>[] = curve.series.map((branch) => ({
      type: 'line',
      showSymbol: false,
      connectNulls: false,
      data: branch.map((pt) => [pt.x, pt.y]),
      lineStyle: { width: 2.5 },
    }))
    if (curve.markers.length > 0) {
      series.push({
        type: 'scatter',
        symbolSize: 9,
        itemStyle: { color: '#f43f5e' },
        data: curve.markers.map((m) => [m.x, m.y]),
        label: { show: true, formatter: '{b}', color: '#fca5a5', position: 'top' },
      })
    }
    return {
      grid: { left: 12, right: 16, top: 16, bottom: 12, containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'value', min: curve.xRange[0], max: curve.xRange[1], name: 'x' },
      yAxis: { type: 'value', min: curve.yRange[0], max: curve.yRange[1], name: 'y' },
      dataZoom: [{ type: 'inside' }],
      series,
    }
  }, [curve])

  const { ref: chartRef, downloadPng } = useECharts(option)

  function askAi(kind: 'explain' | 'quiz') {
    const head = `${d[kind === 'explain' ? 'sos' : 'quizMsg']}: ${type}, ${equation} (a=${a}, b=${b}, p=${p}).`
    const extra =
      kind === 'explain'
        ? locale === 'zh'
          ? '请说明焦点、离心率、准线/渐近线等性质。'
          : 'Explain the foci, eccentricity, directrix/asymptotes.'
        : locale === 'zh'
          ? '请给出一道相关的练习题（含答案）。'
          : 'Give one related practice problem (with the answer).'
    void mcp.sendMessage(`${head}\n${extra}`).catch(() => undefined)
  }

  return (
    <WidgetShell title={d.title} icon="🌀" footer={d.note}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {(['circle', 'ellipse', 'parabola', 'hyperbola'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              aria-pressed={type === t}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                type === t ? 'border-brand-400/60 bg-brand-500/15 text-brand-200' : 'border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              {d[t]}
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div className="flex flex-col gap-2">
            <div className="overflow-hidden rounded-xl border border-white/8 bg-ink-950/50 p-1">
              <div ref={chartRef} className="h-[340px] w-full" />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => downloadPng('conic')}
                className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-brand-400/60 hover:text-white"
              >
                {d.export}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-white/8 bg-ink-900/50 p-3">
              <div className="mb-1 text-[11px] font-medium text-slate-400">{d.equation}</div>
              <div className="overflow-x-auto py-1 text-slate-100">
                <MathTex tex={equation} />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-white/8 bg-ink-900/50 p-3">
              {type !== 'parabola' ? (
                <Field label={type === 'circle' ? d.a.replace(' / r', '') : d.a} hint={String(a)}>
                  <Slider value={a} min={0.5} max={6} step={0.5} onChange={setA} />
                </Field>
              ) : null}
              {type === 'ellipse' || type === 'hyperbola' ? (
                <Field label={d.b} hint={String(b)}>
                  <Slider value={b} min={0.5} max={6} step={0.5} onChange={setB} />
                </Field>
              ) : null}
              {type === 'parabola' ? (
                <Field label={d.p} hint={String(p)}>
                  <Slider value={p} min={0.5} max={4} step={0.5} onChange={setP} />
                </Field>
              ) : null}
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
                <button type="button" onClick={() => askAi('explain')} className="flex-1 rounded-lg bg-brand-500/90 px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-500">
                  {d.explain}
                </button>
                <button type="button" onClick={() => askAi('quiz')} className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-brand-400/60 hover:text-white">
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
