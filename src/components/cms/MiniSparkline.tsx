'use client'

import { useMemo, useEffect, useRef } from 'react'

interface MiniSparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fillColor?: string
  trend?: 'up' | 'down' | 'flat'
}

/**
 * Generate a smooth SVG path using Catmull-Rom → cubic Bézier conversion.
 * This produces a natural-looking curve through all data points.
 */
function buildSmoothPath(points: Array<{ x: number; y: number }>, w: number, h: number): string {
  if (points.length < 2) return ''

  const tension = 0.3
  let d = `M ${points[0].x},${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]

    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }

  return d
}

export function MiniSparkline({
  data,
  width = 100,
  height = 32,
  color = '#a78bfa',
  fillColor,
  trend,
}: MiniSparklineProps) {
  const pathRef = useRef<SVGPathElement>(null)
  const id = useRef(`sparkline-${Math.random().toString(36).slice(2, 9)}`)

  const { linePath, fillPath, totalLength } = useMemo(() => {
    if (!data || data.length < 2) {
      return { linePath: '', fillPath: '', totalLength: 0 }
    }

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const padding = { top: 2, bottom: 2, left: 1, right: 1 }
    const innerW = width - padding.left - padding.right
    const innerH = height - padding.top - padding.bottom

    const points = data.map((v, i) => ({
      x: padding.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2),
      y: padding.top + innerH - ((v - min) / range) * innerH,
    }))

    const lp = buildSmoothPath(points, width, height)

    // Fill path: line + bottom close
    const fp = `${lp} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`

    // Calculate approximate path length
    let approxLength = 0
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x
      const dy = points[i].y - points[i - 1].y
      approxLength += Math.sqrt(dx * dx + dy * dy) * 1.3 // rough bezier multiplier
    }

    return { linePath: lp, fillPath: fp, totalLength: approxLength }
  }, [data, width, height])

  // Animated stroke-dashoffset drawing effect
  useEffect(() => {
    const el = pathRef.current
    if (!el || totalLength <= 0) return

    // Get the actual total length from the DOM
    const len = el.getTotalLength()
    if (!len) return

    el.style.strokeDasharray = `${len}`
    el.style.strokeDashoffset = `${len}`
    el.style.transition = 'none'

    // Trigger reflow
    void el.getBoundingClientRect()

    el.style.transition = `stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)`
    el.style.strokeDashoffset = '0'
  }, [totalLength, linePath])

  // Trend arrow indicator
  const trendArrow = useMemo(() => {
    if (trend === 'up') return { d: 'M-3,2 L0,-3 L3,2', color: '#4ade80' }
    if (trend === 'down') return { d: 'M-3,-2 L0,3 L3,-2', color: '#f87171' }
    return null
  }, [trend])

  if (data.length < 2) return null

  const gradientId = id.current

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block overflow-visible"
      role="img"
      aria-label="Mini sparkline chart"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor ?? color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={fillColor ?? color} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Gradient fill below line */}
      {fillPath && (
        <path
          d={fillPath}
          fill={`url(#${gradientId})`}
        />
      )}

      {/* Main line */}
      <path
        ref={pathRef}
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Trend arrow at the end of the line */}
      {trendArrow && (
        <path
          d={trendArrow.d}
          fill="none"
          stroke={trendArrow.color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform={`translate(${width - 2}, ${height / 2})`}
        />
      )}
    </svg>
  )
}
