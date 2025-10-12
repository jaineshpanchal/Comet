"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BeakerIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface TestSuite {
  id: string;
  name: string;
  type: "unit" | "integration" | "e2e" | "performance" | "security";
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage?: number;
  lastRun?: Date;
}

interface TestCase {
  id: string;
  name: string;
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  duration: number;
  errorMessage?: string;
}

export default function TestingPage() {
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unit" | "integration" | "e2e" | "performance" | "security">("all");

  // Mock data
  const testSuites: TestSuite[] = [
    {
      id: "1",
      name: "User Authentication Tests",
      type: "unit",
      status: "passed",
      totalTests: 24,
      passedTests: 22,
      failedTests: 2,
      skippedTests: 0,
      duration: 4200,
      coverage: 92,
      lastRun: new Date("2024-01-15T10:30:00"),
    },
    {
      id: "2",
      name: "API Integration Tests",
      type: "integration",
      status: "running",
      totalTests: 18,
      passedTests: 12,
      failedTests: 1,
      skippedTests: 5,
      duration: 8900,
      coverage: 85,
      lastRun: new Date("2024-01-15T11:15:00"),
    },
    {
      id: "3",
      name: "End-to-End User Flow",
      type: "e2e",
      status: "failed",
      totalTests: 12,
      passedTests: 8,
      failedTests: 4,
      skippedTests: 0,
      duration: 12400,
      coverage: 78,
      lastRun: new Date("2024-01-15T09:45:00"),
    },
    {
      id: "4",
      name: "Performance Benchmarks",
      type: "performance",
      status: "pending",
      totalTests: 6,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 6,
      duration: 0,
      lastRun: new Date("2024-01-14T16:20:00"),
    },
    {
      id: "5",
      name: "Security Vulnerability Scan",
      type: "security",
      status: "passed",
      totalTests: 8,
      passedTests: 8,
      failedTests: 0,
      skippedTests: 0,
      duration: 3200,
      coverage: 95,
      lastRun: new Date("2024-01-15T08:30:00"),
    },
  ];

  const testCases: TestCase[] = [
    {
      id: "1",
      name: "should login with valid credentials",
      status: "passed",
      duration: 120,
    },
    {
      id: "2",
      name: "should reject invalid password",
      status: "passed",
      duration: 85,
    },
    {
      id: "3",
      name: "should handle password reset flow",
      status: "failed",
      duration: 200,
      errorMessage: "Expected redirect to /reset-password but got /login",
    },
    {
      id: "4",
      name: "should validate email format",
      status: "passed",
      duration: 65,
    },
  ];

  const filteredSuites = testSuites.filter(suite => 
    filter === "all" || suite.type === filter
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case "running":
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      case "pending":
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case "skipped":
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: "success" as const,
      failed: "destructive" as const,
      running: "default" as const,
      pending: "warning" as const,
      skipped: "secondary" as const,
    };
    return variants[status as keyof typeof variants] || "default";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "unit":
        return <BeakerIcon className="w-4 h-4" />;
      case "integration":
        return <ChartBarIcon className="w-4 h-4" />;
      case "e2e":
        return <DocumentTextIcon className="w-4 h-4" />;
      case "performance":
        return <ClockIcon className="w-4 h-4" />;
      case "security":
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return <BeakerIcon className="w-4 h-4" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const calculateSuccessRate = (suite: TestSuite) => {
    if (suite.totalTests === 0) return 0;
    return Math.round((suite.passedTests / suite.totalTests) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Testing Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage your test suites and coverage
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <PlayIcon className="w-4 h-4 mr-2" />
            Run All Tests
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tests</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {testSuites.reduce((sum, suite) => sum + suite.totalTests, 0)}
                </p>
              </div>
              <BeakerIcon className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {Math.round(
                    (testSuites.reduce((sum, suite) => sum + suite.passedTests, 0) /
                     testSuites.reduce((sum, suite) => sum + suite.totalTests, 0)) * 100
                  )}%
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
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
                    testSuites.reduce((sum, suite) => sum + suite.duration, 0) / testSuites.length
                  )}
                </p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Coverage</p>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.round(
                    testSuites.reduce((sum, suite) => sum + (suite.coverage || 0), 0) / 
                    testSuites.filter(suite => suite.coverage).length
                  )}%
                </p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {["all", "unit", "integration", "e2e", "performance", "security"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              filter === type
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Test Suites Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSuites.map((suite) => (
          <Card 
            key={suite.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedSuite === suite.id ? "ring-2 ring-blue-500 dark:ring-blue-400" : ""
            }`}
            onClick={() => setSelectedSuite(selectedSuite === suite.id ? null : suite.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(suite.type)}
                  <div>
                    <CardTitle className="text-lg">{suite.name}</CardTitle>
                    <CardDescription className="capitalize">{suite.type} tests</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusBadge(suite.status)} className="capitalize">
                    {suite.status}
                  </Badge>
                  {getStatusIcon(suite.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Test Results */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{suite.passedTests}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Passed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{suite.failedTests}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Failed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-600">{suite.skippedTests}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Skipped</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span>{calculateSuccessRate(suite)}%</span>
                  </div>
                  <Progress value={calculateSuccessRate(suite)} className="h-2" />
                </div>

                {/* Coverage and Duration */}
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="w-4 h-4" />
                    <span>{formatDuration(suite.duration)}</span>
                  </div>
                  {suite.coverage && (
                    <div className="flex items-center space-x-1">
                      <ChartBarIcon className="w-4 h-4" />
                      <span>{suite.coverage}% coverage</span>
                    </div>
                  )}
                </div>

                {/* Last Run */}
                {suite.lastRun && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last run: {suite.lastRun.toLocaleString()}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <PlayIcon className="w-4 h-4 mr-1" />
                    Run
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <DocumentTextIcon className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Case Details (shown when suite is selected) */}
      {selectedSuite && (
        <Card>
          <CardHeader>
            <CardTitle>Test Cases</CardTitle>
            <CardDescription>
              Individual test cases for {testSuites.find(s => s.id === selectedSuite)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testCases.map((testCase) => (
                <div
                  key={testCase.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(testCase.status)}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {testCase.name}
                      </p>
                      {testCase.errorMessage && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          {testCase.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDuration(testCase.duration)}
                    </span>
                    <Badge variant={getStatusBadge(testCase.status)}>
                      {testCase.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}