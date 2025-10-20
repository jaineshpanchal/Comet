"use client"

import { useState, useEffect } from "react"
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline"

export default function EmailVerificationBanner() {
  const [user, setUser] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("golive_jwt")
      if (!token) return

      const response = await fetch("http://localhost:8000/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success && data.data) {
        setUser(data.data)
        // Show banner if email is not verified
        if (data.data.isEmailVerified === false) {
          setShow(true)
        }
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
    }
  }

  const handleResendVerification = async () => {
    if (!user?.email) return

    setResending(true)
    setMessage("")

    try {
      const response = await fetch("http://localhost:8000/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage("Verification email sent! Please check your inbox.")
      } else {
        setMessage(data.error || "Failed to send verification email")
      }
    } catch (error) {
      setMessage("Network error. Please try again.")
    } finally {
      setResending(false)
    }
  }

  if (!show || !user) return null

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b-2 border-yellow-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                Email Verification Required
              </p>
              <p className="text-sm text-gray-700">
                Please verify your email address to access all features.{" "}
                {message && (
                  <span className={message.includes("sent") ? "text-green-700 font-medium" : "text-red-700"}>
                    {message}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                "Resend Email"
              )}
            </button>

            <button
              onClick={() => setShow(false)}
              className="p-1 rounded-lg hover:bg-yellow-200 transition-colors"
              aria-label="Dismiss"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
