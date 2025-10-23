"use client"

import { useState, useEffect } from "react"
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline"

interface AuditLog {
  id: string
  userId: string | null
  action: string
  resource: string
  resourceId: string | null
  metadata: Record<string, any>
  ipAddress: string | null
  userAgent: string | null
  timestamp: string
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
  }
}

interface Statistics {
  totalLogs: number
  topActions: Array<{ action: string; count: number }>
  topResources: Array<{ resource: string; count: number }>
  topUsers: Array<{ userId: string; count: number }>
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState("")

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [resourceFilter, setResourceFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchAuditLogs()
    fetchStatistics()
  }, [page, actionFilter, resourceFilter])

  const fetchAuditLogs = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("golive_jwt")
      if (!token) {
        setError("Not authenticated")
        return
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })

      if (actionFilter) params.append("action", actionFilter)
      if (resourceFilter) params.append("resource", resourceFilter)

      const response = await fetch(`http://localhost:8000/api/audit-logs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setLogs(data.data.logs)
        setTotalPages(data.data.pagination.pages)
      } else {
        setError(data.error || "Failed to fetch audit logs")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    setStatsLoading(true)

    try {
      const token = localStorage.getItem("golive_jwt")
      if (!token) return

      const response = await fetch("http://localhost:8000/api/audit-logs/statistics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setStatistics(data.data)
      }
    } catch (err) {
      console.error("Failed to fetch statistics:", err)
    } finally {
      setStatsLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  }

  const getActionColor = (action: string) => {
    if (action.includes("delete")) return "text-red-600 bg-red-50"
    if (action.includes("create")) return "text-green-600 bg-green-50"
    if (action.includes("update") || action.includes("edit")) return "text-blue-600 bg-blue-50"
    if (action.includes("login")) return "text-blue-600 bg-purple-50"
    return "text-gray-600 bg-gray-50"
  }

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case "user":
        return <UserIcon className="w-4 h-4" />
      case "authentication":
        return <ComputerDesktopIcon className="w-4 h-4" />
      default:
        return <ChartBarIcon className="w-4 h-4" />
    }
  }

  const exportToCSV = () => {
    const filteredLogs = logs.filter(log =>
      !searchQuery ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const headers = ["Timestamp", "User", "Email", "Action", "Resource", "IP Address"]
    const csvData = filteredLogs.map(log => [
      formatTimestamp(log.timestamp),
      log.user ? `${log.user.firstName} ${log.user.lastName}` : "System",
      log.user?.email || "N/A",
      log.action,
      log.resource,
      log.ipAddress || "N/A"
    ])

    const csv = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const exportToJSON = () => {
    const filteredLogs = logs.filter(log =>
      !searchQuery ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const jsonData = JSON.stringify(filteredLogs, null, 2)
    const blob = new Blob([jsonData], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
              Audit Logs
            </h1>
            <p className="text-sm text-gray-500 font-normal tracking-wide">
              Track all <span className="text-gray-700 font-medium">user actions</span> and <span className="text-gray-700 font-medium">system events</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              disabled={logs.length === 0}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export CSV
            </button>
            <button
              onClick={exportToJSON}
              disabled={logs.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium  disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {!statsLoading && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total Logs</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{statistics.totalLogs.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ArrowPathIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Top Action</span>
            </div>
            <p className="text-xl font-bold text-gray-900 truncate">
              {statistics.topActions[0]?.action || "N/A"}
            </p>
            <p className="text-sm text-gray-500">{statistics.topActions[0]?.count || 0} occurrences</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <ComputerDesktopIcon className="w-5 h-5 text-cyan-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Top Resource</span>
            </div>
            <p className="text-xl font-bold text-gray-900 capitalize">
              {statistics.topResources[0]?.resource || "N/A"}
            </p>
            <p className="text-sm text-gray-500">{statistics.topResources[0]?.count || 0} actions</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <UserIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Active Users</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{statistics.topUsers.length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <FunnelIcon className="w-5 h-5" />
            <span>Filters:</span>
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>

          <select
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            <option value="">All Resources</option>
            <option value="user">User</option>
            <option value="authentication">Authentication</option>
            <option value="project">Project</option>
            <option value="pipeline">Pipeline</option>
            <option value="deployment">Deployment</option>
          </select>

          <button
            onClick={() => {
              setActionFilter("")
              setResourceFilter("")
              setSearchQuery("")
              setPage(1)
              fetchAuditLogs()
            }}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.filter(log =>
                  !searchQuery ||
                  log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  log.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <ClockIcon className="w-4 h-4" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.user ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {log.user.firstName} {log.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        {getResourceIcon(log.resource)}
                        <span className="capitalize">{log.resource}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
