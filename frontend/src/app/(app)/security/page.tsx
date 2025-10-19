"use client"

import { useState, useEffect } from "react"
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline"

interface SecurityStatistics {
  totalScans: number
  totalVulnerabilities: number
  criticalVulnerabilities: number
  highVulnerabilities: number
  moderateVulnerabilities: number
  lowVulnerabilities: number
  recentScans: Array<{
    id: string
    scanType: string
    status: string
    createdAt: string
    summary: {
      total: number
      critical: number
      high: number
      moderate: number
      low: number
    }
  }>
}

export default function SecurityDashboard() {
  const [statistics, setStatistics] = useState<SecurityStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchSecurityStatistics()
  }, [])

  const fetchSecurityStatistics = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("comet_jwt")
      if (!token) {
        setError("Not authenticated")
        return
      }

      const response = await fetch("http://localhost:8000/api/security/statistics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setStatistics(data.data)
      } else {
        setError(data.error || "Failed to fetch security statistics")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200"
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "moderate":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getSecurityScore = () => {
    if (!statistics) return 0

    const { criticalVulnerabilities, highVulnerabilities, moderateVulnerabilities, lowVulnerabilities } = statistics

    // Calculate score (100 - weighted penalty)
    const penalty =
      (criticalVulnerabilities * 10) +
      (highVulnerabilities * 5) +
      (moderateVulnerabilities * 2) +
      (lowVulnerabilities * 0.5)

    return Math.max(0, Math.min(100, 100 - penalty))
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const securityScore = getSecurityScore()

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-6xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent tracking-tight leading-tight pb-1 mb-2">
          Security Dashboard
        </h1>
        <p className="text-lg font-normal text-gray-500 tracking-normal leading-relaxed">
          Monitor <span className="text-gray-700 font-medium">vulnerabilities</span> and <span className="text-gray-700 font-medium">security posture</span> across your projects
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Security Score Card */}
      {statistics && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Score</h2>
              <p className="text-gray-600 mb-4">Overall security health of your projects</p>
              <div className={`text-6xl font-bold ${getScoreColor(securityScore)}`}>
                {securityScore.toFixed(0)}
                <span className="text-2xl">/100</span>
              </div>
            </div>
            <div className="p-6 bg-white rounded-full shadow-lg">
              {securityScore >= 70 ? (
                <ShieldCheckIcon className="w-24 h-24 text-green-600" />
              ) : (
                <ShieldExclamationIcon className="w-24 h-24 text-orange-600" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vulnerability Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border-2 border-red-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Critical</span>
            </div>
            <p className="text-4xl font-bold text-red-600">{statistics.criticalVulnerabilities}</p>
            <p className="text-sm text-gray-500 mt-1">Immediate action required</p>
          </div>

          <div className="bg-white rounded-lg border-2 border-orange-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">High</span>
            </div>
            <p className="text-4xl font-bold text-orange-600">{statistics.highVulnerabilities}</p>
            <p className="text-sm text-gray-500 mt-1">High priority fixes</p>
          </div>

          <div className="bg-white rounded-lg border-2 border-yellow-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Moderate</span>
            </div>
            <p className="text-4xl font-bold text-yellow-600">{statistics.moderateVulnerabilities}</p>
            <p className="text-sm text-gray-500 mt-1">Should be addressed</p>
          </div>

          <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Low</span>
            </div>
            <p className="text-4xl font-bold text-blue-600">{statistics.lowVulnerabilities}</p>
            <p className="text-sm text-gray-500 mt-1">Minor issues</p>
          </div>
        </div>
      )}

      {/* Recent Scans */}
      {statistics && statistics.recentScans.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Security Scans</h2>
            <p className="text-sm text-gray-500 mt-1">Latest vulnerability scans across all projects</p>
          </div>

          <div className="divide-y divide-gray-200">
            {statistics.recentScans.map((scan) => (
              <div key={scan.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                        {scan.scanType}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <ClockIcon className="w-4 h-4" />
                        {formatDate(scan.createdAt)}
                      </div>
                      {scan.status === "COMPLETED" ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : scan.status === "FAILED" ? (
                        <XCircleIcon className="w-5 h-5 text-red-600" />
                      ) : (
                        <ClockIcon className="w-5 h-5 text-yellow-600 animate-spin" />
                      )}
                    </div>

                    {scan.summary && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-red-600 font-medium">
                          {scan.summary.critical} Critical
                        </span>
                        <span className="text-orange-600 font-medium">
                          {scan.summary.high} High
                        </span>
                        <span className="text-yellow-600 font-medium">
                          {scan.summary.moderate} Moderate
                        </span>
                        <span className="text-blue-600 font-medium">
                          {scan.summary.low} Low
                        </span>
                      </div>
                    )}
                  </div>

                  <button className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium text-sm">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShieldCheckIcon className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total Scans</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{statistics.totalScans}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total Vulnerabilities</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{statistics.totalVulnerabilities}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Security Status</span>
            </div>
            <p className={`text-2xl font-bold ${getScoreColor(securityScore)}`}>
              {securityScore >= 80 ? "Excellent" : securityScore >= 60 ? "Good" : securityScore >= 40 ? "Fair" : "Critical"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
