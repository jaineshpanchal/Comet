"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface Vulnerability {
  id: string
  title: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
  type: string
  package?: string
  version?: string
  fixedIn?: string
  description: string
  cwe?: string
  cvss?: number
  foundAt: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'IGNORED'
  project: string
  file?: string
  line?: number
}

interface SeverityStats {
  critical: number
  high: number
  medium: number
  low: number
  info: number
  total: number
}

export default function SecurityDashboard() {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([])
  const [filteredVulnerabilities, setFilteredVulnerabilities] = useState<Vulnerability[]>([])
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  // Mock data
  const mockVulnerabilities: Vulnerability[] = [
    {
      id: "1",
      title: "SQL Injection vulnerability in user authentication",
      severity: "CRITICAL",
      type: "SAST",
      description: "Unsanitized user input directly used in SQL query allowing potential SQL injection attacks.",
      cwe: "CWE-89",
      cvss: 9.8,
      foundAt: "2h ago",
      status: "OPEN",
      project: "API Gateway",
      file: "src/auth/login.ts",
      line: 145
    },
    {
      id: "2",
      title: "Cross-Site Scripting (XSS) in dashboard component",
      severity: "HIGH",
      type: "SAST",
      description: "User-controlled data rendered without proper sanitization, allowing XSS attacks.",
      cwe: "CWE-79",
      cvss: 7.5,
      foundAt: "5h ago",
      status: "IN_PROGRESS",
      project: "Frontend",
      file: "components/Dashboard.tsx",
      line: 234
    },
    {
      id: "3",
      title: "Regular Expression Denial of Service (ReDoS)",
      severity: "HIGH",
      type: "SAST",
      description: "Complex regex pattern vulnerable to ReDoS attacks causing CPU exhaustion.",
      cwe: "CWE-1333",
      cvss: 7.0,
      foundAt: "1d ago",
      status: "OPEN",
      project: "Pipeline Service",
      file: "src/validators/input.ts",
      line: 67
    },
    {
      id: "4",
      title: "Insecure Direct Object Reference (IDOR)",
      severity: "HIGH",
      type: "SAST",
      description: "Missing authorization check allows access to unauthorized resources.",
      cwe: "CWE-639",
      cvss: 6.5,
      foundAt: "2d ago",
      status: "RESOLVED",
      project: "User Service",
      file: "src/routes/user.ts",
      line: 89
    },
    {
      id: "5",
      title: "Lodash vulnerable to Prototype Pollution",
      severity: "CRITICAL",
      type: "DEPENDENCY",
      package: "lodash",
      version: "4.17.15",
      fixedIn: "4.17.21",
      description: "Known vulnerability in lodash allowing prototype pollution attacks.",
      cwe: "CWE-1321",
      cvss: 9.1,
      foundAt: "3h ago",
      status: "OPEN",
      project: "Multiple Projects"
    },
    {
      id: "6",
      title: "Express.js vulnerable to Open Redirect",
      severity: "MEDIUM",
      type: "DEPENDENCY",
      package: "express",
      version: "4.17.1",
      fixedIn: "4.18.2",
      description: "Vulnerable to open redirect attacks in certain configurations.",
      cwe: "CWE-601",
      cvss: 5.4,
      foundAt: "1d ago",
      status: "IN_PROGRESS",
      project: "API Gateway"
    },
    {
      id: "7",
      title: "Hardcoded credentials in configuration file",
      severity: "CRITICAL",
      type: "SECRET_SCAN",
      description: "Database credentials hardcoded in source code instead of environment variables.",
      cwe: "CWE-798",
      cvss: 9.5,
      foundAt: "4h ago",
      status: "OPEN",
      project: "Backend Services",
      file: "config/database.ts",
      line: 12
    },
    {
      id: "8",
      title: "AWS Access Key exposed in code",
      severity: "CRITICAL",
      type: "SECRET_SCAN",
      description: "AWS access key found in source code, potentially exposing cloud infrastructure.",
      foundAt: "6h ago",
      status: "RESOLVED",
      project: "Deployment Service",
      file: "src/aws/s3.ts",
      line: 8
    },
    {
      id: "9",
      title: "Missing Content Security Policy header",
      severity: "MEDIUM",
      type: "SAST",
      description: "Application does not set Content-Security-Policy header, reducing XSS protection.",
      cwe: "CWE-1021",
      cvss: 4.3,
      foundAt: "2d ago",
      status: "OPEN",
      project: "Frontend",
      file: "next.config.js",
      line: 1
    },
    {
      id: "10",
      title: "Weak cryptographic algorithm (MD5)",
      severity: "MEDIUM",
      type: "SAST",
      description: "MD5 hash function used for sensitive data, should use SHA-256 or better.",
      cwe: "CWE-327",
      cvss: 5.9,
      foundAt: "3d ago",
      status: "IGNORED",
      project: "User Service",
      file: "src/utils/crypto.ts",
      line: 45
    },
    {
      id: "11",
      title: "Missing rate limiting on API endpoints",
      severity: "LOW",
      type: "SAST",
      description: "API endpoints lack rate limiting, potentially allowing brute force attacks.",
      cwe: "CWE-307",
      cvss: 3.7,
      foundAt: "5d ago",
      status: "OPEN",
      project: "API Gateway"
    },
    {
      id: "12",
      title: "Information disclosure in error messages",
      severity: "LOW",
      type: "SAST",
      description: "Detailed error messages expose internal system information.",
      cwe: "CWE-209",
      cvss: 3.1,
      foundAt: "1w ago",
      status: "IN_PROGRESS",
      project: "Multiple Projects"
    }
  ]

  useEffect(() => {
    setTimeout(() => {
      setVulnerabilities(mockVulnerabilities)
      setFilteredVulnerabilities(mockVulnerabilities)
      setLoading(false)
    }, 500)
  }, [])

  useEffect(() => {
    let filtered = vulnerabilities

    if (filterSeverity !== "all") {
      filtered = filtered.filter(v => v.severity === filterSeverity.toUpperCase())
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(v => v.status === filterStatus.toUpperCase())
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(v =>
        v.title.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query) ||
        v.project.toLowerCase().includes(query) ||
        v.package?.toLowerCase().includes(query)
      )
    }

    setFilteredVulnerabilities(filtered)
  }, [filterSeverity, filterStatus, searchQuery, vulnerabilities])

  const stats: SeverityStats = {
    critical: vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
    high: vulnerabilities.filter(v => v.severity === 'HIGH').length,
    medium: vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
    low: vulnerabilities.filter(v => v.severity === 'LOW').length,
    info: vulnerabilities.filter(v => v.severity === 'INFO').length,
    total: vulnerabilities.length
  }

  const openVulnerabilities = vulnerabilities.filter(v => v.status === 'OPEN').length
  const resolvedVulnerabilities = vulnerabilities.filter(v => v.status === 'RESOLVED').length

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200'
      case 'MEDIUM': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'LOW': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'INFO': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-red-700 bg-red-100'
      case 'IN_PROGRESS': return 'text-blue-700 bg-blue-100'
      case 'RESOLVED': return 'text-green-700 bg-green-100'
      case 'IGNORED': return 'text-gray-700 bg-gray-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return <ShieldExclamationIcon className="h-5 w-5" />
      case 'MEDIUM':
        return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'LOW':
      case 'INFO':
        return <InformationCircleIcon className="h-5 w-5" />
      default:
        return <ShieldCheckIcon className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ShieldExclamationIcon className="h-10 w-10 text-red-600" />
            Security Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor and manage security vulnerabilities across your projects
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/security/code-quality"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Code Quality
          </Link>
          <Link
            href="/security/dependencies"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Dependencies
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-purple-700 font-medium">Critical</div>
              <ShieldExclamationIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-900">{stats.critical}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-red-700 font-medium">High</div>
              <ShieldExclamationIcon className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-900">{stats.high}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-orange-700 font-medium">Medium</div>
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-900">{stats.medium}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-yellow-700 font-medium">Low</div>
              <InformationCircleIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-yellow-900">{stats.low}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-700 font-medium">Total</div>
              <ChartBarIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-2">Open Issues</div>
                <div className="text-3xl font-bold text-red-600">{openVulnerabilities}</div>
              </div>
              <XCircleIcon className="h-12 w-12 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-2">In Progress</div>
                <div className="text-3xl font-bold text-blue-600">
                  {vulnerabilities.filter(v => v.status === 'IN_PROGRESS').length}
                </div>
              </div>
              <ClockIcon className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-2">Resolved</div>
                <div className="text-3xl font-bold text-green-600">{resolvedVulnerabilities}</div>
              </div>
              <CheckCircleIcon className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/security/code-quality">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="font-semibold text-gray-900">Code Quality</div>
                  <div className="text-sm text-gray-600">View quality metrics</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/security/dependencies">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DocumentTextIcon className="h-8 w-8 text-green-600" />
                <div>
                  <div className="font-semibold text-gray-900">Dependencies</div>
                  <div className="text-sm text-gray-600">Analyze dependencies</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/security/compliance">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="font-semibold text-gray-900">Compliance</div>
                  <div className="text-sm text-gray-600">View compliance reports</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vulnerabilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="ignored">Ignored</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vulnerabilities ({filteredVulnerabilities.length})</CardTitle>
          <CardDescription>Detailed list of security vulnerabilities</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading vulnerabilities...</div>
          ) : filteredVulnerabilities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p>No vulnerabilities found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVulnerabilities.map((vuln) => (
                <div
                  key={vuln.id}
                  className={`border rounded-lg p-4 ${getSeverityColor(vuln.severity)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={getSeverityColor(vuln.severity)}>
                        {getSeverityIcon(vuln.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{vuln.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                            {vuln.severity}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(vuln.status)}`}>
                            {vuln.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{vuln.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <strong>Type:</strong> {vuln.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <strong>Project:</strong> {vuln.project}
                          </span>
                          {vuln.package && (
                            <span className="flex items-center gap-1">
                              <strong>Package:</strong> {vuln.package}@{vuln.version}
                              {vuln.fixedIn && <span className="text-green-600"> → Fix: {vuln.fixedIn}</span>}
                            </span>
                          )}
                          {vuln.file && (
                            <span className="flex items-center gap-1">
                              <strong>File:</strong> {vuln.file}:{vuln.line}
                            </span>
                          )}
                          {vuln.cwe && (
                            <span className="flex items-center gap-1">
                              <strong>CWE:</strong> {vuln.cwe}
                            </span>
                          )}
                          {vuln.cvss && (
                            <span className="flex items-center gap-1">
                              <strong>CVSS:</strong> {vuln.cvss}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            {vuln.foundAt}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                        View Details
                      </button>
                      {vuln.status === 'OPEN' && (
                        <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                          Mark Resolved
                        </button>
                      )}
                    </div>
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
