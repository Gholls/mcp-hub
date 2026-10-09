import { useMemo, useRef, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import {
  circleMeasures,
  classifyQuadrilateral,
  polygonArea,
  polygonPerimeter,
  quadrilateralAngles,
  triangleMeasures,
  type Point,
} from '@shared/calc/geometry.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Slider, WidgetShell } from '../../components/ui.tsx'
import MathTex from '../../components/Math.tsx'
import { useMcp } from '../../lib/mcp-app.ts'

type Dict = Record<string, string>
type Shape = 'triangle' | 'quadrilateral' | 'circle'

const T: Record<Locale, Dict> = {
  en: {
    title: 'Geometry Lab',
    triangle: 'Triangle',
    quadrilateral: 'Quadrilateral',
    circle: 'Circle',
    square: 'Square',
    rectangle: 'Rectangle',
    parallelogram: 'Parallelogram',
    radius: 'Radius r',
    sideLengths: 'Side lengths',
    angles: 'Angles',
    measures: 'Measures',
    theorems: 'Theorems',
    area: 'Area',
    perimeter: 'Perimeter',
    dragHint: 'Drag the vertices (or the radius handle) to reshape.',
    export: 'Export image',
    note: 'Interactive plane geometry. Shapes update live and theorems re-compute.',
    explain: 'Ask AI to explain',
    quiz: 'Ask AI for a quiz',
    sos: 'Explain this geometry figure',
    quizMsg: 'Create one practice problem about this figure',
  },
  zh: {
    title: '几何实验室',
    triangle: '三角形',
    quadrilateral: '四边形',
    circle: '圆',
    square: '正方形',
    rectangle: '矩形',
    parallelogram: '平行四边形',
    radius: '半径 r',
    sideLengths: '边长',
    angles: '角度',
    measures: '度量',
    theorems: '定理',
    area: '面积',
    perimeter: '周长',
    dragHint: '拖动顶点（或半径端点）改变图形。',
    export: '导出图片',
    note: '交互式平面几何，图形与定理实时更新。',
    explain: '让 AI 讲解',
    quiz: '让 AI 出题',
    sos: '讲解这个几何图形',
    quizMsg: '针对这个图形出一道练习题',
  },
}

const SIZE = 340
const PAD = 26
const WORLD = 10
const SCALE = (SIZE - PAD * 2) / WORLD

const clamp = (v: number) => Math.max(0.4, Math.min(WORLD - 0.4, v))
const sx = (x: number) => PAD + x * SCALE
const sy = (y: number) => SIZE - PAD - y * SCALE
const fmt = (n: number) => (Math.round(n * 100) / 100).toFixed(2)

export default function GeometryLabWidget({ locale }: WidgetProps) {
  const d = T[locale] ?? T.en
  const mcp = useMcp()
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef<number | null>(null)

  const [shape, setShape] = useState<Shape>('triangle')
  const [tri, setTri] = useState<Point[]>([{ x: 2, y: 2 }, { x: 8, y: 2 }, { x: 5.5, y: 7.5 }])
  const [quad, setQuad] = useState<Point[]>([{ x: 2, y: 2 }, { x: 8, y: 2 }, { x: 8, y: 7 }, { x: 2, y: 7 }])
  const [center, setCenter] = useState<Point>({ x: 5, y: 5 })
  const [radius, setRadius] = useState(3)

  const triM = useMemo(() => triangleMeasures(tri), [tri])
  const quadSides = useMemo(() => quad.map((p, i) => Math.hypot(p.x - quad[(i + 1) % 4].x, p.y - quad[(i + 1) % 4].y)), [quad])
  const quadAngles = useMemo(() => quadrilateralAngles(quad), [quad])
  const quadType = useMemo(() => classifyQuadrilateral(quad), [quad])
  const circleM = useMemo(() => circleMeasures(radius), [radius])

  const handles: Point[] =
    shape === 'triangle' ? tri : shape === 'quadrilateral' ? quad : [center, { x: clamp(center.x + radius), y: center.y }]

  function toWorld(clientX: number, clientY: number): Point {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: ((clientX - rect.left) / rect.width) * SIZE,
      y: ((clientY - rect.top) / rect.height) * SIZE,
    }
  }

  function applyHandle(index: number, clientX: number, clientY: number) {
    const screen = toWorld(clientX, clientY)
    const world = { x: clamp((screen.x - PAD) / SCALE), y: clamp((WORLD * SCALE - (screen.y - PAD)) / SCALE) }
    if (shape === 'triangle') setTri((prev) => prev.map((p, i) => (i === index ? world : p)))
    else if (shape === 'quadrilateral') setQuad((prev) => prev.map((p, i) => (i === index ? world : p)))
    else if (index === 0) setCenter(world)
    else setRadius(Math.max(0.5, Math.hypot(world.x - center.x, world.y - center.y)))
  }

  function onDown(e: React.PointerEvent) {
    const screen = toWorld(e.clientX, e.clientY)
    let nearest = -1
    let best = 22
    handles.forEach((h, i) => {
      const dist = Math.hypot(sx(h.x) - screen.x, sy(h.y) - screen.y)
      if (dist < best) {
        best = dist
        nearest = i
      }
    })
    if (nearest >= 0) {
      dragging.current = nearest
      e.currentTarget.setPointerCapture(e.pointerId)
      applyHandle(nearest, e.clientX, e.clientY)
    }
  }

  function exportSvg() {
    const svg = svgRef.current
    if (!svg) return
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
      type: 'image/svg+xml;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'geometry.svg'
    link.click()
    URL.revokeObjectURL(url)
  }

  function askAi(kind: 'explain' | 'quiz') {
    const figure =
      shape === 'triangle'
        ? `triangle ${tri.map((p) => `(${fmt(p.x)},${fmt(p.y)})`).join(' ')} sides a=${fmt(triM.sides[0])} b=${fmt(triM.sides[1])} c=${fmt(triM.sides[2])}`
        : shape === 'quadrilateral'
          ? `quadrilateral (${quadType}) ${quad.map((p) => `(${fmt(p.x)},${fmt(p.y)})`).join(' ')}`
          : `circle center (${fmt(center.x)},${fmt(center.y)}) radius ${fmt(radius)}`
    const head = `${d[kind === 'explain' ? 'sos' : 'quizMsg']}: ${figure}.`
    const extra =
      kind === 'explain'
        ? locale === 'zh'
          ? '请解释相关定理并说明理由。'
          : 'Explain the relevant theorems and why they hold.'
        : locale === 'zh'
          ? '请给出一道相关的练习题（含答案）。'
          : 'Give one related practice problem (with the answer).'
    void mcp.sendMessage(`${head}\n${extra}`).catch(() => undefined)
  }

  return (
    <WidgetShell title={d.title} icon="📐" footer={d.note}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['triangle', 'quadrilateral', 'circle'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setShape(s)}
              aria-pressed={shape === s}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                shape === s ? 'border-brand-400/60 bg-brand-500/15 text-brand-200' : 'border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              {d[s]}
            </button>
          ))}
          {shape === 'quadrilateral' ? (
            <span className="ml-1 flex gap-1.5">
              <button
                type="button"
                onClick={() => setQuad([{ x: 2, y: 2 }, { x: 7, y: 2 }, { x: 7, y: 7 }, { x: 2, y: 7 }])}
                className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
              >
                {d.square}
              </button>
              <button
                type="button"
                onClick={() => setQuad([{ x: 1.5, y: 2 }, { x: 8.5, y: 2 }, { x: 8.5, y: 6.5 }, { x: 1.5, y: 6.5 }])}
                className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
              >
                {d.rectangle}
              </button>
              <button
                type="button"
                onClick={() => setQuad([{ x: 1.5, y: 3 }, { x: 6, y: 3 }, { x: 8.5, y: 7 }, { x: 4, y: 7 }])}
                className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
              >
                {d.parallelogram}
              </button>
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <div className="flex flex-col items-center gap-2">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="h-[340px] w-[340px] touch-none select-none rounded-xl border border-white/8 bg-ink-950/50"
              onPointerDown={onDown}
              onPointerMove={(e) => {
                if (dragging.current !== null) applyHandle(dragging.current, e.clientX, e.clientY)
              }}
              onPointerUp={() => {
                dragging.current = null
              }}
            >
              {Array.from({ length: WORLD + 1 }, (_, i) => (
                <g key={i} stroke="rgba(255,255,255,0.06)">
                  <line x1={sx(i)} y1={sy(0)} x2={sx(i)} y2={sy(WORLD)} />
                  <line x1={sx(0)} y1={sy(i)} x2={sx(WORLD)} y2={sy(i)} />
                </g>
              ))}

              {shape === 'triangle' ? (
                <>
                  <polygon points={tri.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')} fill="rgba(99,102,241,0.15)" stroke="#818cf8" strokeWidth="2" />
                  {tri.map((p, i) => {
                    const mid = { x: (p.x + tri[(i + 1) % 3].x) / 2, y: (p.y + tri[(i + 1) % 3].y) / 2 }
                    return (
                      <text key={i} x={sx(mid.x)} y={sy(mid.y) - 6} fill="#94a3b8" fontSize="11" textAnchor="middle">
                        {fmt(triM.sides[(i + 2) % 3])}
                      </text>
                    )
                  })}
                </>
              ) : null}

              {shape === 'quadrilateral' ? (
                <>
                  <polygon points={quad.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')} fill="rgba(34,211,238,0.12)" stroke="#22d3ee" strokeWidth="2" />
                  {quad.map((p, i) => {
                    const mid = { x: (p.x + quad[(i + 1) % 4].x) / 2, y: (p.y + quad[(i + 1) % 4].y) / 2 }
                    return (
                      <text key={i} x={sx(mid.x)} y={sy(mid.y) - 6} fill="#94a3b8" fontSize="11" textAnchor="middle">
                        {fmt(quadSides[i])}
                      </text>
                    )
                  })}
                </>
              ) : null}

              {shape === 'circle' ? (
                <>
                  <circle cx={sx(center.x)} cy={sy(center.y)} r={radius * SCALE} fill="rgba(245,158,11,0.12)" stroke="#f59e0b" strokeWidth="2" />
                  <line x1={sx(center.x)} y1={sy(center.y)} x2={sx(clamp(center.x + radius))} y2={sy(center.y)} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" />
                  <text x={(sx(center.x) + sx(clamp(center.x + radius))) / 2} y={sy(center.y) - 6} fill="#fbbf24" fontSize="11" textAnchor="middle">
                    r={fmt(radius)}
                  </text>
                </>
              ) : null}

              {handles.map((h, i) => (
                <circle key={i} cx={sx(h.x)} cy={sy(h.y)} r="6" fill="#e5e7eb" stroke="#0f172a" strokeWidth="2" className="cursor-grab" />
              ))}
            </svg>
            <div className="flex w-full items-center justify-between">
              <p className="text-[11px] text-slate-500">{d.dragHint}</p>
              <button
                type="button"
                onClick={exportSvg}
                className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-brand-400/60 hover:text-white"
              >
                {d.export}
              </button>
            </div>
            {shape === 'circle' ? (
              <div className="w-full">
                <Field label={d.radius} hint={fmt(radius)}>
                  <Slider value={radius} min={0.5} max={4.5} step={0.1} onChange={setRadius} />
                </Field>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-white/8 bg-ink-900/50 p-3">
              <div className="mb-1.5 text-[11px] font-medium text-slate-400">{d.measures}</div>
              {shape === 'triangle' ? (
                <ul className="flex flex-col gap-1.5 text-xs">
                  <li className="flex justify-between"><span className="text-slate-500">{d.sideLengths}</span><span className="font-mono text-slate-200">a={fmt(triM.sides[0])} b={fmt(triM.sides[1])} c={fmt(triM.sides[2])}</span></li>
                  <li className="flex justify-between"><span className="text-slate-500">{d.angles}</span><span className="font-mono text-slate-200">{triM.angles.map((a) => `${fmt(a)}°`).join(' ')}</span></li>
                  <li className="flex justify-between"><span className="text-slate-500">{d.perimeter}</span><span className="font-mono text-slate-200">{fmt(triM.perimeter)}</span></li>
                  <li className="flex justify-between"><span className="text-slate-500">{d.area}</span><span className="font-mono text-slate-200">{fmt(triM.area)}</span></li>
                </ul>
              ) : shape === 'quadrilateral' ? (
                <ul className="flex flex-col gap-1.5 text-xs">
                  <li className="flex justify-between"><span className="text-slate-500">type</span><span className="text-slate-200">{quadType}</span></li>
                  <li className="flex justify-between"><span className="text-slate-500">{d.sideLengths}</span><span className="font-mono text-slate-200">{quadSides.map(fmt).join(', ')}</span></li>
                  <li className="flex justify-between"><span className="text-slate-500">{d.angles}</span><span className="font-mono text-slate-200">{quadAngles.map((a) => `${fmt(a)}°`).join(' ')}</span></li>
                  <li className="flex justify-between"><span className="text-slate-500">{d.perimeter}</span><span className="font-mono text-slate-200">{fmt(polygonPerimeter(quad))}</span></li>
                  <li className="flex justify-between"><span className="text-slate-500">{d.area}</span><span className="font-mono text-slate-200">{fmt(polygonArea(quad))}</span></li>
                </ul>
              ) : (
                <ul className="flex flex-col gap-1.5 text-xs">
                  <li className="flex justify-between"><span className="text-slate-500">d = 2r</span><span className="font-mono text-slate-200">{fmt(circleM.diameter)}</span></li>
                  <li className="flex justify-between"><span className="text-slate-500">C = 2πr</span><span className="font-mono text-slate-200">{fmt(circleM.circumference)}</span></li>
                  <li className="flex justify-between"><span className="text-slate-500">S = πr²</span><span className="font-mono text-slate-200">{fmt(circleM.area)}</span></li>
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-white/8 bg-ink-900/50 p-3">
              <div className="mb-1.5 text-[11px] font-medium text-slate-400">{d.theorems}</div>
              <ul className="flex flex-col gap-2 text-xs text-slate-200">
                {shape === 'triangle' ? (
                  <>
                    <li><MathTex tex={`\\angle A+\\angle B+\\angle C=${fmt(triM.angles.reduce((a, b) => a + b, 0))}^\\circ`} /></li>
                    {triM.isRight ? (
                      <li><MathTex tex={`a^2+b^2=c^2:\\; ${fmt(triM.sides[0] ** 2)}+${fmt(triM.sides[1] ** 2)}=${fmt(triM.sides[2] ** 2)}`} /></li>
                    ) : null}
                    <li><MathTex tex={'\\dfrac{a}{\\sin A}=\\dfrac{b}{\\sin B}=\\dfrac{c}{\\sin C}'} /></li>
                    <li><MathTex tex={`c^2=a^2+b^2-2ab\\cos C`} /></li>
                    <li><MathTex tex={`S=\\tfrac12 ab\\sin C=${fmt(triM.area)}`} /></li>
                  </>
                ) : shape === 'quadrilateral' ? (
                  <>
                    <li><MathTex tex={`\\text{type}: ${quadType}`} /></li>
                    <li><MathTex tex={`\\angle A+\\angle B+\\angle C+\\angle D=${fmt(quadAngles.reduce((a, b) => a + b, 0))}^\\circ`} /></li>
                    <li><MathTex tex={'S_{\\text{rect}}=ab,\\quad S_{\\text{parallelogram}}=bh'} /></li>
                  </>
                ) : (
                  <>
                    <li><MathTex tex={'C=2\\pi r,\\quad S=\\pi r^{2}'} /></li>
                    <li><MathTex tex={`C=${fmt(circleM.circumference)},\\; S=${fmt(circleM.area)}`} /></li>
                  </>
                )}
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
