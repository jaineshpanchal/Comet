"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  RocketLaunchIcon,
  ServerIcon,
  CloudIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

interface Deployment {
  id: string;
  name: string;
  environment: "development" | "staging" | "production";
  status: "pending" | "deploying" | "success" | "failed" | "rolling_back" | "rolled_back";
  version: string;
  branch: string;
  commit: string;
  author: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  url?: string;
  healthStatus: "healthy" | "degraded" | "unhealthy" | "unknown";
  metrics: {
    cpu: number;
    memory: number;
    requests: number;
    errors: number;
  };
}

interface Environment {
  name: string;
  type: "development" | "staging" | "production";
  status: "active" | "inactive" | "maintenance";
  deployments: number;
  lastDeployment?: Date;
  url?: string;
}

export default function DeploymentsPage() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("24h");

  // Mock data
  const deployments: Deployment[] = [
    {
      id: "1",
      name: "Frontend v2.1.4",
      environment: "production",
      status: "success",
      version: "v2.1.4",
      branch: "main",
      commit: "abc123f",
      author: "John Doe",
      startedAt: new Date("2024-01-15T10:30:00"),
      completedAt: new Date("2024-01-15T10:35:00"),
      duration: 300000,
      url: "https://app.comet.com",
      healthStatus: "healthy",
      metrics: {
        cpu: 45,
        memory: 62,
        requests: 1250,
        errors: 2,
      },
    },
    {
      id: "2",
      name: "API Service v1.8.2",
      environment: "staging",
      status: "deploying",
      version: "v1.8.2",
      branch: "feature/auth-improvements",
      commit: "def456g",
      author: "Jane Smith",
      startedAt: new Date("2024-01-15T11:15:00"),
      duration: 180000,
      url: "https://staging-api.comet.com",
      healthStatus: "unknown",
      metrics: {
        cpu: 30,
        memory: 48,
        requests: 450,
        errors: 0,
      },
    },
    {
      id: "3",
      name: "Backend v3.0.1",
      environment: "development",
      status: "failed",
      version: "v3.0.1",
      branch: "develop",
      commit: "ghi789h",
      author: "Mike Johnson",
      startedAt: new Date("2024-01-15T09:45:00"),
      completedAt: new Date("2024-01-15T09:52:00"),
      duration: 420000,
      healthStatus: "unhealthy",
      metrics: {
        cpu: 15,
        memory: 25,
        requests: 0,
        errors: 5,
      },
    },
    {
      id: "4",
      name: "Database Migration v2.3.0",
      environment: "production",
      status: "rolled_back",
      version: "v2.3.0",
      branch: "main",
      commit: "jkl012i",
      author: "Sarah Wilson",
      startedAt: new Date("2024-01-15T08:30:00"),
      completedAt: new Date("2024-01-15T08:45:00"),
      duration: 900000,
      healthStatus: "degraded",
      metrics: {
        cpu: 65,
        memory: 78,
        requests: 800,
        errors: 12,
      },
    },
  ];

  const environments: Environment[] = [
    {
      name: "Production",
      type: "production",
      status: "active",
      deployments: 24,
      lastDeployment: new Date("2024-01-15T10:35:00"),
      url: "https://app.comet.com",
    },
    {
      name: "Staging",
      type: "staging",
      status: "active",
      deployments: 18,
      lastDeployment: new Date("2024-01-15T11:15:00"),
      url: "https://staging.comet.com",
    },
    {
      name: "Development",
      type: "development",
      status: "maintenance",
      deployments: 42,
      lastDeployment: new Date("2024-01-15T09:52:00"),
      url: "https://dev.comet.com",
    },
  ];

  const filteredDeployments = deployments.filter(deployment =>
    selectedEnvironment === "all" || deployment.environment === selectedEnvironment
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case "deploying":
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      case "pending":
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case "rolling_back":
        return <ArrowPathIcon className="w-5 h-5 text-orange-500 animate-spin" />;
      case "rolled_back":
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "success" as const,
      failed: "destructive" as const,
      deploying: "default" as const,
      pending: "warning" as const,
      rolling_back: "warning" as const,
      rolled_back: "secondary" as const,
    };
    return variants[status as keyof typeof variants] || "default";
  };

  const getHealthBadge = (health: string) => {
    const variants = {
      healthy: "success" as const,
      degraded: "warning" as const,
      unhealthy: "destructive" as const,
      unknown: "secondary" as const,
    };
    return variants[health as keyof typeof variants] || "secondary";
  };

  const getEnvironmentIcon = (env: string) => {
    switch (env) {
      case "production":
        return <CloudIcon className="w-4 h-4" />;
      case "staging":
        return <ServerIcon className="w-4 h-4" />;
      case "development":
        return <Cog6ToothIcon className="w-4 h-4" />;
      default:
        return <ServerIcon className="w-4 h-4" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  const calculateSuccessRate = () => {
    const completed = deployments.filter(d => d.status === "success" || d.status === "failed");
    if (completed.length === 0) return 0;
    return Math.round((completed.filter(d => d.status === "success").length / completed.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Deployments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage your application deployments across environments
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <RocketLaunchIcon className="w-4 h-4 mr-2" />
            New Deployment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Deployments</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{deployments.length}</p>
              </div>
              <RocketLaunchIcon className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-3xl font-bold text-green-600">{calculateSuccessRate()}%</p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Environments</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {environments.filter(env => env.status === "active").length}
                </p>
              </div>
              <ServerIcon className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Duration</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatDuration(
                    deployments
                      .filter(d => d.duration)
                      .reduce((sum, d) => sum + (d.duration || 0), 0) /
                    deployments.filter(d => d.duration).length
                  )}
                </p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environment Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Overview</CardTitle>
          <CardDescription>Current status of all deployment environments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {environments.map((env) => (
              <div
                key={env.name}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getEnvironmentIcon(env.type)}
                    <h3 className="font-semibold text-gray-900 dark:text-white">{env.name}</h3>
                  </div>
                  <Badge 
                    variant={env.status === "active" ? "success" : env.status === "maintenance" ? "warning" : "secondary"}
                  >
                    {env.status}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Deployments:</span>
                    <span className="font-medium">{env.deployments}</span>
                  </div>
                  {env.lastDeployment && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Last deploy:</span>
                      <span className="font-medium">
                        {env.lastDeployment.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {env.url && (
                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View App
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter Controls */}
      <div className="flex items-center space-x-4">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {["all", "production", "staging", "development"].map((env) => (
            <button
              key={env}
              onClick={() => setSelectedEnvironment(env)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                selectedEnvironment === env
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {env}
            </button>
          ))}
        </div>

        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {["1h", "24h", "7d", "30d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Deployments List */}
      <div className="space-y-4">
        {filteredDeployments.map((deployment) => (
          <Card key={deployment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {deployment.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {deployment.branch} • {deployment.commit} • by {deployment.author}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusBadge(deployment.status)} className="capitalize">
                        {deployment.status.replace("_", " ")}
                      </Badge>
                      {getStatusIcon(deployment.status)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      {getEnvironmentIcon(deployment.environment)}
                      <span className="capitalize">{deployment.environment}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{deployment.startedAt.toLocaleString()}</span>
                    </div>
                    {deployment.duration && (
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{formatDuration(deployment.duration)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Health Status */}
                <div className="lg:col-span-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Health Status
                      </span>
                      <Badge variant={getHealthBadge(deployment.healthStatus)}>
                        {deployment.healthStatus}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>CPU</span>
                        <span>{deployment.metrics.cpu}%</span>
                      </div>
                      <Progress value={deployment.metrics.cpu} className="h-1" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Memory</span>
                        <span>{deployment.metrics.memory}%</span>
                      </div>
                      <Progress value={deployment.metrics.memory} className="h-1" />
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="lg:col-span-2">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Requests</span>
                        <span className="font-medium">{deployment.metrics.requests.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Errors</span>
                        <span className={`font-medium ${deployment.metrics.errors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {deployment.metrics.errors}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="lg:col-span-2">
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" size="sm">
                      <EyeIcon className="w-4 h-4 mr-1" />
                      View Logs
                    </Button>
                    {deployment.url && (
                      <Button variant="outline" size="sm">
                        <ChartBarIcon className="w-4 h-4 mr-1" />
                        Monitor
                      </Button>
                    )}
                    {deployment.status === "failed" && (
                      <Button variant="outline" size="sm">
                        <ArrowPathIcon className="w-4 h-4 mr-1" />
                        Redeploy
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}