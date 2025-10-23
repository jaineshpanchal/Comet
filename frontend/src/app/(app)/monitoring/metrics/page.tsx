"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  CpuChipIcon,
  ServerIcon,
  CircleStackIcon,
  GlobeAltIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  network: {
    in: number
    out: number
  }
  requests: number
  latency: number
}

export default function SystemMetricsPage() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: { in: 0, out: 0 },
    requests: 0,
    latency: 0,
  })
  const [history, setHistory] = useState<SystemMetrics[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Simulate real-time metrics
  useEffect(() => {
    const generateMetrics = (): SystemMetrics => ({
      cpu: Math.random() * 100,
      memory: 60 + Math.random() * 20,
      disk: 45 + Math.random() * 10,
      network: {
        in: Math.random() * 1000,
        out: Math.random() * 800,
      },
      requests: Math.floor(Math.random() * 500) + 100,
      latency: Math.random() * 200 + 50,
    })

    setMetrics(generateMetrics())

    if (autoRefresh) {
      const interval = setInterval(() => {
        const newMetrics = generateMetrics()
        setMetrics(newMetrics)
        setHistory(prev => [...prev.slice(-59), newMetrics]) // Keep last 60 data points
      }, 2000) // Update every 2 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600 bg-red-50 border-red-200'
    if (value >= thresholds.warning) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  const getStatus = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'Critical'
    if (value >= thresholds.warning) return 'Warning'
    return 'Healthy'
  }

  const MetricGraph = ({ data, label, color = 'blue' }: { data: number[]; label: string; color?: string }) => {
    const max = Math.max(...data, 100)
    const height = 100

    return (
      <div className="relative">
        <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
        <div className="h-24 flex items-end gap-0.5">
          {data.map((value, index) => {
            const barHeight = (value / max) * height
            return (
              <div
                key={index}
                className={`flex-1 bg-${color}-500 rounded-t transition-all`}
                style={{ height: `${barHeight}%`, minHeight: '2px' }}
                title={`${value.toFixed(1)}`}
              />
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>60s ago</span>
          <span>Now</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <Link
          href="/monitoring"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Monitoring
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
              System Metrics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Real-time system performance and resource utilization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Auto-refresh</span>
            </label>
            {autoRefresh && (
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </div>
                <span className="text-sm text-green-600 font-medium">Live</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CPU */}
        <Card className={`${getStatusColor(metrics.cpu, { warning: 70, critical: 90 })}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CpuChipIcon className="h-5 w-5" />
                CPU Usage
              </CardTitle>
              <span className="text-xs font-medium px-2 py-1 rounded-full border">
                {getStatus(metrics.cpu, { warning: 70, critical: 90 })}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">{metrics.cpu.toFixed(1)}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full ${
                  metrics.cpu >= 90 ? 'bg-red-500' :
                  metrics.cpu >= 70 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${metrics.cpu}%` }}
              ></div>
            </div>
            <p className="text-xs">4 cores • 8 threads</p>
          </CardContent>
        </Card>

        {/* Memory */}
        <Card className={`${getStatusColor(metrics.memory, { warning: 75, critical: 90 })}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ServerIcon className="h-5 w-5" />
                Memory Usage
              </CardTitle>
              <span className="text-xs font-medium px-2 py-1 rounded-full border">
                {getStatus(metrics.memory, { warning: 75, critical: 90 })}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">{metrics.memory.toFixed(1)}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full ${
                  metrics.memory >= 90 ? 'bg-red-500' :
                  metrics.memory >= 75 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${metrics.memory}%` }}
              ></div>
            </div>
            <p className="text-xs">{(metrics.memory * 16 / 100).toFixed(1)} GB / 16 GB</p>
          </CardContent>
        </Card>

        {/* Disk */}
        <Card className={`${getStatusColor(metrics.disk, { warning: 80, critical: 95 })}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CircleStackIcon className="h-5 w-5" />
                Disk Usage
              </CardTitle>
              <span className="text-xs font-medium px-2 py-1 rounded-full border">
                {getStatus(metrics.disk, { warning: 80, critical: 95 })}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">{metrics.disk.toFixed(1)}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${metrics.disk}%` }}
              ></div>
            </div>
            <p className="text-xs">{(metrics.disk * 500 / 100).toFixed(0)} GB / 500 GB</p>
          </CardContent>
        </Card>
      </div>

      {/* Network & Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Network */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GlobeAltIcon className="h-5 w-5" />
              Network Traffic
            </CardTitle>
            <CardDescription>Real-time network I/O</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ArrowTrendingDownIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Incoming</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {metrics.network.in.toFixed(0)} Mbps
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${(metrics.network.in / 1000) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Outgoing</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {metrics.network.out.toFixed(0)} Mbps
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-purple-500"
                  style={{ width: `${(metrics.network.out / 1000) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests & Latency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              Application Performance
            </CardTitle>
            <CardDescription>Request metrics and latency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Requests/sec</span>
                <span className="text-2xl font-bold text-green-600">{metrics.requests}</span>
              </div>
              <p className="text-xs text-gray-500">HTTP requests per second</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Avg Latency</span>
                <span className="text-2xl font-bold text-orange-600">
                  {metrics.latency.toFixed(0)}ms
                </span>
              </div>
              <p className="text-xs text-gray-500">Response time (P95)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CPU History (Last 60s)</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricGraph
              data={history.map(h => h.cpu)}
              label="CPU Usage %"
              color="blue"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory History (Last 60s)</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricGraph
              data={history.map(h => h.memory)}
              label="Memory Usage %"
              color="purple"
            />
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Server details and configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Operating System</p>
              <p className="font-medium mt-1">Ubuntu 22.04 LTS</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Kernel Version</p>
              <p className="font-medium mt-1">5.15.0-58-generic</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Uptime</p>
              <p className="font-medium mt-1">15 days, 3 hours</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Load Average</p>
              <p className="font-medium mt-1">0.45, 0.52, 0.48</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
