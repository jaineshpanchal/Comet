"use client"

import { ShieldCheckIcon, ChartBarIcon } from "@heroicons/react/24/outline"

export default function TestCoveragePage() {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-6xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent tracking-tight leading-tight pb-1 mb-4">
          Test Coverage
        </h1>
        <p className="text-lg font-normal text-gray-500 tracking-normal leading-relaxed">
          View <span className="text-gray-700 font-medium">code coverage</span> metrics and{" "}
          <span className="text-gray-700 font-medium">quality reports</span>
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-center gap-4 mb-6">
            <ShieldCheckIcon className="w-16 h-16 text-blue-500 opacity-50" />
            <ChartBarIcon className="w-16 h-16 text-purple-500 opacity-50" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900">Test Coverage Coming Soon</h2>

          <p className="text-lg text-gray-600">
            We're working on comprehensive code coverage features including:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mt-8">
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">Coverage Metrics</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Line coverage percentage</li>
                <li>• Branch coverage analysis</li>
                <li>• Function coverage tracking</li>
                <li>• Statement coverage details</li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Visual Reports</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Coverage trends over time</li>
                <li>• File-by-file breakdown</li>
                <li>• Uncovered code highlighting</li>
                <li>• Team coverage leaderboard</li>
              </ul>
            </div>

            <div className="bg-cyan-50 rounded-lg p-6 border border-cyan-200">
              <h3 className="font-semibold text-cyan-900 mb-2">Integrations</h3>
              <ul className="text-sm text-cyan-700 space-y-1">
                <li>• Jest coverage reports</li>
                <li>• Codecov integration</li>
                <li>• SonarQube analysis</li>
                <li>• Custom coverage tools</li>
              </ul>
            </div>

            <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
              <h3 className="font-semibold text-indigo-900 mb-2">Quality Gates</h3>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• Minimum coverage thresholds</li>
                <li>• PR coverage requirements</li>
                <li>• Coverage trend alerts</li>
                <li>• Quality score tracking</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              In the meantime, you can run tests with coverage from your{" "}
              <a href="/testing" className="text-purple-600 hover:text-purple-700 font-medium">
                Test Suites
              </a>{" "}
              page.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
