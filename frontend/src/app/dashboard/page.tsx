"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  color?: "default" | "success" | "warning" | "error";
}

function MetricCard({ title, value, change, trend, icon: Icon, color = "default" }: MetricCardProps) {
  const colorClasses = {
    default: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20",
    success: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20",
    warning: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20",
    error: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`rounded-md p-2 ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground">
            <span
              className={
                trend === "up"
                  ? "text-green-600"
                  : trend === "down"
                  ? "text-red-600"
                  : "text-gray-600"
              }
            >
              {change}
            </span>{" "}
            from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface PipelineCardProps {
  name: string;
  status: "running" | "success" | "failed" | "pending";
  branch: string;
  duration?: string;
  progress?: number;
  lastRun: string;
}

function PipelineCard({ name, status, branch, duration, progress, lastRun }: PipelineCardProps) {
  const statusConfig = {
    running: { badge: "running", color: "bg-blue-500", icon: PlayIcon },
    success: { badge: "success", color: "bg-green-500", icon: CheckCircleIcon },
    failed: { badge: "failed", color: "bg-red-500", icon: XCircleIcon },
    pending: { badge: "pending", color: "bg-yellow-500", icon: ClockIcon },
  };

  const config = statusConfig[status];

  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant={status as any}>{config.badge}</Badge>
        </div>
        <CardDescription>Branch: {branch}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {status === "running" && progress !== undefined && (
            <Progress value={progress} animated showPercentage />
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last run: {lastRun}</span>
            {duration && <span className="text-muted-foreground">Duration: {duration}</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <EyeIcon className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button variant="outline" size="sm">
              View Logs
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ActivityItemProps {
  type: "success" | "error" | "warning" | "info";
  title: string;
  subtitle: string;
  timestamp: string;
}

function ActivityItem({ type, title, subtitle, timestamp }: ActivityItemProps) {
  const typeConfig = {
    success: { icon: CheckCircleIcon, color: "text-green-600" },
    error: { icon: XCircleIcon, color: "text-red-600" },
    warning: { icon: ExclamationTriangleIcon, color: "text-orange-600" },
    info: { icon: ChartBarIcon, color: "text-blue-600" },
  };

  const config = typeConfig[type];

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`rounded-full p-1 ${config.color}`}>
        <config.icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <span className="text-xs text-muted-foreground">{timestamp}</span>
    </div>
  );
}

export default function DashboardPage() {
  const metrics = [
    {
      title: "Pipeline Success Rate",
      value: "98.5%",
      change: "+2.1%",
      trend: "up" as const,
      icon: ChartBarIcon,
      color: "success" as const,
    },
    {
      title: "Average Build Time",
      value: "4m 32s",
      change: "-15s",
      trend: "up" as const,
      icon: ClockIcon,
      color: "default" as const,
    },
    {
      title: "Active Pipelines",
      value: "12",
      change: "+3",
      trend: "up" as const,
      icon: PlayIcon,
      color: "default" as const,
    },
    {
      title: "Failed Builds Today",
      value: "2",
      change: "-5",
      trend: "up" as const,
      icon: XCircleIcon,
      color: "error" as const,
    },
  ];

  const pipelines = [
    {
      name: "Frontend Build",
      status: "running" as const,
      branch: "main",
      progress: 65,
      lastRun: "2 minutes ago",
    },
    {
      name: "Backend API Tests",
      status: "success" as const,
      branch: "develop",
      duration: "3m 45s",
      lastRun: "5 minutes ago",
    },
    {
      name: "E2E Testing Suite",
      status: "failed" as const,
      branch: "feature/auth",
      duration: "8m 12s",
      lastRun: "15 minutes ago",
    },
    {
      name: "Mobile App Deploy",
      status: "pending" as const,
      branch: "release/v2.1",
      lastRun: "1 hour ago",
    },
  ];

  const activities = [
    {
      type: "success" as const,
      title: "Pipeline completed successfully",
      subtitle: "frontend-build-pipeline",
      timestamp: "2 minutes ago",
    },
    {
      type: "warning" as const,
      title: "Test coverage below threshold",
      subtitle: "backend-api-tests (89% coverage)",
      timestamp: "5 minutes ago",
    },
    {
      type: "error" as const,
      title: "E2E tests failed",
      subtitle: "mobile-app-tests (3 failures)",
      timestamp: "15 minutes ago",
    },
    {
      type: "info" as const,
      title: "New deployment started",
      subtitle: "production environment",
      timestamp: "30 minutes ago",
    },
    {
      type: "success" as const,
      title: "Security scan completed",
      subtitle: "0 vulnerabilities found",
      timestamp: "1 hour ago",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your projects.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Pipelines */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Pipelines</h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {pipelines.map((pipeline) => (
                <PipelineCard key={pipeline.name} {...pipeline} />
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <Card>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {activities.map((activity, index) => (
                    <ActivityItem key={index} {...activity} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}