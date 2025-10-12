"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

interface Pipeline {
  id: string;
  name: string;
  status: "running" | "success" | "failed" | "pending" | "cancelled";
  branch: string;
  commit: string;
  author: string;
  duration?: string;
  progress?: number;
  startedAt: string;
  steps: PipelineStep[];
}

interface PipelineStep {
  id: string;
  name: string;
  status: "completed" | "running" | "pending" | "failed";
  duration?: string;
  logs?: string[];
}

function PipelineStepIndicator({ step }: { step: PipelineStep }) {
  const stepConfig = {
    completed: { icon: CheckCircleIcon, color: "text-green-600" },
    running: { icon: PlayIcon, color: "text-blue-600 animate-pulse" },
    pending: { icon: ClockIcon, color: "text-gray-400" },
    failed: { icon: XCircleIcon, color: "text-red-600" },
  };

  const config = stepConfig[step.status];

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      <div className={`${config.color}`}>
        <config.icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{step.name}</p>
        {step.duration && (
          <p className="text-sm text-muted-foreground">Duration: {step.duration}</p>
        )}
      </div>
      <Badge variant={step.status as any}>{step.status}</Badge>
    </div>
  );
}

function PipelineCard({ pipeline }: { pipeline: Pipeline }) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    running: { badge: "running", color: "bg-blue-500" },
    success: { badge: "success", color: "bg-green-500" },
    failed: { badge: "failed", color: "bg-red-500" },
    pending: { badge: "pending", color: "bg-yellow-500" },
    cancelled: { badge: "cancelled", color: "bg-gray-500" },
  };

  const config = statusConfig[pipeline.status];

  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{pipeline.name}</CardTitle>
            <CardDescription>
              {pipeline.branch} • {pipeline.commit.slice(0, 8)} • by {pipeline.author}
            </CardDescription>
          </div>
          <Badge variant={pipeline.status as any}>{config.badge}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pipeline.status === "running" && pipeline.progress !== undefined && (
            <Progress value={pipeline.progress} animated showPercentage />
          )}
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Started: {pipeline.startedAt}</span>
            {pipeline.duration && <span>Duration: {pipeline.duration}</span>}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
              <EyeIcon className="h-4 w-4 mr-2" />
              {expanded ? "Hide" : "View"} Steps
            </Button>
            <Button variant="outline" size="sm">
              View Logs
            </Button>
            {pipeline.status === "running" && (
              <>
                <Button variant="outline" size="sm">
                  <PauseIcon className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button variant="destructive" size="sm">
                  <StopIcon className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </>
            )}
            {(pipeline.status === "failed" || pipeline.status === "cancelled") && (
              <Button variant="outline" size="sm">
                <PlayIcon className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>

          {expanded && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="font-medium">Pipeline Steps</h4>
              {pipeline.steps.map((step) => (
                <PipelineStepIndicator key={step.id} step={step} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PipelinesPage() {
  const [filter, setFilter] = useState<"all" | "running" | "success" | "failed">("all");

  const pipelines: Pipeline[] = [
    {
      id: "1",
      name: "Frontend Build Pipeline",
      status: "running",
      branch: "main",
      commit: "a1b2c3d4e5f6",
      author: "John Doe",
      progress: 65,
      startedAt: "2 minutes ago",
      steps: [
        { id: "1", name: "Checkout Code", status: "completed", duration: "15s" },
        { id: "2", name: "Install Dependencies", status: "completed", duration: "1m 30s" },
        { id: "3", name: "Run Tests", status: "running" },
        { id: "4", name: "Build Application", status: "pending" },
        { id: "5", name: "Deploy to Staging", status: "pending" },
      ],
    },
    {
      id: "2",
      name: "Backend API Tests",
      status: "success",
      branch: "develop",
      commit: "f6e5d4c3b2a1",
      author: "Jane Smith",
      duration: "3m 45s",
      startedAt: "5 minutes ago",
      steps: [
        { id: "1", name: "Checkout Code", status: "completed", duration: "12s" },
        { id: "2", name: "Setup Environment", status: "completed", duration: "45s" },
        { id: "3", name: "Run Unit Tests", status: "completed", duration: "1m 30s" },
        { id: "4", name: "Run Integration Tests", status: "completed", duration: "1m 18s" },
      ],
    },
    {
      id: "3",
      name: "E2E Testing Suite",
      status: "failed",
      branch: "feature/auth",
      commit: "9876543210ab",
      author: "Bob Wilson",
      duration: "8m 12s",
      startedAt: "15 minutes ago",
      steps: [
        { id: "1", name: "Checkout Code", status: "completed", duration: "18s" },
        { id: "2", name: "Setup Test Environment", status: "completed", duration: "2m 30s" },
        { id: "3", name: "Run E2E Tests", status: "failed", duration: "5m 24s" },
      ],
    },
    {
      id: "4",
      name: "Mobile App Deploy",
      status: "pending",
      branch: "release/v2.1",
      commit: "fedcba098765",
      author: "Alice Johnson",
      startedAt: "1 hour ago",
      steps: [
        { id: "1", name: "Checkout Code", status: "pending" },
        { id: "2", name: "Build iOS App", status: "pending" },
        { id: "3", name: "Build Android App", status: "pending" },
        { id: "4", name: "Deploy to App Stores", status: "pending" },
      ],
    },
    {
      id: "5",
      name: "Security Scan",
      status: "success",
      branch: "main",
      commit: "1a2b3c4d5e6f",
      author: "Security Bot",
      duration: "2m 18s",
      startedAt: "30 minutes ago",
      steps: [
        { id: "1", name: "Dependency Scan", status: "completed", duration: "45s" },
        { id: "2", name: "Code Analysis", status: "completed", duration: "1m 33s" },
      ],
    },
  ];

  const filteredPipelines = pipelines.filter(
    (pipeline) => filter === "all" || pipeline.status === filter
  );

  const statusCounts = {
    all: pipelines.length,
    running: pipelines.filter((p) => p.status === "running").length,
    success: pipelines.filter((p) => p.status === "success").length,
    failed: pipelines.filter((p) => p.status === "failed").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipelines</h1>
          <p className="text-muted-foreground">
            Manage and monitor your CI/CD pipelines
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Pipeline
          </Button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            onClick={() => setFilter(status as any)}
            className="capitalize"
          >
            {status} ({count})
          </Button>
        ))}
      </div>

      {/* Pipelines Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {filteredPipelines.map((pipeline) => (
          <PipelineCard key={pipeline.id} pipeline={pipeline} />
        ))}
      </div>

      {filteredPipelines.length === 0 && (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No pipelines found</h3>
          <p className="text-muted-foreground mb-4">
            No pipelines match the current filter criteria.
          </p>
          <Button onClick={() => setFilter("all")}>Show All Pipelines</Button>
        </div>
      )}
    </div>
  );
}