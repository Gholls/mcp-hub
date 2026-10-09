import type { LocalizedText } from '../types.ts'

export type GrapherFamilyId =
  | 'linear'
  | 'proportion'
  | 'inverse'
  | 'quadratic'
  | 'power'
  | 'exponential'
  | 'logarithmic'

export type Stage = 'junior' | 'senior'

export interface GraphParam {
  name: string
  label: LocalizedText
  min: number
  max: number
  step: number
  default: number
}

export type ParamValues = Record<string, number>

export interface GrapherFamily {
  id: GrapherFamilyId
  label: LocalizedText
  stage: Stage
  latex: string
  domain: [number, number]
  params: GraphParam[]
  sample: (params: ParamValues, x: number) => number | null
}

const P = (
  name: string,
  en: string,
  zh: string,
  min: number,
  max: number,
  step: number,
  def: number,
): GraphParam => ({ name, label: { en, zh }, min, max, step, default: def })

export const GRAPHER_FAMILIES: GrapherFamily[] = [
  {
    id: 'linear',
    label: { en: 'Linear', zh: '一次函数' },
    stage: 'junior',
    latex: 'y=kx+b',
    domain: [-10, 10],
    params: [P('k', 'slope k', '斜率 k', -5, 5, 0.5, 1), P('b', 'intercept b', '截距 b', -8, 8, 0.5, 0)],
    sample: ({ k, b }, x) => k * x + b,
  },
  {
    id: 'proportion',
    label: { en: 'Direct proportion', zh: '正比例函数' },
    stage: 'junior',
    latex: 'y=kx',
    domain: [-10, 10],
    params: [P('k', 'constant k', '比例系数 k', -5, 5, 0.5, 1)],
    sample: ({ k }, x) => k * x,
  },
  {
    id: 'inverse',
    label: { en: 'Inverse proportion', zh: '反比例函数' },
    stage: 'junior',
    latex: 'y=\\dfrac{k}{x}',
    domain: [-10, 10],
    params: [P('k', 'constant k', '比例系数 k', -8, 8, 0.5, 4)],
    sample: ({ k }, x) => (x === 0 ? null : k / x),
  },
  {
    id: 'quadratic',
    label: { en: 'Quadratic', zh: '二次函数' },
    stage: 'junior',
    latex: 'y=ax^{2}+bx+c',
    domain: [-10, 10],
    params: [
      P('a', 'a', '二次项 a', -3, 3, 0.5, 1),
      P('b', 'b', '一次项 b', -8, 8, 0.5, -2),
      P('c', 'c', '常数项 c', -8, 8, 0.5, -3),
    ],
    sample: ({ a, b, c }, x) => a * x * x + b * x + c,
  },
  {
    id: 'power',
    label: { en: 'Power', zh: '幂函数' },
    stage: 'senior',
    latex: 'y=x^{a}',
    domain: [-8, 8],
    params: [P('a', 'exponent a', '指数 a', -3, 4, 0.25, 2)],
    sample: ({ a }, x) => {
      const y = Math.pow(x, a)
      return Number.isFinite(y) ? y : null
    },
  },
  {
    id: 'exponential',
    label: { en: 'Exponential', zh: '指数函数' },
    stage: 'senior',
    latex: 'y=a^{x}',
    domain: [-5, 5],
    params: [P('a', 'base a', '底数 a', 0.2, 3, 0.1, 2)],
    sample: ({ a }, x) => Math.pow(a, x),
  },
  {
    id: 'logarithmic',
    label: { en: 'Logarithmic', zh: '对数函数' },
    stage: 'senior',
    latex: 'y=\\log_{a}x',
    domain: [0.05, 10],
    params: [P('a', 'base a', '底数 a', 0.2, 3, 0.1, 2)],
    sample: ({ a }, x) => (x <= 0 || a <= 0 || a === 1 ? null : Math.log(x) / Math.log(a)),
  },
]

export function getFamily(id: string): GrapherFamily | undefined {
  return GRAPHER_FAMILIES.find((f) => f.id === id)
}

export function defaultParams(family: GrapherFamily): ParamValues {
  return Object.fromEntries(family.params.map((p) => [p.name, p.default]))
}

export interface SamplePoint {
  x: number
  y: number | null
}

export function sampleFamily(
  family: GrapherFamily,
  params: ParamValues,
  count = 480,
  yClamp = 1000,
): SamplePoint[] {
  const [x0, x1] = family.domain
  const points: SamplePoint[] = []
  for (let i = 0; i <= count; i++) {
    const x = x0 + ((x1 - x0) * i) / count
    const y = family.sample(params, x)
    points.push({ x, y: y === null || !Number.isFinite(y) || Math.abs(y) > yClamp ? null : y })
  }
  return points
}

function fmt(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return String(Math.round(value * 1000) / 1000)
}

/** Builds a readable LaTeX equation with the current parameter values. */
export function substitutedLatex(family: GrapherFamily, params: ParamValues): string {
  const v = (name: string) => fmt(params[name] ?? 0)
  const terms: string[] = []
  const pushTerm = (coef: number, sym: string, first: boolean) => {
    if (coef === 0) return
    const sign = coef < 0 ? '-' : first ? '' : '+'
    const abs = Math.abs(coef)
    const mag = sym && abs === 1 ? '' : fmt(abs)
    terms.push(`${sign}${mag}${sym}`)
  }

  switch (family.id) {
    case 'linear':
      pushTerm(params.k ?? 0, 'x', true)
      pushTerm(params.b ?? 0, '', terms.length === 0)
      return `y=${terms.join('') || '0'}`
    case 'proportion':
      pushTerm(params.k ?? 0, 'x', true)
      return `y=${terms.join('') || '0'}`
    case 'inverse':
      return `y=\\dfrac{${v('k')}}{x}`
    case 'quadratic':
      pushTerm(params.a ?? 0, 'x^{2}', true)
      pushTerm(params.b ?? 0, 'x', terms.length === 0)
      pushTerm(params.c ?? 0, '', terms.length === 0)
      return `y=${terms.join('') || '0'}`
    case 'power':
      return `y=x^{${v('a')}}`
    case 'exponential':
      return `y=${v('a')}^{x}`
    case 'logarithmic':
      return `y=\\log_{${v('a')}}x`
    default:
      return family.latex
  }
}

export interface Feature {
  label: LocalizedText
  latex: string
}

/** Key, grade-appropriate facts about the current graph. */
export function features(family: GrapherFamily, params: ParamValues): Feature[] {
  const out: Feature[] = []
  switch (family.id) {
    case 'linear':
    case 'proportion': {
      out.push({ label: { en: 'Slope', zh: '斜率' }, latex: `k=${fmt(params.k ?? 0)}` })
      if (family.id === 'linear') {
        out.push({ label: { en: 'y-intercept', zh: 'y 轴截距' }, latex: `b=${fmt(params.b ?? 0)}` })
        if ((params.k ?? 0) !== 0) {
          out.push({
            label: { en: 'x-intercept', zh: 'x 轴截距' },
            latex: `x=${fmt(-(params.b ?? 0) / (params.k ?? 1))}`,
          })
        }
      } else {
        out.push({ label: { en: 'Passes through', zh: '过定点' }, latex: '(0,0)' })
      }
      return out
    }
    case 'inverse':
      out.push({ label: { en: 'Asymptotes', zh: '渐近线' }, latex: 'x=0,\\; y=0' })
      out.push({
        label: { en: 'Quadrants', zh: '所在象限' },
        latex: (params.k ?? 0) >= 0 ? '\\text{I, III}' : '\\text{II, IV}',
      })
      return out
    case 'quadratic': {
      const a = params.a ?? 0
      const b = params.b ?? 0
      const c = params.c ?? 0
      const delta = b * b - 4 * a * c
      out.push({
        label: { en: 'Opens', zh: '开口方向' },
        latex: a > 0 ? '\\text{up }\\cup' : a < 0 ? '\\text{down }\\cap' : 'a=0',
      })
      if (a !== 0) {
        out.push({
          label: { en: 'Vertex', zh: '顶点' },
          latex: `(${fmt(-b / (2 * a))},\\, ${fmt(c - (b * b) / (4 * a))})`,
        })
        out.push({
          label: { en: 'Axis of symmetry', zh: '对称轴' },
          latex: `x=${fmt(-b / (2 * a))}`,
        })
      }
      out.push({ label: { en: 'Discriminant', zh: '判别式' }, latex: `\\Delta=b^{2}-4ac=${fmt(delta)}` })
      out.push({
        label: { en: 'Roots', zh: '零点个数' },
        latex: delta > 0 ? '\\text{2}' : delta === 0 ? '\\text{1}' : '\\text{0}',
      })
      return out
    }
    case 'power':
      out.push({
        label: { en: 'Through', zh: '过点' },
        latex: '(1,1)',
      })
      out.push({
        label: { en: 'Parity', zh: '奇偶性' },
        latex: Number.isInteger(params.a)
          ? (params.a as number) % 2 === 0
            ? '\\text{even}'
            : '\\text{odd}'
          : '\\text{—}',
      })
      return out
    case 'exponential': {
      const a = params.a ?? 1
      out.push({ label: { en: 'Passes through', zh: '过定点' }, latex: '(0,1)' })
      out.push({
        label: { en: 'Monotonic', zh: '单调性' },
        latex: a > 1 ? '\\text{increasing }\\nearrow' : '\\text{decreasing }\\searrow',
      })
      out.push({ label: { en: 'Asymptote', zh: '渐近线' }, latex: 'y=0' })
      return out
    }
    case 'logarithmic': {
      const a = params.a ?? 1
      out.push({ label: { en: 'Passes through', zh: '过定点' }, latex: '(1,0)' })
      out.push({
        label: { en: 'Monotonic', zh: '单调性' },
        latex: a > 1 ? '\\text{increasing }\\nearrow' : '\\text{decreasing }\\searrow',
      })
      out.push({ label: { en: 'Asymptote', zh: '渐近线' }, latex: 'x=0' })
      return out
    }
    default:
      return out
  }
}
