"use client"

import { useEffect } from "react"

export default function ProductionDeploymentsPage() {
  useEffect(() => {
    // Redirect to main deployments page with production filter
    window.location.href = "/deployments?environment=production"
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  )
}
