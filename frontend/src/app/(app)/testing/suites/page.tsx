"use client"

import { useEffect } from "react"

export default function TestSuitesPage() {
  useEffect(() => {
    // Redirect to main testing page
    window.location.href = "/testing"
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  )
}
