"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChartBarIcon,
  CpuChipIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  BoltIcon,
  GlobeAltIcon,
  UsersIcon,
  EyeIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

interface MetricData {
  name: string;
  value: number;
  unit: string;
  change: number;
  status: "healthy" | "warning" | "critical";
}

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "acknowledged" | "resolved";
  triggeredAt: Date;
  source: string;
}

interface SystemHealth {
  service: string;
  status: "healthy" | "degraded" | "unhealthy";
  uptime: number;
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
}

export default function MonitoringPage() {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/auth/login");
    }
  }, [router]);
  const [timeRange, setTimeRange] = useState<string>("24h");
  const [selectedMetric, setSelectedMetric] = useState<string>("overview");


  // Real data integration
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      import('@/services/metrics.service').then(({ MetricsService }) => MetricsService.getOverviewMetrics(timeRange)),
      import('@/services/metrics.service').then(({ MetricsService }) => MetricsService.getSystemHealth()),
      import('@/services/metrics.service').then(({ MetricsService }) => MetricsService.getActivities(10, 'all')),
    ])
      .then(([overview, health, activities]) => {
        // Use DashboardMetrics.kpis for metrics
        const kpis = (overview as any)?.kpis || {};
        setMetrics([
          {
            name: 'Total Projects',
            value: kpis.totalProjects ?? 0,
            unit: '',
            change: 0,
            status: 'healthy',
          },
          {
            name: 'Active Pipelines',
            value: kpis.activePipelines ?? 0,
            unit: '',
            change: 0,
            status: 'healthy',
          },
          {
            name: 'Pipeline Success Rate',
            value: kpis.pipelineSuccessRate ?? 0,
            unit: '%',
            change: 0,
            status: 'healthy',
          },
          {
            name: 'Test Pass Rate',
            value: kpis.testPassRate ?? 0,
            unit: '%',
            change: 0,
            status: 'healthy',
          },
          {
            name: 'Deployment Success Rate',
            value: kpis.deploymentSuccessRate ?? 0,
            unit: '%',
            change: 0,
            status: 'healthy',
          },
          {
            name: 'Avg Pipeline Duration',
            value: kpis.avgPipelineDuration ?? 0,
            unit: 's',
            change: 0,
            status: 'healthy',
          },
        ]);
        // Use SystemHealth.system for health
        setSystemHealth([
          {
            service: 'System',
            status: 'healthy',
            uptime: health.uptime ?? 0,
            responseTime: health.system?.cpuUsage ?? 0,
            errorRate: health.system?.memoryUsage ?? 0,
            lastCheck: health.timestamp ? new Date(health.timestamp) : new Date(),
          },
        ]);
        setAlerts(
          (activities || []).filter((a: any) => a.type === 'alert').map((a: any) => ({
            id: a.id,
            title: a.title,
            message: a.message,
            severity: a.severity,
            status: a.status,
            triggeredAt: new Date(a.timestamp),
            source: a.source,
          }))
        );
      })
      .catch((err) => {
        setError(err.message || 'Failed to load monitoring data');
      })
      .finally(() => setLoading(false));
  }, [timeRange]);

  const getMetricIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "response time":
        return <ClockIcon className="w-5 h-5" />;
      case "throughput":
        return <BoltIcon className="w-5 h-5" />;
      case "error rate":
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      case "cpu usage":
        return <CpuChipIcon className="w-5 h-5" />;
      case "memory usage":
        return <ServerIcon className="w-5 h-5" />;
      case "active users":
        return <UsersIcon className="w-5 h-5" />;
      default:
        return <ChartBarIcon className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-500";
      case "warning":
      case "degraded":
        return "text-yellow-500";
      case "critical":
      case "unhealthy":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: "success" as const,
      warning: "warning" as const,
      degraded: "warning" as const,
      critical: "destructive" as const,
      unhealthy: "destructive" as const,
    };
    return variants[status as keyof typeof variants] || "secondary";
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: "secondary" as const,
      medium: "warning" as const,
      high: "destructive" as const,
      critical: "destructive" as const,
    };
    return variants[severity as keyof typeof variants] || "secondary";
  };

  const getAlertStatusBadge = (status: string) => {
    const variants = {
      active: "destructive" as const,
      acknowledged: "warning" as const,
      resolved: "success" as const,
    };
    return variants[status as keyof typeof variants] || "secondary";
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(1)}%`;
  };

  const formatChange = (change: number) => {
    const sign = change > 0 ? "+" : "";
    return `${sign}${change}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Monitoring & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time system monitoring and performance analytics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Cog6ToothIcon className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {["1h", "24h", "7d", "30d"].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === range
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.name} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${getStatusColor(metric.status)} bg-opacity-10`}>
                  {getMetricIcon(metric.name)}
                </div>
                <Badge variant={getStatusBadge(metric.status)}>
                  {metric.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.name}
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {metric.value.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {metric.unit}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`text-sm font-medium ${
                    metric.change > 0 
                      ? metric.name === "Error Rate" ? "text-red-600" : "text-green-600"
                      : metric.name === "Error Rate" ? "text-green-600" : "text-red-600"
                  }`}>
                    {formatChange(metric.change)}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    vs last {timeRange}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Overview</CardTitle>
          <CardDescription>Current status of all system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemHealth.map((system) => (
              <div
                key={system.service}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${getStatusColor(system.status)} bg-opacity-10`}>
                    <ServerIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {system.service}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Last checked: {system.lastCheck.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatUptime(system.uptime)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Response</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {system.responseTime}ms
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Error Rate</p>
                    <p className={`font-semibold ${system.errorRate > 1 ? 'text-red-600' : 'text-green-600'}`}>
                      {system.errorRate}%
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusBadge(system.status)}>
                      {system.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Recent alerts and notifications</CardDescription>
            </div>
            <Badge variant="destructive">
              {alerts.filter(alert => alert.status === "active").length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg mt-1 ${
                    alert.severity === "critical" ? "text-red-500 bg-red-50 dark:bg-red-900/20" :
                    alert.severity === "high" ? "text-orange-500 bg-orange-50 dark:bg-orange-900/20" :
                    alert.severity === "medium" ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" :
                    "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  }`}>
                    <ExclamationTriangleIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {alert.title}
                      </h3>
                      <Badge variant={getSeverityBadge(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Source: {alert.source}</span>
                      <span>•</span>
                      <span>Triggered: {alert.triggeredAt.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={getAlertStatusBadge(alert.status)}>
                    {alert.status}
                  </Badge>
                  {alert.status === "active" && (
                    <Button variant="outline" size="sm">
                      Acknowledge
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>System performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">
                Performance charts will be displayed here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Integration with monitoring tools like Prometheus, Grafana, or custom metrics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}