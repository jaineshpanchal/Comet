"use client"

import { useState, useEffect } from "react"
import { logout } from '@/lib/auth'
import { useRouter } from "next/navigation"
import { useAuthGuard } from '@/lib/useAuthGuard'
import {
  UserCircleIcon,
  ShieldCheckIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline"

export default function SettingsPage() {
  useAuthGuard()
  const router = useRouter()

  const tabs = [
    { id: "profile", label: "Profile", icon: UserCircleIcon },
    { id: "security", label: "Security", icon: ShieldCheckIcon },
    { id: "notifications", label: "Notifications", icon: BellIcon },
    { id: "preferences", label: "Preferences", icon: Cog6ToothIcon },
    { id: "activity", label: "Activity", icon: ClockIcon },
  ]

  const [activeTab, setActiveTab] = useState("profile")
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [pipelineNotifications, setPipelineNotifications] = useState(true)
  const [deploymentNotifications, setDeploymentNotifications] = useState(true)
  const [theme, setTheme] = useState("light")
  const [language, setLanguage] = useState("en")
  const [timezone, setTimezone] = useState("UTC")
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [activityLoading, setActivityLoading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("comet_jwt")
        if (!token) throw new Error("No token")

        const res = await fetch("http://localhost:8000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error("Failed to load profile")
        const data = await res.json()
        const userData = data.data?.user || data.user || data

        setUser(userData)
        setFirstName(userData.firstName || "")
        setLastName(userData.lastName || "")
        setEmail(userData.email || "")
        setUsername(userData.username || "")
      } catch (err: any) {
        setMessage({ type: "error", text: err.message || "Failed to load profile" })
      }
    }
    fetchProfile()

    const storedPrefs = localStorage.getItem("userPreferences")
    if (storedPrefs) {
      const prefs = JSON.parse(storedPrefs)
      setEmailNotifications(prefs.emailNotifications ?? true)
      setPushNotifications(prefs.pushNotifications ?? true)
      setPipelineNotifications(prefs.pipelineNotifications ?? true)
      setDeploymentNotifications(prefs.deploymentNotifications ?? true)
      setTheme(prefs.theme ?? "light")
      setLanguage(prefs.language ?? "en")
      setTimezone(prefs.timezone ?? "UTC")
    }
  }, [])

  useEffect(() => {
    if (activeTab === "activity" && user) {
      fetchActivityLogs()
    }
  }, [activeTab, user])

  const fetchActivityLogs = async () => {
    setActivityLoading(true)
    try {
      const token = localStorage.getItem("comet_jwt")
      if (!token || !user) return

      const response = await fetch(`http://localhost:8000/api/audit-logs/user/${user.id}?limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setActivityLogs(data.data.logs)
      }
    } catch (err) {
      console.error("Failed to fetch activity logs:", err)
    } finally {
      setActivityLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)
    try {
      const token = localStorage.getItem("comet_jwt")
      if (!token) throw new Error("Not authenticated")

      const res = await fetch("http://localhost:8000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          avatar: user?.avatar,
        }),
      })

      if (!res.ok) throw new Error("Failed to update profile")
      const data = await res.json()
      const userData = data.data?.user || data.user || data
      setUser(userData)
      setMessage({ type: "success", text: "Profile updated successfully!" })
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update profile" })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)
    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match")
      }
      if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters long")
      }

      const token = localStorage.getItem("comet_jwt")
      if (!token) throw new Error("Not authenticated")

      const res = await fetch("http://localhost:8000/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to change password")
      }

      setMessage({ type: "success", text: "Password changed successfully!" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to change password" })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferencesSave = async () => {
    setIsLoading(true)
    setMessage(null)
    try {
      const preferences = {
        emailNotifications,
        pushNotifications,
        pipelineNotifications,
        deploymentNotifications,
        theme,
        language,
        timezone,
      }
      localStorage.setItem("userPreferences", JSON.stringify(preferences))
      setMessage({ type: "success", text: "Preferences saved successfully!" })
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to save preferences" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.replace("/auth/login")
  }

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      ADMIN: { color: "bg-purple-600", label: "Administrator" },
      MANAGER: { color: "bg-blue-600", label: "Manager" },
      DEVELOPER: { color: "bg-cyan-600", label: "Developer" },
      TESTER: { color: "bg-indigo-600", label: "Tester" },
      VIEWER: { color: "bg-gray-600", label: "Viewer" },
    }
    return badges[role] || badges.VIEWER
  }

  return (
    <div className="min-h-screen bg-gray-50 space-y-10 p-8 pb-12">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-6xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent tracking-tight leading-tight pb-1 mb-2">
            Settings
          </h1>
          <p className="text-lg font-normal text-gray-500 tracking-normal leading-relaxed">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-lg border flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <ExclamationCircleIcon className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* User Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`}
              alt="Avatar"
              className="h-16 w-16 rounded-full"
            />
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white"></div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {firstName} {lastName}
            </h2>
            <p className="text-sm text-gray-500">@{username}</p>
          </div>
          {user?.role && (
            <span className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${getRoleBadge(user.role).color}`}>
              {getRoleBadge(user.role).label}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setMessage(null)
                }}
                className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
            <p className="text-sm text-gray-500">Update your personal details</p>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
            <p className="text-sm text-gray-500">Keep your account secure</p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                required
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
            <p className="text-sm text-gray-500">Manage how you receive updates</p>
          </div>

          <div className="space-y-4">
            {[
              { id: "email", label: "Email Notifications", desc: "Receive notifications via email", state: emailNotifications, setState: setEmailNotifications },
              { id: "push", label: "Push Notifications", desc: "Receive push notifications in your browser", state: pushNotifications, setState: setPushNotifications },
              { id: "pipeline", label: "Pipeline Updates", desc: "Get notified about pipeline status changes", state: pipelineNotifications, setState: setPipelineNotifications },
              { id: "deployment", label: "Deployment Alerts", desc: "Get notified about deployment events", state: deploymentNotifications, setState: setDeploymentNotifications },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{item.label}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={(e) => item.setState(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6">
            <button
              onClick={handlePreferencesSave}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Application Preferences</h3>
            <p className="text-sm text-gray-500">Customize your experience</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              onClick={handlePreferencesSave}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === "activity" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <p className="text-sm text-gray-500">View your recent actions and security events</p>
          </div>

          {activityLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No activity logs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activityLogs.map((log: any) => {
                const timestamp = new Date(log.timestamp)
                const timeAgo = getTimeAgo(timestamp)
                const actionColor = getActionColor(log.action)

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-lg ${actionColor.bg}`}>
                        <ClockIcon className={`w-5 h-5 ${actionColor.text}`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionColor.badge}`}>
                          {log.action}
                        </span>
                        <span className="text-xs text-gray-500">{timeAgo}</span>
                      </div>
                      <p className="text-sm text-gray-900 capitalize">
                        {log.resource} {log.resourceId ? `(${log.resourceId.slice(0, 8)}...)` : ""}
                      </p>
                      {log.ipAddress && (
                        <p className="text-xs text-gray-500 mt-1">
                          IP: {log.ipAddress}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {timestamp.toLocaleString()}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )

  function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return date.toLocaleDateString()
  }

  function getActionColor(action: string): { text: string; bg: string; badge: string } {
    if (action.includes("delete")) return { text: "text-red-600", bg: "bg-red-50", badge: "text-red-600 bg-red-50" }
    if (action.includes("create")) return { text: "text-green-600", bg: "bg-green-50", badge: "text-green-600 bg-green-50" }
    if (action.includes("update") || action.includes("edit")) return { text: "text-blue-600", bg: "bg-blue-50", badge: "text-blue-600 bg-blue-50" }
    if (action.includes("login")) return { text: "text-purple-600", bg: "bg-purple-50", badge: "text-purple-600 bg-purple-50" }
    return { text: "text-gray-600", bg: "bg-gray-50", badge: "text-gray-600 bg-gray-50" }
  }
}
