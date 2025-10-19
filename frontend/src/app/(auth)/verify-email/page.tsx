"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircleIcon, ExclamationCircleIcon, EnvelopeIcon } from "@heroicons/react/24/outline"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      setStatus("error")
      setMessage("Invalid or missing verification token")
      return
    }

    verifyEmail(token)
  }, [searchParams])

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage("Your email has been verified successfully!")

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else {
        setStatus("error")
        setMessage(data.error || "Failed to verify email")
      }
    } catch (err) {
      setStatus("error")
      setMessage("Network error. Please try again.")
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setMessage("Please enter your email address")
      return
    }

    setResending(true)

    try {
      const response = await fetch("http://localhost:8000/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage("Verification email sent! Please check your inbox.")
      } else {
        setMessage(data.error || "Failed to resend verification email")
      }
    } catch (err) {
      setMessage("Network error. Please try again.")
    } finally {
      setResending(false)
    }
  }

  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <EnvelopeIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent mb-4">
              Verifying Email...
            </h1>
            <p className="text-gray-600 mb-6">
              Please wait while we verify your email address.
            </p>
            <div className="flex justify-center">
              <svg className="animate-spin h-12 w-12 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <CheckCircleIcon className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent mb-4">
              Email Verified!
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">What's Next?</h2>
              <ul className="text-sm text-gray-700 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Your account is now fully activated</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>You can access all platform features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Redirecting you to login...</span>
                </li>
              </ul>
            </div>

            <Link
              href="/login"
              className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mb-6">
            <ExclamationCircleIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Verification Failed
          </h1>
          <p className="text-gray-600 mb-6">{message}</p>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 text-left">
            <p className="text-sm text-yellow-800 font-semibold mb-2">Common Issues:</p>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Verification link has expired</li>
              <li>Link has already been used</li>
              <li>Invalid or corrupted link</li>
            </ul>
          </div>

          {/* Resend Verification */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Request New Verification Link
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleResendVerification}
                disabled={resending || !email}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Send New Verification Email"
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Link
              href="/login"
              className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back to Login
            </Link>
            <Link
              href="/register"
              className="block text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
