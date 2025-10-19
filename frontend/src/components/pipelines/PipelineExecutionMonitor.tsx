"use client";

import React, { useState, useEffect } from "react";
import {
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useWebSocket } from "@/hooks/useWebSocket";

interface PipelineStage {
  id: string;
  name: string;
  type: string;
  status: string;
  order: number;
  startedAt?: string | null;
  completedAt?: string | null;
  duration?: number | null;
  logs?: string[];
}

interface PipelineRun {
  id: string;
  pipelineId: string;
  status: string;
  startedAt: string;
  completedAt?: string | null;
  duration?: number | null;
  stageRuns?: Array<{
    id: string;
    stageId: string;
    status: string;
    stage: PipelineStage;
    startedAt?: string | null;
    completedAt?: string | null;
    duration?: number | null;
  }>;
}

interface PipelineExecutionMonitorProps {
  pipelineId: string;
  runId?: string;
}

export default function PipelineExecutionMonitor({
  pipelineId,
  runId,
}: PipelineExecutionMonitorProps) {
  const [currentRun, setCurrentRun] = useState<PipelineRun | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

  const { status: wsStatus } = useWebSocket({
    url: `${WS_URL}/ws/pipeline/${pipelineId}`,
    enabled: true,
    onMessage: (message) => {
      if (message.type === "pipeline_started" || message.type === "pipeline_completed" || message.type === "pipeline_failed") {
        setCurrentRun(message.data);
      } else if (message.type === "stage_started" || message.type === "stage_completed" || message.type === "stage_failed") {
        // Update individual stage status
        const stageUpdate = message.data;
        setStages((prev) =>
          prev.map((stage) =>
            stage.id === stageUpdate.stageId ? { ...stage, ...stageUpdate } : stage
          )
        );
      }
    },
  });

  useEffect(() => {
    fetchPipelineRun();
  }, [pipelineId, runId]);

  const fetchPipelineRun = async () => {
    try {
      const token = localStorage.getItem("comet_jwt");

      // Fetch pipeline stages
      const stagesResponse = await fetch(
        `http://localhost:8000/api/pipelines/${pipelineId}/stages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const stagesData = await stagesResponse.json();
      if (stagesData.success) {
        setStages(stagesData.data);
      }

      // Fetch current/latest run if runId provided
      if (runId) {
        const runResponse = await fetch(
          `http://localhost:8000/api/pipelines/${pipelineId}/runs/${runId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const runData = await runResponse.json();
        if (runData.success) {
          setCurrentRun(runData.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch pipeline run:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStageStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case "FAILED":
        return <XCircleIcon className="w-6 h-6 text-red-600" />;
      case "RUNNING":
        return <ArrowPathIcon className="w-6 h-6 text-blue-600 animate-spin" />;
      case "PENDING":
        return <ClockIcon className="w-6 h-6 text-gray-400" />;
      default:
        return <ClockIcon className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStageStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 border-green-300";
      case "FAILED":
        return "bg-red-100 border-red-300";
      case "RUNNING":
        return "bg-blue-100 border-blue-300 animate-pulse";
      case "PENDING":
        return "bg-gray-100 border-gray-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const formatDuration = (ms: number | null | undefined) => {
    if (!ms) return "0s";
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse h-20 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* WebSocket Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Pipeline Execution</h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              wsStatus === "connected" ? "bg-green-500 animate-pulse" : "bg-gray-400"
            }`}
          ></div>
          <span className="text-sm text-gray-600">
            {wsStatus === "connected" ? "Live Monitoring" : "Reconnecting..."}
          </span>
        </div>
      </div>

      {/* Pipeline Run Status */}
      {currentRun && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Run #{currentRun.id.slice(0, 8)}</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                currentRun.status === "SUCCESS"
                  ? "bg-green-100 text-green-800"
                  : currentRun.status === "FAILED"
                  ? "bg-red-100 text-red-800"
                  : currentRun.status === "RUNNING"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {currentRun.status}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            {currentRun.duration && (
              <>Duration: {formatDuration(currentRun.duration)}</>
            )}
          </div>
        </div>
      )}

      {/* Stages */}
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const isCompleted = ["SUCCESS", "FAILED"].includes(stage.status);
          const isRunning = stage.status === "RUNNING";

          return (
            <div key={stage.id} className="relative">
              {/* Connection Line */}
              {index < stages.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-300"></div>
              )}

              <div
                className={`p-4 border-2 rounded-lg transition-all ${getStageStatusColor(
                  stage.status
                )}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">{getStageStatusIcon(stage.status)}</div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">{stage.name}</h4>
                      {stage.duration && (
                        <span className="text-sm text-gray-600">
                          {formatDuration(stage.duration)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {stage.type} • Order {stage.order + 1}
                    </p>

                    {/* Progress Bar for Running Stage */}
                    {isRunning && (
                      <div className="mt-3">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 animate-pulse w-3/4"></div>
                        </div>
                      </div>
                    )}

                    {/* Logs Preview */}
                    {stage.logs && stage.logs.length > 0 && (
                      <div className="mt-3 bg-gray-900 text-green-400 p-3 rounded text-xs font-mono max-h-32 overflow-auto">
                        {stage.logs.slice(-5).map((log, i) => (
                          <div key={i}>{log}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {stages.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <PlayIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No stages configured</p>
        </div>
      )}
    </div>
  );
}
