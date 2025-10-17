"use client"

import { useMemo } from "react"

interface DataPoint {
  label: string
  value: number
  color?: string
}

interface SimpleChartProps {
  data: DataPoint[]
  type?: "bar" | "line" | "area"
  height?: number
  showValues?: boolean
  showGrid?: boolean
}

export function SimpleChart({
  data = [],
  type = "bar",
  height = 200,
  showValues = false,
  showGrid = true,
}: SimpleChartProps) {
  // Add safety checks
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    )
  }

  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value)), [data])
  const minValue = useMemo(() => Math.min(...data.map((d) => d.value), 0), [data])
  const range = maxValue - minValue

  const getBarHeight = (value: number) => {
    return ((value - minValue) / range) * 100
  }

  const defaultColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-indigo-500",
  ]

  if (type === "bar") {
    return (
      <div className="w-full">
        <div className="flex items-end justify-between gap-2" style={{ height: `${height}px` }}>
          {data.map((item, index) => {
            const barHeight = getBarHeight(item.value)
            const color = item.color || defaultColors[index % defaultColors.length]

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full flex flex-col justify-end" style={{ height: "100%" }}>
                  {showValues && (
                    <div className="text-xs font-semibold text-gray-700 text-center mb-1">
                      {item.value}
                    </div>
                  )}
                  <div
                    className={`w-full ${color} rounded-t transition-all duration-500 hover:opacity-80 cursor-pointer`}
                    style={{ height: `${barHeight}%`, minHeight: "4px" }}
                    title={`${item.label}: ${item.value}`}
                  />
                </div>
                <div className="text-xs text-gray-600 text-center w-full truncate">
                  {item.label}
                </div>
              </div>
            )
          })}
        </div>
        {showGrid && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{minValue}</span>
              <span>{Math.round((maxValue + minValue) / 2)}</span>
              <span>{maxValue}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (type === "line" || type === "area") {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - getBarHeight(item.value)
      return { x, y, item }
    })

    const pathD = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ")

    const areaD =
      type === "area"
        ? `${pathD} L 100 100 L 0 100 Z`
        : ""

    return (
      <div className="w-full">
        <div className="relative" style={{ height: `${height}px` }}>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {showGrid && (
              <>
                <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.5" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.5" />
              </>
            )}
            {type === "area" && (
              <path
                d={areaD}
                fill="rgba(59, 130, 246, 0.2)"
                className="transition-all duration-500"
              />
            )}
            <path
              d={pathD}
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500"
            />
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="2"
                fill="rgb(59, 130, 246)"
                className="hover:r-3 transition-all cursor-pointer"
              >
                <title>{`${point.item.label}: ${point.item.value}`}</title>
              </circle>
            ))}
          </svg>
        </div>
        <div className="flex justify-between mt-2">
          {data.map((item, index) => (
            <div key={index} className="text-xs text-gray-600 text-center flex-1">
              {item.label}
            </div>
          ))}
        </div>
        {showGrid && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{minValue}</span>
              <span>{maxValue}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}

// Pie Chart Component
interface PieChartProps {
  data: DataPoint[]
  size?: number
  showLegend?: boolean
}

export function PieChart({ data = [], size = 200, showLegend = true }: PieChartProps) {
  const total = useMemo(() => {
    if (!data || data.length === 0) return 0
    return data.reduce((sum, item) => sum + item.value, 0)
  }, [data])

  const defaultColors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#a855f7", // purple
    "#f59e0b", // orange
    "#ec4899", // pink
    "#6366f1", // indigo
  ]

  // Return early if no data
  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: size }}>
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    )
  }

  let currentAngle = -90 // Start at top

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100
          const angle = (percentage / 100) * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angle
          currentAngle = endAngle

          const startRad = (startAngle * Math.PI) / 180
          const endRad = (endAngle * Math.PI) / 180

          const x1 = 50 + 40 * Math.cos(startRad)
          const y1 = 50 + 40 * Math.sin(startRad)
          const x2 = 50 + 40 * Math.cos(endRad)
          const y2 = 50 + 40 * Math.sin(endRad)

          const largeArc = angle > 180 ? 1 : 0

          const pathData = [
            `M 50 50`,
            `L ${x1} ${y1}`,
            `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`,
            `Z`,
          ].join(" ")

          const color = item.color || defaultColors[index % defaultColors.length]

          return (
            <g key={index}>
              <path
                d={pathData}
                fill={color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                <title>{`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}</title>
              </path>
            </g>
          )
        })}
        <circle cx="50" cy="50" r="20" fill="white" />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm font-bold"
          fill="#374151"
        >
          {total}
        </text>
      </svg>

      {showLegend && (
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
          {data.map((item, index) => {
            const color = item.color || defaultColors[index % defaultColors.length]
            const percentage = ((item.value / total) * 100).toFixed(1)

            return (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700 truncate">
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.value} ({percentage}%)
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
