export default function Sparkline({
  values,
  width = 320,
  height = 90,
  color = '#22d3ee',
  fill = 'rgba(34,211,238,0.15)',
}: {
  values: number[]
  width?: number
  height?: number
  color?: string
  fill?: string
}) {
  if (values.length === 0) return <svg viewBox={`0 0 ${width} ${height}`} className="w-full" />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 6
  const x = (i: number) => pad + (i / Math.max(1, values.length - 1)) * (width - pad * 2)
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2)
  const line = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full" preserveAspectRatio="none">
      <polygon points={area} fill={fill} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  )
}
