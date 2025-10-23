"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  ChartBarIcon,
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CalendarIcon,
  FunnelIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface ReportMetric {
  id: string
  category: string
  name: string
  value: string | number
  description: string
}

interface CustomReport {
  id: string
  name: string
  description: string
  metrics: ReportMetric[]
  createdAt: string
  lastRun: string
}

const availableMetrics: ReportMetric[] = [
  // Pipeline Metrics
  { id: "pipeline-total", category: "Pipelines", name: "Total Pipeline Runs", value: 245, description: "Total number of pipeline executions" },
  { id: "pipeline-success-rate", category: "Pipelines", name: "Pipeline Success Rate", value: "80.8%", description: "Percentage of successful pipeline runs" },
  { id: "pipeline-avg-duration", category: "Pipelines", name: "Average Pipeline Duration", value: "5m 24s", description: "Average time per pipeline execution" },
  { id: "pipeline-failures", category: "Pipelines", name: "Failed Pipelines", value: 32, description: "Number of failed pipeline runs" },

  // Test Metrics
  { id: "test-total", category: "Tests", name: "Total Tests", value: 1847, description: "Total number of tests executed" },
  { id: "test-pass-rate", category: "Tests", name: "Test Pass Rate", value: "92.2%", description: "Percentage of passing tests" },
  { id: "test-coverage", category: "Tests", name: "Code Coverage", value: "78.5%", description: "Overall code coverage percentage" },
  { id: "test-flaky", category: "Tests", name: "Flaky Tests", value: 23, description: "Number of unstable tests" },

  // Deployment Metrics
  { id: "deploy-total", category: "Deployments", name: "Total Deployments", value: 156, description: "Total number of deployments" },
  { id: "deploy-success-rate", category: "Deployments", name: "Deployment Success Rate", value: "91.0%", description: "Percentage of successful deployments" },
  { id: "deploy-rollbacks", category: "Deployments", name: "Rollbacks", value: 4, description: "Number of deployment rollbacks" },
  { id: "deploy-avg-duration", category: "Deployments", name: "Average Deploy Time", value: "3m 7s", description: "Average deployment duration" },

  // Overall Metrics
  { id: "overall-projects", category: "Overall", name: "Active Projects", value: 12, description: "Number of active projects" },
  { id: "overall-commits", category: "Overall", name: "Total Commits", value: 1523, description: "Total number of commits" },
  { id: "overall-prs", category: "Overall", name: "Pull Requests", value: 234, description: "Total pull requests" },
  { id: "overall-lead-time", category: "Overall", name: "Avg Lead Time", value: "2.4h", description: "Average development lead time" },
]

export default function CustomReportsPage() {
  const [selectedMetrics, setSelectedMetrics] = useState<ReportMetric[]>([])
  const [reportName, setReportName] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [savedReports, setSavedReports] = useState<CustomReport[]>([
    {
      id: "1",
      name: "Weekly Performance Report",
      description: "Pipeline and test performance metrics",
      metrics: availableMetrics.slice(0, 4),
      createdAt: "2024-01-15",
      lastRun: "2024-01-20"
    },
    {
      id: "2",
      name: "Quality Metrics Dashboard",
      description: "Test coverage and code quality indicators",
      metrics: availableMetrics.slice(4, 8),
      createdAt: "2024-01-10",
      lastRun: "2024-01-19"
    }
  ])

  const categories = ["all", ...Array.from(new Set(availableMetrics.map(m => m.category)))]

  const filteredMetrics = filterCategory === "all"
    ? availableMetrics
    : availableMetrics.filter(m => m.category === filterCategory)

  const addMetric = (metric: ReportMetric) => {
    if (!selectedMetrics.find(m => m.id === metric.id)) {
      setSelectedMetrics([...selectedMetrics, metric])
    }
  }

  const removeMetric = (metricId: string) => {
    setSelectedMetrics(selectedMetrics.filter(m => m.id !== metricId))
  }

  const saveReport = () => {
    if (!reportName.trim()) {
      alert("Please provide a report name")
      return
    }
    if (selectedMetrics.length === 0) {
      alert("Please add at least one metric to the report")
      return
    }

    const newReport: CustomReport = {
      id: Date.now().toString(),
      name: reportName,
      description: reportDescription,
      metrics: selectedMetrics,
      createdAt: new Date().toISOString().split('T')[0],
      lastRun: new Date().toISOString().split('T')[0]
    }

    setSavedReports([newReport, ...savedReports])
    setReportName("")
    setReportDescription("")
    setSelectedMetrics([])
    alert("Report saved successfully!")
  }

  const deleteReport = (reportId: string) => {
    if (confirm("Are you sure you want to delete this report?")) {
      setSavedReports(savedReports.filter(r => r.id !== reportId))
    }
  }

  const exportReport = (report: CustomReport, format: 'csv' | 'pdf' | 'json') => {
    alert(`Exporting "${report.name}" as ${format.toUpperCase()}...`)
    // In production, this would generate and download the file
  }

  const runReport = (report: CustomReport) => {
    alert(`Running report: ${report.name}`)
    // In production, this would fetch fresh data and display results
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <Link
          href="/analytics/overview"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Analytics Overview
        </Link>
        <div>
          <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
            Custom Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Build custom analytics reports with selected metrics
          </p>
        </div>
      </div>

      {/* Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Build New Report</CardTitle>
          <CardDescription>Select metrics and create custom analytics reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Report Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Name *
                </label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g., Weekly Team Performance"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Brief description of this report"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Selected Metrics */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Selected Metrics ({selectedMetrics.length})
                </label>
                {selectedMetrics.length > 0 && (
                  <button
                    onClick={() => setSelectedMetrics([])}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {selectedMetrics.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Squares2X2Icon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No metrics selected. Add metrics from the list below.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedMetrics.map((metric) => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{metric.name}</div>
                        <div className="text-sm text-gray-600">{metric.category}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-orange-600">{metric.value}</div>
                        <button
                          onClick={() => removeMetric(metric.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={saveReport}
                className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <DocumentTextIcon className="h-5 w-5" />
                Save Report
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Metrics</CardTitle>
              <CardDescription>Click to add metrics to your report</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMetrics.map((metric) => {
              const isSelected = selectedMetrics.some(m => m.id === metric.id)
              return (
                <button
                  key={metric.id}
                  onClick={() => !isSelected && addMetric(metric)}
                  disabled={isSelected}
                  className={`text-left p-4 border rounded-lg transition-all ${
                    isSelected
                      ? 'border-orange-300 bg-orange-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-orange-500 hover:bg-orange-50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">{metric.category}</span>
                    {!isSelected && <PlusIcon className="h-5 w-5 text-orange-600" />}
                  </div>
                  <div className="font-medium text-gray-900 mb-1">{metric.name}</div>
                  <div className="text-2xl font-bold text-orange-600 mb-2">{metric.value}</div>
                  <div className="text-xs text-gray-600">{metric.description}</div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Saved Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Reports</CardTitle>
          <CardDescription>Your custom analytics reports</CardDescription>
        </CardHeader>
        <CardContent>
          {savedReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p>No saved reports yet. Create your first report above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedReports.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          Created: {report.createdAt}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          Last Run: {report.lastRun}
                        </span>
                        <span>{report.metrics.length} metrics</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => runReport(report)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                      >
                        Run Report
                      </button>
                      <button
                        onClick={() => deleteReport(report.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Report Metrics Preview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {report.metrics.slice(0, 4).map((metric) => (
                      <div key={metric.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">{metric.name}</div>
                        <div className="text-lg font-bold text-gray-900">{metric.value}</div>
                      </div>
                    ))}
                    {report.metrics.length > 4 && (
                      <div className="p-3 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm text-gray-600">+{report.metrics.length - 4} more</span>
                      </div>
                    )}
                  </div>

                  {/* Export Options */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => exportReport(report, 'csv')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      CSV
                    </button>
                    <button
                      onClick={() => exportReport(report, 'pdf')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      PDF
                    </button>
                    <button
                      onClick={() => exportReport(report, 'json')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      JSON
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
