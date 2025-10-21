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
        <div className="flex items-end justify-between gap-4" style={{ height: `${height}px` }}>
          {data.map((item, index) => {
            const barHeight = getBarHeight(item.value)
            const color = item.color || defaultColors[index % defaultColors.length]

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-3">
                <div className="relative w-full flex flex-col justify-end" style={{ height: "100%" }}>
                  {showValues && (
                    <div className="text-sm font-bold text-gray-800 text-center mb-2">
                      {item.value}
                    </div>
                  )}
                  <div
                    className={`w-full ${color} rounded-t-xl shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-xl cursor-pointer relative overflow-hidden group`}
                    style={{ height: `${barHeight}%`, minHeight: "8px" }}
                    title={`${item.label}: ${item.value}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12"></div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-700 text-center w-full truncate">
                  {item.label}
                </div>
              </div>
            )
          })}
        </div>
        {showGrid && (
          <div className="mt-4 pt-3 border-t border-gray-300">
            <div className="flex justify-between text-xs font-medium text-gray-600">
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
                <line x1="0" y1="25" x2="100" y2="25" stroke="#d1d5db" strokeWidth="0.3" strokeDasharray="2,2" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#d1d5db" strokeWidth="0.3" strokeDasharray="2,2" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="#d1d5db" strokeWidth="0.3" strokeDasharray="2,2" />
              </>
            )}
            {type === "area" && (
              <>
                <defs>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path
                  d={areaD}
                  fill="url(#areaGradient)"
                  className="transition-all duration-500"
                />
              </>
            )}
            <path
              d={pathD}
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500 drop-shadow-md"
              filter="drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))"
            />
            {points.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="1.5"
                  fill="white"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="2.5"
                  className="transition-all cursor-pointer hover:r-4"
                  filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))"
                >
                  <title>{`${point.item.label}: ${point.item.value}`}</title>
                </circle>
              </g>
            ))}
          </svg>
        </div>
        <div className="flex justify-between mt-3">
          {data.map((item, index) => (
            <div key={index} className="text-sm font-semibold text-gray-700 text-center flex-1">
              {item.label}
            </div>
          ))}
        </div>
        {showGrid && (
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="flex justify-between text-xs font-medium text-gray-600">
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
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <svg width={size} height={size} viewBox="0 0 100 100" className="filter drop-shadow-lg">
          <defs>
            {data.map((item, index) => {
              const color = item.color || defaultColors[index % defaultColors.length]
              return (
                <linearGradient key={index} id={`pieGradient${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity="1" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.8" />
                </linearGradient>
              )
            })}
          </defs>
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

            return (
              <g key={index}>
                <path
                  d={pathData}
                  fill={`url(#pieGradient${index})`}
                  className="hover:opacity-90 transition-all duration-300 cursor-pointer hover:scale-105"
                  style={{ transformOrigin: '50% 50%' }}
                  filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))"
                >
                  <title>{`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}</title>
                </path>
              </g>
            )
          })}
          <circle cx="50" cy="50" r="22" fill="white" filter="drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))" />
          <text
            x="50"
            y="48"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-base font-bold"
            fill="#1f2937"
          >
            {total}
          </text>
          <text
            x="50"
            y="56"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs"
            fill="#6b7280"
          >
            Total
          </text>
        </svg>
      </div>

      {showLegend && (
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {data.map((item, index) => {
            const color = item.color || defaultColors[index % defaultColors.length]
            const percentage = ((item.value / total) * 100).toFixed(1)

            return (
              <div key={index} className="flex items-center gap-2 group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-all duration-200">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
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
