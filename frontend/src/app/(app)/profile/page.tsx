"use client"

import { useState } from "react"
import {
  UserCircleIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  RocketLaunchIcon,
  BeakerIcon,
  CodeBracketIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface Activity {
  id: string
  type: 'PIPELINE' | 'TEST' | 'DEPLOYMENT' | 'CODE_REVIEW' | 'COMMIT'
  action: string
  project: string
  timestamp: string
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
}

export default function UserProfilePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'settings'>('overview')

  // Mock user data
  const user = {
    name: "John Developer",
    email: "john.developer@company.com",
    role: "Senior DevOps Engineer",
    department: "Engineering",
    joinedDate: "January 15, 2023",
    teams: ["Platform Team", "Backend Team", "DevOps Guild"],
    permissions: ["DEVELOPER", "REVIEWER", "DEPLOYER"],
    stats: {
      pipelinesRun: 342,
      testsExecuted: 1847,
      deploymentsCompleted: 156,
      codeReviews: 89,
      commits: 1523,
      activeProjects: 8,
    }
  }

  const recentActivity: Activity[] = [
    {
      id: "1",
      type: "DEPLOYMENT",
      action: "Deployed v2.5.0 to production",
      project: "API Gateway",
      timestamp: "2 hours ago",
      status: "SUCCESS"
    },
    {
      id: "2",
      type: "PIPELINE",
      action: "Triggered CI/CD pipeline",
      project: "Frontend",
      timestamp: "4 hours ago",
      status: "SUCCESS"
    },
    {
      id: "3",
      type: "CODE_REVIEW",
      action: "Approved pull request #245",
      project: "User Service",
      timestamp: "5 hours ago",
      status: "SUCCESS"
    },
    {
      id: "4",
      type: "TEST",
      action: "Executed E2E test suite",
      project: "Frontend",
      timestamp: "6 hours ago",
      status: "FAILED"
    },
    {
      id: "5",
      type: "COMMIT",
      action: "Pushed 3 commits to feature/auth-refactor",
      project: "API Gateway",
      timestamp: "1 day ago",
      status: "SUCCESS"
    },
    {
      id: "6",
      type: "PIPELINE",
      action: "Pipeline build failed",
      project: "Pipeline Service",
      timestamp: "1 day ago",
      status: "FAILED"
    },
    {
      id: "7",
      type: "DEPLOYMENT",
      action: "Deployed v2.4.8 to staging",
      project: "User Service",
      timestamp: "2 days ago",
      status: "SUCCESS"
    },
    {
      id: "8",
      type: "CODE_REVIEW",
      action: "Requested changes on PR #238",
      project: "Backend Services",
      timestamp: "2 days ago",
      status: "PENDING"
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'PIPELINE': return <RocketLaunchIcon className="h-5 w-5 text-blue-600" />
      case 'TEST': return <BeakerIcon className="h-5 w-5 text-green-600" />
      case 'DEPLOYMENT': return <RocketLaunchIcon className="h-5 w-5 text-blue-600" />
      case 'CODE_REVIEW': return <CodeBracketIcon className="h-5 w-5 text-orange-600" />
      case 'COMMIT': return <CodeBracketIcon className="h-5 w-5 text-gray-600" />
      default: return <ChartBarIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600 bg-green-50'
      case 'FAILED': return 'text-red-600 bg-red-50'
      case 'PENDING': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircleIcon className="h-4 w-4" />
      case 'FAILED': return <XCircleIcon className="h-4 w-4" />
      case 'PENDING': return <ClockIcon className="h-4 w-4" />
      default: return null
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your profile and view your activity
          </p>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                  {user.email}
                </div>
                <div className="flex items-center gap-2">
                  <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                  {user.role}
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
                  {user.department}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                  Joined {user.joinedDate}
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Teams</div>
                <div className="flex flex-wrap gap-2">
                  {user.teams.map((team, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {team}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 px-1 font-medium text-sm transition-colors ${
              activeTab === 'activity'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Activity History
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-1 font-medium text-sm transition-colors ${
              activeTab === 'settings'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Pipelines Run</div>
                <div className="text-2xl font-bold text-blue-600">{user.stats.pipelinesRun}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Tests Executed</div>
                <div className="text-2xl font-bold text-green-600">{user.stats.testsExecuted.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Deployments</div>
                <div className="text-2xl font-bold text-blue-600">{user.stats.deploymentsCompleted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Code Reviews</div>
                <div className="text-2xl font-bold text-orange-600">{user.stats.codeReviews}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Commits</div>
                <div className="text-2xl font-bold text-gray-900">{user.stats.commits.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Active Projects</div>
                <div className="text-2xl font-bold text-blue-600">{user.stats.activeProjects}</div>
              </CardContent>
            </Card>
          </div>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions & Access</CardTitle>
              <CardDescription>Your current role permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {user.permissions.map((permission, index) => (
                  <div key={index} className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">{permission}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent actions across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-900">{activity.action}</div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {getStatusIcon(activity.status)}
                          {activity.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-medium">{activity.project}</span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {activity.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  defaultValue={user.name}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  defaultValue={user.email}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <input
                  type="text"
                  defaultValue={user.role}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  defaultValue={user.department}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200">
                  Save Changes
                </button>
                <button className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
