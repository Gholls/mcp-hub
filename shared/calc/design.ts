export type GradientKind = 'linear' | 'radial'

export function buildGradient(angle: number, from: string, to: string, kind: GradientKind = 'linear'): string {
  return kind === 'radial'
    ? `radial-gradient(circle, ${from}, ${to})`
    : `linear-gradient(${Math.round(angle)}deg, ${from}, ${to})`
}

export interface BoxShadowOptions {
  x: number
  y: number
  blur: number
  spread: number
  color: string
  inset: boolean
}

export function buildBoxShadow(o: BoxShadowOptions): string {
  return `${o.inset ? 'inset ' : ''}${o.x}px ${o.y}px ${o.blur}px ${o.spread}px ${o.color}`
}

export function buildBorderRadius(tl: number, tr: number, br: number, bl: number): string {
  return `${tl}px ${tr}px ${br}px ${bl}px`
}
