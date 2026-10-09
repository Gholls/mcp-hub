import { useMemo, useRef, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import {
  TWO_PI,
  graphLatex,
  periodOf,
  sampleTrig,
  trigFeatures,
  unitCircle,
  type AngleUnit,
  type TrigFunc,
  type TrigParams,
} from '@shared/calc/trig.ts'
import type { EChartsOption } from '@shared/calc/echarts.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Slider, WidgetShell } from '../../components/ui.tsx'
import MathTex from '../../components/Math.tsx'
import { useECharts } from '../../lib/use-echarts.ts'
import { useMcp } from '../../lib/mcp-app.ts'

type Dict = Record<string, string>

const T: Record<Locale, Dict> = {
  en: {
    title: 'Trigonometry Lab',
    func: 'Function',
    amplitude: 'Amplitude A',
    omega: 'Angular frequency ω',
    phi: 'Phase φ',
    k: 'Vertical shift k',
    angle: 'Angle θ',
    unit: 'Unit',
    features: 'Features',
    equation: 'Equation',
    explain: 'Ask AI to explain',
    quiz: 'Ask AI for a quiz',
    dragHint: 'Drag the point on the circle or move the angle slider.',
    export: 'Export image',
    note: 'Unit circle + wave. Drag the angle to see sin, cos and tan, and watch the curve transform.',
    sos: 'Explain this trigonometric graph',
    quizMsg: 'Create one practice problem about this trigonometric function',
  },
  zh: {
    title: '三角函数实验室',
    func: '函数',
    amplitude: '振幅 A',
    omega: '角频率 ω',
    phi: '初相 φ',
    k: '上下平移 k',
    angle: '角度 θ',
    unit: '单位',
    features: '函数性质',
    equation: '函数表达式',
    explain: '让 AI 讲解',
    quiz: '让 AI 出题',
    dragHint: '拖动圆上的点，或移动角度滑块。',
    export: '导出图片',
    note: '单位圆 + 波形。拖动角度查看 sin、cos、tan，并观察图像变换。',
    sos: '讲解这个三角函数图像',
    quizMsg: '针对这个三角函数出一道练习题',
  },
}

const R = 92
const C = 120

function UnitCircle({ theta, onTheta }: { theta: number; onTheta: (v: number) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  const px = C + R * Math.cos(theta)
  const py = C - R * Math.sin(theta)
  const arcEnd = { x: C + 26 * Math.cos(theta), y: C - 26 * Math.sin(theta) }
  const largeArc = theta > Math.PI ? 1 : 0

  function update(clientX: number, clientY: number) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((clientX - rect.left) / rect.width) * 240 - C
    const y = ((clientY - rect.top) / rect.height) * 240 - C
    let angle = Math.atan2(-y, x)
    if (angle < 0) angle += TWO_PI
    onTheta(angle)
  }

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 240 240"
      className="h-[240px] w-[240px] touch-none select-none"
      onPointerDown={(e) => {
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        update(e.clientX, e.clientY)
      }}
      onPointerMove={(e) => {
        if (dragging.current) update(e.clientX, e.clientY)
      }}
      onPointerUp={() => {
        dragging.current = false
      }}
    >
      <line x1="12" y1={C} x2="228" y2={C} stroke="rgba(148,163,184,0.35)" />
      <line x1={C} y1="12" x2={C} y2="228" stroke="rgba(148,163,184,0.35)" />
      <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(148,163,184,0.5)" />
      <path
        d={`M ${C + 26} ${C} A 26 26 0 ${largeArc} 0 ${arcEnd.x} ${arcEnd.y}`}
        fill="none"
        stroke="#818cf8"
        strokeWidth="1.5"
      />
      <line x1={C} y1={C} x2={px} y2={C} stroke="#22d3ee" strokeWidth="2" />
      <line x1={px} y1={C} x2={px} y2={py} stroke="#f59e0b" strokeWidth="2" />
      <line x1={C} y1={C} x2={px} y2={py} stroke="rgba(226,232,240,0.6)" strokeWidth="1.5" />
      <circle cx={px} cy={py} r="5" fill="#e5e7eb" stroke="#0f172a" strokeWidth="1.5" />
      <text x="216" y={C - 6} fill="#64748b" fontSize="11">
        x
      </text>
      <text x={C + 6} y="18" fill="#64748b" fontSize="11">
        y
      </text>
    </svg>
  )
}

export default function TrigLabWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const mcp = useMcp()

  const [func, setFunc] = useState<TrigFunc>('sin')
  const [unit, setUnit] = useState<AngleUnit>('rad')
  const [A, setA] = useState(1)
  const [omega, setOmega] = useState(1)
  const [phi, setPhi] = useState(0)
  const [k, setK] = useState(0)
  const [theta, setTheta] = useState(Math.PI / 3)

  const params: TrigParams = useMemo(
    () => ({ func, A, omega, phi, k, unit }),
    [func, A, omega, phi, k, unit],
  )
  const points = useMemo(() => sampleTrig(params), [params])
  const facts = useMemo(() => trigFeatures(params), [params])
  const equation = graphLatex(params)

  const thetaDisplay = unit === 'deg' ? (theta * 180) / Math.PI : theta
  const phiMax = unit === 'deg' ? 180 : Math.PI
  const phiStep = unit === 'deg' ? 15 : Math.PI / 12

  const period = periodOf(func, omega, unit)
  const x1 = period * 2
  const xGuide = (thetaDisplay - phi) / (omega || 1)

  const option = useMemo<EChartsOption>(() => {
    const mark =
      xGuide >= 0 && xGuide <= x1
        ? {
            markLine: {
              silent: true,
              symbol: 'none',
              data: [{ xAxis: xGuide }],
              lineStyle: { type: 'dashed', color: 'rgba(129,140,248,0.7)' },
              label: { show: false },
            },
            markPoint: {
              symbolSize: 10,
              data: [{ coord: [xGuide, points.reduce((best, p) => (Math.abs(p.x - xGuide) < Math.abs(best.x - xGuide) ? p : best), points[0]).y] }],
              label: { show: false },
              itemStyle: { color: '#f43f5e' },
            },
          }
        : {}
    return {
      grid: { left: 12, right: 16, top: 20, bottom: 12, containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'value', min: 0, max: x1, name: unit === 'deg' ? 'x°' : 'x' },
      yAxis: { type: 'value', name: 'y' },
      dataZoom: [{ type: 'inside' }],
      series: [
        {
          type: 'line',
          showSymbol: false,
          connectNulls: false,
          data: points.map((p) => [p.x, p.y]),
          lineStyle: { width: 2.5 },
          ...mark,
        },
      ],
    }
  }, [points, xGuide, x1, unit])

  const { ref: chartRef, downloadPng } = useECharts(option)

  function askAi(kind: 'explain' | 'quiz') {
    const header =
      kind === 'explain'
        ? `${d.sos}: ${equation} (A=${A}, ω=${omega}, φ=${phi}, k=${k}).`
        : `${d.quizMsg}: ${equation} (A=${A}, ω=${omega}, φ=${phi}, k=${k}).`
    const extra =
      kind === 'explain'
        ? locale === 'zh'
          ? '请说明振幅、周期、相位与图像变换规律。'
          : 'Explain amplitude, period, phase and the transformation rules.'
        : locale === 'zh'
          ? '请给出一道相关的练习题（含答案）。'
          : 'Give one related practice problem (with the answer).'
    void mcp.sendMessage(`${header}\n${extra}`).catch(() => undefined)
  }

  return (
    <WidgetShell title={d.title} icon="📐" footer={d.note}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-white/10 bg-ink-900/70 p-0.5">
            {(['sin', 'cos', 'tan'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFunc(f)}
                aria-pressed={func === f}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  func === f ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-white/10 bg-ink-900/70 p-0.5">
            {(['rad', 'deg'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                aria-pressed={unit === u}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  unit === u ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="flex flex-col items-center gap-2">
            <UnitCircle theta={theta} onTheta={setTheta} />
            <div className="grid w-full grid-cols-3 gap-1.5 text-center text-xs">
              {[
                ['sin θ', unitCircle(theta).sin],
                ['cos θ', unitCircle(theta).cos],
                ['tan θ', unitCircle(theta).tan],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-lg border border-white/8 bg-ink-900/50 py-1">
                  <div className="text-[10px] text-slate-500">{label}</div>
                  <div className="font-mono text-slate-200">
                    {value === null ? '—' : (value as number).toFixed(3)}
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full">
              <Field label={d.angle} hint={unit === 'deg' ? `${thetaDisplay.toFixed(0)}°` : theta.toFixed(2)}>
                <Slider
                  value={thetaDisplay}
                  min={0}
                  max={unit === 'deg' ? 360 : TWO_PI}
                  step={unit === 'deg' ? 1 : 0.02}
                  onChange={(v) => setTheta(unit === 'deg' ? (v * Math.PI) / 180 : v)}
                />
              </Field>
            </div>
            <p className="text-[11px] text-slate-500">{d.dragHint}</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-xl border border-white/8 bg-ink-950/50 p-1">
              <div ref={chartRef} className="h-[300px] w-full" />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => downloadPng('trig')}
                className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-brand-400/60 hover:text-white"
              >
                {d.export}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/8 bg-ink-900/50 p-3">
                <div className="mb-1 text-[11px] font-medium text-slate-400">{d.equation}</div>
                <div className="overflow-x-auto text-slate-100">
                  <MathTex tex={equation} />
                </div>
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
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={d.amplitude} hint={String(A)}>
                <Slider value={A} min={-3} max={3} step={0.5} onChange={setA} />
              </Field>
              <Field label={d.omega} hint={String(omega)}>
                <Slider value={omega} min={0.5} max={4} step={0.5} onChange={setOmega} />
              </Field>
              <Field label={d.phi} hint={unit === 'deg' ? `${phi}°` : phi.toFixed(2)}>
                <Slider value={phi} min={-phiMax} max={phiMax} step={phiStep} onChange={setPhi} />
              </Field>
              <Field label={d.k} hint={String(k)}>
                <Slider value={k} min={-3} max={3} step={0.5} onChange={setK} />
              </Field>
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
