"use client"

import React from "react"
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface DataPoint {
  label: string
  value: number
  color?: string
}

interface ChartProps {
  data: DataPoint[]
  height?: number
  showGrid?: boolean
  showValues?: boolean
}

// Professional Area Chart
export function ProfessionalAreaChart({ data, height = 300 }: ChartProps) {
  const chartData = data.map(item => ({ name: item.label, value: item.value }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          labelStyle={{ color: '#1f2937', fontWeight: 600, marginBottom: '4px' }}
          itemStyle={{ color: '#10b981', fontSize: '14px' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#colorValue)"
          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: '#10b981' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Professional Line Chart
export function ProfessionalLineChart({ data, height = 300 }: ChartProps) {
  const chartData = data.map(item => ({ name: item.label, value: item.value }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          labelStyle={{ color: '#1f2937', fontWeight: 600, marginBottom: '4px' }}
          itemStyle={{ color: '#10b981', fontSize: '14px' }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#10b981"
          strokeWidth={3}
          dot={{ fill: '#fff', stroke: '#10b981', strokeWidth: 2, r: 5 }}
          activeDot={{ r: 7, fill: '#10b981' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Professional Bar Chart
export function ProfessionalBarChart({ data, height = 300 }: ChartProps) {
  const chartData = data.map(item => ({ name: item.label, value: item.value }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          labelStyle={{ color: '#1f2937', fontWeight: 600, marginBottom: '4px' }}
          itemStyle={{ color: '#2563eb', fontSize: '14px' }}
          cursor={{ fill: '#f3f4f6' }}
        />
        <Bar
          dataKey="value"
          fill="#2563eb"
          radius={[8, 8, 0, 0]}
          maxBarSize={60}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Professional Pie Chart
export function ProfessionalPieChart({ data, height = 300 }: ChartProps) {
  const COLORS = ['#2563eb', '#60a5fa', '#6b7280', '#9ca3af']

  const chartData = data.map((item, index) => ({
    name: item.label,
    value: item.value,
    color: item.color || COLORS[index % COLORS.length],
  }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPie>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
            formatter={(value: number) => [
              `${value} (${((value / total) * 100).toFixed(1)}%)`,
              '',
            ]}
          />
        </RechartsPie>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-4">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
              <p className="text-xs text-gray-500">
                {item.value} ({((item.value / total) * 100).toFixed(1)}%)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
