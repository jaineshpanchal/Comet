"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  RocketLaunchIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Project {
  id: string;
  name: string;
}

interface PipelineStage {
  name: string;
  type: string;
  order: number;
  config: Record<string, any>;
}

interface PipelineFormData {
  name: string;
  description: string;
  projectId: string;
  trigger: string;
  stages: PipelineStage[];
}

const stageTypes = [
  { value: "BUILD", label: "Build", icon: Cog6ToothIcon, color: "blue" },
  { value: "TEST", label: "Test", icon: ShieldCheckIcon, color: "green" },
  { value: "SECURITY_SCAN", label: "Security Scan", icon: ShieldCheckIcon, color: "purple" },
  { value: "DEPLOY", label: "Deploy", icon: CloudArrowUpIcon, color: "indigo" },
  { value: "ROLLBACK", label: "Rollback", icon: ArrowPathIcon, color: "red" },
];

const triggerTypes = [
  { value: "MANUAL", label: "Manual", description: "Trigger pipeline manually" },
  { value: "GIT_PUSH", label: "Git Push", description: "Trigger on git push" },
  { value: "GIT_PR", label: "Pull Request", description: "Trigger on pull request" },
  { value: "SCHEDULE", label: "Scheduled", description: "Trigger on schedule (cron)" },
  { value: "WEBHOOK", label: "Webhook", description: "Trigger via webhook" },
];

export default function CreatePipelinePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<PipelineFormData>({
    name: "",
    description: "",
    projectId: "",
    trigger: "MANUAL",
    stages: [],
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("golive_jwt");
      const response = await fetch("http://localhost:8000/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  const addStage = () => {
    setFormData((prev) => ({
      ...prev,
      stages: [
        ...prev.stages,
        {
          name: `Stage ${prev.stages.length + 1}`,
          type: "BUILD",
          order: prev.stages.length,
          config: {},
        },
      ],
    }));
  };

  const removeStage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== index).map((stage, i) => ({ ...stage, order: i })),
    }));
  };

  const updateStage = (index: number, field: keyof PipelineStage, value: any) => {
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, i) => (i === index ? { ...stage, [field]: value } : stage)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("golive_jwt");
      const response = await fetch("http://localhost:8000/api/pipelines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/pipelines/${data.data.id}`);
      } else {
        setError(data.error || "Failed to create pipeline");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const getStageIcon = (type: string) => {
    const stage = stageTypes.find((s) => s.value === type);
    return stage ? stage.icon : Cog6ToothIcon;
  };

  const getStageColor = (type: string) => {
    const stage = stageTypes.find((s) => s.value === type);
    return stage ? stage.color : "gray";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/pipelines")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Pipelines
            </button>
            <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
              Create Pipeline
            </h1>
            <p className="text-sm text-gray-500 font-normal tracking-wide">Define your CI/CD pipeline configuration</p>
          </div>
          <RocketLaunchIcon className="w-16 h-16 text-blue-500 opacity-20" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Pipeline name, description, and project assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pipeline Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Production Deployment Pipeline"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what this pipeline does..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project *</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Trigger Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Trigger Configuration</CardTitle>
              <CardDescription>How should this pipeline be triggered?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {triggerTypes.map((trigger) => (
                  <button
                    key={trigger.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, trigger: trigger.value })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      formData.trigger === trigger.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{trigger.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{trigger.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Stages */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pipeline Stages</CardTitle>
                <CardDescription>Define the stages of your pipeline</CardDescription>
              </div>
              <Button type="button" onClick={addStage} className="flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                Add Stage
              </Button>
            </CardHeader>
            <CardContent>
              {formData.stages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Cog6ToothIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No stages added yet</p>
                  <p className="text-sm mt-1">Click "Add Stage" to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.stages.map((stage, index) => {
                    const StageIcon = getStageIcon(stage.type);
                    const stageColor = getStageColor(stage.type);

                    return (
                      <div
                        key={index}
                        className="p-4 border-2 border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg bg-${stageColor}-100`}>
                            <StageIcon className={`w-6 h-6 text-${stageColor}-600`} />
                          </div>

                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                  Stage Name
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={stage.name}
                                  onChange={(e) => updateStage(index, "name", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="Stage name"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                  Stage Type
                                </label>
                                <select
                                  value={stage.type}
                                  onChange={(e) => updateStage(index, "type", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                >
                                  {stageTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="font-semibold">Order:</span>
                              <span>{index + 1}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeStage(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/pipelines")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || formData.stages.length === 0}
              className="bg-gradient-to-r from-blue-600 to-blue-500 "
            >
              {loading ? "Creating..." : "Create Pipeline"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
