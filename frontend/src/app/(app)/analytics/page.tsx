"use client";

import React, { useState, useEffect } from "react";
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsData {
  totalPipelines: number;
  totalRuns: number;
  successRate: number;
  avgDuration: number;
  failureRate: number;
  trendsuccess: number;
  trendDuration: number;
  runsByDay: Array<{ date: string; runs: number; success: number; failed: number }>;
  topPipelines: Array<{ name: string; runs: number; successRate: number }>;
  stagePerformance: Array<{ name: string; avgDuration: number; failureRate: number }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("comet_jwt");
      const response = await fetch(
        `http://localhost:8000/api/analytics?timeRange=${timeRange}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const timeRanges = [
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-6xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent tracking-tight leading-none mb-4">
              Analytics & Reports
            </h1>
            <p className="text-lg text-gray-600">
              Insights into your <span className="font-semibold text-gray-900">CI/CD performance</span>
            </p>
          </div>
          <ChartBarIcon className="w-16 h-16 text-blue-500 opacity-20" />
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-3">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === range.value
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics?.totalRuns || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Pipeline executions</p>
                </div>
                <ChartBarIcon className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    {analytics?.successRate?.toFixed(1) || 0}%
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {analytics && analytics.trendSuccess > 0 ? (
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm text-gray-500">
                      {Math.abs(analytics?.trendSuccess || 0)}% vs previous period
                    </span>
                  </div>
                </div>
                <CheckCircleIcon className="w-10 h-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    {analytics?.avgDuration ? formatDuration(analytics.avgDuration) : "0s"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {analytics && analytics.trendDuration < 0 ? (
                      <ArrowTrendingDownIcon className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowTrendingUpIcon className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm text-gray-500">
                      {Math.abs(analytics?.trendDuration || 0)}% vs previous period
                    </span>
                  </div>
                </div>
                <ClockIcon className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Failure Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-red-600">
                    {analytics?.failureRate?.toFixed(1) || 0}%
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Failed executions</p>
                </div>
                <XCircleIcon className="w-10 h-10 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Runs Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Runs Over Time</CardTitle>
              <CardDescription>Daily pipeline execution trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {analytics?.runsByDay?.map((day, index) => {
                  const maxRuns = Math.max(...(analytics.runsByDay?.map((d) => d.runs) || [1]));
                  const height = (day.runs / maxRuns) * 100;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-t relative" style={{ height: "100%" }}>
                        <div
                          className="w-full bg-gradient-to-t from-blue-600 to-purple-600 rounded-t absolute bottom-0 transition-all"
                          style={{ height: `${height}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 rotate-45 origin-left whitespace-nowrap">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Pipelines */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Pipelines</CardTitle>
              <CardDescription>Pipelines with most executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topPipelines?.slice(0, 5).map((pipeline, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-700">{pipeline.name}</span>
                        <span className="text-xs text-gray-500">{pipeline.runs} runs</span>
                      </div>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                          style={{ width: `${pipeline.successRate}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="ml-4 text-sm font-semibold text-green-600">
                      {pipeline.successRate.toFixed(0)}%
                    </span>
                  </div>
                ))}
                {(!analytics?.topPipelines || analytics.topPipelines.length === 0) && (
                  <p className="text-center text-gray-500 py-8">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stage Performance */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Stage Performance Analysis</CardTitle>
              <CardDescription>Average duration and failure rate by stage type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Stage
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Avg Duration
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Failure Rate
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.stagePerformance?.map((stage, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {stage.name}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDuration(stage.avgDuration)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {stage.failureRate.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              stage.failureRate < 10
                                ? "bg-green-100 text-green-800"
                                : stage.failureRate < 25
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {stage.failureRate < 10
                              ? "Excellent"
                              : stage.failureRate < 25
                              ? "Good"
                              : "Needs Attention"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!analytics?.stagePerformance || analytics.stagePerformance.length === 0) && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500">
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
