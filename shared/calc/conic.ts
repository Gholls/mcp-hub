export type ConicType = 'circle' | 'ellipse' | 'parabola' | 'hyperbola'

export interface ConicParams {
  type: ConicType
  /** circle radius / ellipse semi-major / hyperbola semi-major */
  a: number
  /** ellipse semi-minor / hyperbola semi-minor */
  b: number
  /** parabola focal parameter p (y^2 = 2 p x) */
  p: number
}

export interface ConicPoint {
  x: number
  y: number | null
}

const TAU = Math.PI * 2

export function conicEquation(params: ConicParams): string {
  const { type, a, b, p } = params
  const n = (v: number) => String(Math.round(v * 100) / 100)
  switch (type) {
    case 'circle':
      return `x^{2}+y^{2}=${n(a * a)}`
    case 'ellipse':
      return `\\dfrac{x^{2}}{${n(a * a)}}+\\dfrac{y^{2}}{${n(b * b)}}=1`
    case 'parabola':
      return `y^{2}=${n(2 * p)}x`
    case 'hyperbola':
      return `\\dfrac{x^{2}}{${n(a * a)}}-\\dfrac{y^{2}}{${n(b * b)}}=1`
  }
}

export interface ConicFeature {
  label: { en: string; zh: string }
  latex: string
}

function n(value: number): string {
  return String(Math.round(value * 100) / 100)
}

export function conicFeatures(params: ConicParams): ConicFeature[] {
  const { type, a, b, p } = params
  const out: ConicFeature[] = []
  const f = (en: string, zh: string, latex: string) => out.push({ label: { en, zh }, latex })

  if (type === 'circle') {
    f('Center', '圆心', '(0,0)')
    f('Radius', '半径', `r=${n(a)}`)
    f('Eccentricity', '离心率', 'e=0')
    f('Area', '面积', `S=\\pi r^{2}=${n(Math.PI * a * a)}`)
    return out
  }
  if (type === 'ellipse') {
    const c = Math.sqrt(Math.max(0, a * a - b * b))
    f('Foci', '焦点', `(\\pm ${n(c)},\\, 0)`)
    f('Eccentricity', '离心率', `e=\\dfrac{c}{a}=${n(c / a)}`)
    f('Vertices', '顶点', `(\\pm ${n(a)},\\, 0)`)
    f('Semi-axes', '半轴', `a=${n(a)},\\; b=${n(b)}`)
    return out
  }
  if (type === 'parabola') {
    f('Focus', '焦点', `(\\dfrac{p}{2},\\, 0)=( ${n(p / 2)},\\, 0)`)
    f('Directrix', '准线', `x=-\\dfrac{p}{2}=-${n(p / 2)}`)
    f('Eccentricity', '离心率', 'e=1')
    return out
  }
  const c = Math.sqrt(a * a + b * b)
  f('Foci', '焦点', `(\\pm ${n(c)},\\, 0)`)
  f('Eccentricity', '离心率', `e=\\dfrac{c}{a}=${n(c / a)}`)
  f('Asymptotes', '渐近线', `y=\\pm \\dfrac{b}{a}x=\\pm ${n(b / a)}x`)
  return out
}

export interface ConicCurve {
  /** One or more point series (branches). */
  series: ConicPoint[][]
  /** Marker points such as foci. */
  markers: { x: number; y: number; label: string }[]
  xRange: [number, number]
  yRange: [number, number]
}

export function conicCurve(params: ConicParams, count = 240): ConicCurve {
  const { type, a, b, p } = params
  const build = (fn: (t: number) => ConicPoint, t0: number, t1: number): ConicPoint[] => {
    const pts: ConicPoint[] = []
    for (let i = 0; i <= count; i++) {
      const t = t0 + ((t1 - t0) * i) / count
      const pt = fn(t)
      pts.push(Number.isFinite(pt.x) && Number.isFinite(pt.y as number) ? pt : { x: pt.x, y: null })
    }
    return pts
  }

  if (type === 'circle') {
    const r = a
    return {
      series: [build((t) => ({ x: r * Math.cos(t), y: r * Math.sin(t) }), 0, TAU)],
      markers: [],
      xRange: [-r * 1.4, r * 1.4],
      yRange: [-r * 1.4, r * 1.4],
    }
  }
  if (type === 'ellipse') {
    return {
      series: [build((t) => ({ x: a * Math.cos(t), y: b * Math.sin(t) }), 0, TAU)],
      markers: (() => {
        const c = Math.sqrt(Math.max(0, a * a - b * b))
        return [
          { x: -c, y: 0, label: 'F₁' },
          { x: c, y: 0, label: 'F₂' },
        ]
      })(),
      xRange: [-a * 1.4, a * 1.4],
      yRange: [-Math.max(b, a * 0.6) * 1.4, Math.max(b, a * 0.6) * 1.4],
    }
  }
  if (type === 'parabola') {
    const tmax = Math.sqrt(8 * Math.abs(p))
    const xmax = (tmax * tmax) / (2 * Math.abs(p))
    return {
      series: [build((t) => ({ x: (t * t) / (2 * p), y: t }), -tmax, tmax)],
      markers: [{ x: p / 2, y: 0, label: 'F' }],
      xRange: [-Math.abs(p) * 1.2, xmax * 1.15],
      yRange: [-tmax * 1.15, tmax * 1.15],
    }
  }
  const branch = (sign: number) =>
    build((t) => ({ x: sign * a * Math.cosh(t), y: b * Math.sinh(t) }), -2.2, 2.2)
  const c = Math.sqrt(a * a + b * b)
  const xr = a * Math.cosh(2.2)
  return {
    series: [branch(1), branch(-1)],
    markers: [
      { x: -c, y: 0, label: 'F₁' },
      { x: c, y: 0, label: 'F₂' },
    ],
    xRange: [-xr * 1.15, xr * 1.15],
    yRange: [-xr * 0.8, xr * 0.8],
  }
}
