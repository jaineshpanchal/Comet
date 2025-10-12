"use client";

import React, { useState } from "react";
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
  const [timeRange, setTimeRange] = useState<string>("24h");
  const [selectedMetric, setSelectedMetric] = useState<string>("overview");

  // Mock data
  const metrics: MetricData[] = [
    {
      name: "Response Time",
      value: 245,
      unit: "ms",
      change: -12,
      status: "healthy",
    },
    {
      name: "Throughput",
      value: 1847,
      unit: "req/min",
      change: 8,
      status: "healthy",
    },
    {
      name: "Error Rate",
      value: 0.8,
      unit: "%",
      change: 0.2,
      status: "warning",
    },
    {
      name: "CPU Usage",
      value: 68,
      unit: "%",
      change: 15,
      status: "warning",
    },
    {
      name: "Memory Usage",
      value: 82,
      unit: "%",
      change: 5,
      status: "critical",
    },
    {
      name: "Active Users",
      value: 1234,
      unit: "users",
      change: 23,
      status: "healthy",
    },
  ];

  const alerts: Alert[] = [
    {
      id: "1",
      title: "High Memory Usage",
      message: "Memory usage has exceeded 80% for the past 15 minutes in production environment",
      severity: "critical",
      status: "active",
      triggeredAt: new Date("2024-01-15T11:30:00"),
      source: "Production API",
    },
    {
      id: "2",
      title: "Increased Error Rate",
      message: "Error rate has increased to 0.8% in the authentication service",
      severity: "medium",
      status: "acknowledged",
      triggeredAt: new Date("2024-01-15T10:45:00"),
      source: "Auth Service",
    },
    {
      id: "3",
      title: "Database Connection Pool",
      message: "Database connection pool utilization is at 95%",
      severity: "high",
      status: "active",
      triggeredAt: new Date("2024-01-15T11:15:00"),
      source: "Database",
    },
    {
      id: "4",
      title: "SSL Certificate Expiry",
      message: "SSL certificate for api.comet.com will expire in 7 days",
      severity: "low",
      status: "resolved",
      triggeredAt: new Date("2024-01-15T08:00:00"),
      source: "Security",
    },
  ];

  const systemHealth: SystemHealth[] = [
    {
      service: "Frontend App",
      status: "healthy",
      uptime: 99.9,
      responseTime: 120,
      errorRate: 0.1,
      lastCheck: new Date("2024-01-15T11:35:00"),
    },
    {
      service: "API Gateway",
      status: "healthy",
      uptime: 99.8,
      responseTime: 85,
      errorRate: 0.3,
      lastCheck: new Date("2024-01-15T11:35:00"),
    },
    {
      service: "Auth Service",
      status: "degraded",
      uptime: 99.2,
      responseTime: 340,
      errorRate: 0.8,
      lastCheck: new Date("2024-01-15T11:35:00"),
    },
    {
      service: "Database",
      status: "unhealthy",
      uptime: 98.5,
      responseTime: 890,
      errorRate: 2.1,
      lastCheck: new Date("2024-01-15T11:35:00"),
    },
    {
      service: "Cache Redis",
      status: "healthy",
      uptime: 99.9,
      responseTime: 15,
      errorRate: 0.0,
      lastCheck: new Date("2024-01-15T11:35:00"),
    },
    {
      service: "File Storage",
      status: "healthy",
      uptime: 99.7,
      responseTime: 200,
      errorRate: 0.2,
      lastCheck: new Date("2024-01-15T11:35:00"),
    },
  ];

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