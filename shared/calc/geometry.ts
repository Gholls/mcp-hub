export interface Point {
  x: number
  y: number
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function polygonArea(points: Point[]): number {
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}

export function polygonPerimeter(points: Point[]): number {
  let sum = 0
  for (let i = 0; i < points.length; i++) sum += dist(points[i], points[(i + 1) % points.length])
  return sum
}

function angleAt(prev: Point, vertex: Point, next: Point): number {
  const v1 = { x: prev.x - vertex.x, y: prev.y - vertex.y }
  const v2 = { x: next.x - vertex.x, y: next.y - vertex.y }
  const dot = v1.x * v2.x + v1.y * v2.y
  const mag = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y)
  if (mag === 0) return 0
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI
}

export interface TriangleMeasures {
  sides: [number, number, number]
  angles: [number, number, number]
  area: number
  perimeter: number
  isRight: boolean
  isIsosceles: boolean
  isEquilateral: boolean
}

/** Vertices P0,P1,P2; side a is opposite P0, angle A is at P0. */
export function triangleMeasures(p: Point[]): TriangleMeasures {
  const [p0, p1, p2] = p
  const a = dist(p1, p2)
  const b = dist(p0, p2)
  const c = dist(p0, p1)
  const angles: [number, number, number] = [
    angleAt(p1, p0, p2),
    angleAt(p0, p1, p2),
    angleAt(p0, p2, p1),
  ]
  const s = (a + b + c) / 2
  const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)))
  const eq = (x: number, y: number) => Math.abs(x - y) < 0.15
  return {
    sides: [a, b, c],
    angles,
    area,
    perimeter: a + b + c,
    isRight: angles.some((ang) => Math.abs(ang - 90) < 0.5),
    isEquilateral: eq(a, b) && eq(b, c),
    isIsosceles: eq(a, b) || eq(b, c) || eq(a, c),
  }
}

export function quadrilateralAngles(points: Point[]): number[] {
  return points.map((_, i) =>
    angleAt(points[(i + points.length - 1) % points.length], points[i], points[(i + 1) % points.length]),
  )
}

export type QuadType = 'square' | 'rectangle' | 'rhombus' | 'parallelogram' | 'trapezoid' | 'quadrilateral'

const cross = (a: Point, o: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)

export function classifyQuadrilateral(points: Point[]): QuadType {
  const [a, b, c, d] = points
  const parallel = (p: Point, q: Point, r: Point, s: Point) =>
    Math.abs(cross(p, q, { x: q.x + (s.x - r.x), y: q.y + (s.y - r.y) })) < 0.2
  const ab = dist(a, b)
  const bc = dist(b, c)
  const p1 = parallel(a, b, d, c)
  const p2 = parallel(b, c, a, d)
  const rightAngle = Math.abs(quadrilateralAngles(points)[0] - 90) < 0.5
  const equalAdj = Math.abs(ab - bc) < 0.15
  if (p1 && p2) {
    if (rightAngle && equalAdj) return 'square'
    if (rightAngle) return 'rectangle'
    if (equalAdj) return 'rhombus'
    return 'parallelogram'
  }
  if (p1 || p2) return 'trapezoid'
  return 'quadrilateral'
}

export interface CircleMeasures {
  radius: number
  diameter: number
  circumference: number
  area: number
}

export function circleMeasures(radius: number): CircleMeasures {
  return {
    radius,
    diameter: 2 * radius,
    circumference: 2 * Math.PI * radius,
    area: Math.PI * radius * radius,
  }
}
