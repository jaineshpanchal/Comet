"use client"

import { BeakerIcon, CheckCircleIcon, ClockIcon } from "@heroicons/react/24/outline"
import Link from "next/link"

export default function TestingPage() {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-6xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent tracking-tight leading-tight pb-1 mb-2">
          Testing
        </h1>
        <p className="text-lg font-normal text-gray-500 tracking-normal leading-relaxed">
          Manage <span className="text-gray-700 font-medium">test suites</span>, view{" "}
          <span className="text-gray-700 font-medium">test results</span>, and track{" "}
          <span className="text-gray-700 font-medium">code coverage</span>
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/testing/suites"
          className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BeakerIcon className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Test Suites</h3>
              <p className="text-sm text-gray-500">Manage test collections</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">0</div>
          <p className="text-xs text-gray-500">Total test suites</p>
        </Link>

        <Link
          href="/testing/results"
          className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckCircleIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
              <p className="text-sm text-gray-500">View execution history</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">0</div>
          <p className="text-xs text-gray-500">Test runs today</p>
        </Link>

        <Link
          href="/testing/coverage"
          className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-cyan-100 rounded-lg">
              <ClockIcon className="w-8 h-8 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Coverage</h3>
              <p className="text-sm text-gray-500">Track code coverage</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">0%</div>
          <p className="text-xs text-gray-500">Code coverage</p>
        </Link>
      </div>

      {/* Coming Soon Message */}
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <BeakerIcon className="mx-auto w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Testing Platform Coming Soon</h3>
        <p className="text-gray-600 mb-6">
          Test suite management, execution, and reporting features are currently in development.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/testing/results"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            View Test Results
          </Link>
          <Link
            href="/testing/coverage"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            View Coverage
          </Link>
        </div>
      </div>
    </div>
  )
}
