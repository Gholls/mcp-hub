export type TrigFunc = 'sin' | 'cos' | 'tan'
export type AngleUnit = 'rad' | 'deg'

export const TWO_PI = Math.PI * 2
const DEG = Math.PI / 180

export interface TrigParams {
  func: TrigFunc
  A: number
  omega: number
  phi: number
  k: number
  unit: AngleUnit
}

export function trigValue(func: TrigFunc, rad: number): number | null {
  if (func === 'sin') return Math.sin(rad)
  if (func === 'cos') return Math.cos(rad)
  const c = Math.cos(rad)
  return Math.abs(c) < 1e-6 ? null : Math.tan(rad)
}

export function toRadians(value: number, unit: AngleUnit): number {
  return unit === 'deg' ? value * DEG : value
}

export function periodOf(func: TrigFunc, omega: number, unit: AngleUnit): number {
  const base = func === 'tan' ? (unit === 'deg' ? 180 : Math.PI) : unit === 'deg' ? 360 : TWO_PI
  return base / Math.abs(omega || 1)
}

export function waveY(params: TrigParams, x: number): number | null {
  const v = trigValue(params.func, toRadians(params.omega * x + params.phi, params.unit))
  return v === null ? null : params.A * v + params.k
}

export interface TrigPoint {
  x: number
  y: number | null
}

export function sampleTrig(params: TrigParams, count = 480): TrigPoint[] {
  const period = periodOf(params.func, params.omega, params.unit)
  const x1 = period * 2
  const points: TrigPoint[] = []
  for (let i = 0; i <= count; i++) {
    const x = (x1 * i) / count
    const y = waveY(params, x)
    points.push({ x, y: y === null || !Number.isFinite(y) || Math.abs(y) > 50 ? null : y })
  }
  return points
}

export interface TrigFeature {
  label: { en: string; zh: string }
  latex: string
}

export function trigFeatures(params: TrigParams): TrigFeature[] {
  const { func, A, omega, k, unit } = params
  const out: TrigFeature[] = [{ label: { en: 'Amplitude', zh: '振幅' }, latex: `|A|=${round(Math.abs(A))}` }]
  const period = periodOf(func, omega, unit)
  out.push({
    label: { en: 'Period', zh: '周期' },
    latex: unit === 'deg' ? `T=${round(period)}^\\circ` : `T=\\dfrac{2\\pi}{|\\omega|}=${round(period)}`,
  })
  if (func !== 'tan') {
    out.push({
      label: { en: 'Phase shift', zh: '相位平移' },
      latex:
        unit === 'deg'
          ? `x_0=${round(-params.phi / (omega || 1))}^\\circ`
          : `x_0=-\\dfrac{\\varphi}{\\omega}=${round(-params.phi / (omega || 1))}`,
    })
    out.push({
      label: { en: 'Range', zh: '值域' },
      latex: `[${round(k - Math.abs(A))},\\, ${round(k + Math.abs(A))}]`,
    })
  } else {
    out.push({ label: { en: 'Range', zh: '值域' }, latex: '\\mathbb{R}' })
  }
  return out
}

function round(n: number): string {
  return String(Math.round(n * 100) / 100)
}

export function unitCircle(rad: number) {
  return {
    sin: Math.sin(rad),
    cos: Math.cos(rad),
    tan: Math.abs(Math.cos(rad)) < 1e-6 ? null : Math.tan(rad),
  }
}

export function graphLatex(params: TrigParams): string {
  const { func, A, omega, phi, k, unit } = params
  const a = A === 1 ? '' : A === -1 ? '-' : round(A)
  const w = omega === 1 ? '' : round(omega)
  const p = phi === 0 ? '' : `${phi > 0 ? '+' : '-'}${unit === 'deg' ? `${Math.abs(phi)}^\\circ` : `${round(Math.abs(phi))}`}`
  const shift = k === 0 ? '' : `${k > 0 ? '+' : '-'}${round(Math.abs(k))}`
  const inner = `${w}x${p}`
  const fn = func === 'tan' ? '\\tan' : func === 'cos' ? '\\cos' : '\\sin'
  return `y=${a}${fn}(${inner})${shift}`
}
