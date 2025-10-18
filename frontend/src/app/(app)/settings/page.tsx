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
} from "@heroicons/react/24/outline"

export default function SettingsPage() {
  useAuthGuard()
  const router = useRouter()

  const tabs = [
    { id: "profile", label: "Profile", icon: UserCircleIcon, gradient: "from-blue-500 to-cyan-500" },
    { id: "security", label: "Security", icon: ShieldCheckIcon, gradient: "from-purple-500 to-pink-500" },
    { id: "notifications", label: "Notifications", icon: BellIcon, gradient: "from-orange-500 to-red-500" },
    { id: "preferences", label: "Preferences", icon: Cog6ToothIcon, gradient: "from-green-500 to-emerald-500" },
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
      ADMIN: { color: "bg-gradient-to-r from-red-500 to-pink-500", label: "Administrator" },
      MANAGER: { color: "bg-gradient-to-r from-purple-500 to-indigo-500", label: "Manager" },
      DEVELOPER: { color: "bg-gradient-to-r from-blue-500 to-cyan-500", label: "Developer" },
      TESTER: { color: "bg-gradient-to-r from-green-500 to-emerald-500", label: "Tester" },
      VIEWER: { color: "bg-gradient-to-r from-gray-500 to-slate-500", label: "Viewer" },
    }
    return badges[role] || badges.VIEWER
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with User Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-1">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`}
                    alt="Avatar"
                    className="h-full w-full rounded-xl object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-green-500 border-4 border-white shadow-lg"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  {firstName} {lastName}
                </h1>
                <p className="text-gray-600 text-lg mt-1">@{username}</p>
                {user?.role && (
                  <span className={`inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full text-white text-sm font-semibold ${getRoleBadge(user.role).color}`}>
                    <ShieldCheckIcon className="h-4 w-4" />
                    {getRoleBadge(user.role).label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl backdrop-blur-sm border-2 flex items-center gap-3 animate-in slide-in-from-top ${
              message.type === "success"
                ? "bg-green-50/80 border-green-200 text-green-800"
                : "bg-red-50/80 border-red-200 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircleIcon className="h-6 w-6" />
            ) : (
              <ExclamationCircleIcon className="h-6 w-6" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Modern Tabs */}
        <div className="mb-8">
          <div className="flex gap-3 p-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setMessage(null)
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg scale-105`
                      : "text-gray-600 hover:bg-gray-100"
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
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <UserCircleIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                <p className="text-gray-600">Update your personal details</p>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl cursor-not-allowed"
                  disabled
                />
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-4 w-4" />
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-xl cursor-not-allowed"
                  disabled
                />
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-4 w-4" />
                  Username cannot be changed
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <ShieldCheckIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
                  <p className="text-gray-600">Keep your account secure</p>
                </div>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                  <p className="text-sm text-gray-500">Must be at least 8 characters long</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <BellIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
                <p className="text-gray-600">Manage how you receive updates</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { id: "email", label: "Email Notifications", desc: "Receive notifications via email", state: emailNotifications, setState: setEmailNotifications },
                { id: "push", label: "Push Notifications", desc: "Receive push notifications in your browser", state: pushNotifications, setState: setPushNotifications },
                { id: "pipeline", label: "Pipeline Updates", desc: "Get notified about pipeline status changes", state: pipelineNotifications, setState: setPipelineNotifications },
                { id: "deployment", label: "Deployment Alerts", desc: "Get notified about deployment events", state: deploymentNotifications, setState: setDeploymentNotifications },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border-2 border-gray-200 hover:border-orange-300 transition-all">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.label}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.state}
                      onChange={(e) => item.setState(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-red-500"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={handlePreferencesSave}
                className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Cog6ToothIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Application Preferences</h2>
                <p className="text-gray-600">Customize your experience</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
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
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* Logout Section */}
        <div className="mt-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-3xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ArrowRightStartOnRectangleIcon className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Ready to go?</h2>
                <p className="text-white/80">End your session and log out securely</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-8 py-3 bg-white text-red-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
