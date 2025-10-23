"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon, BeakerIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline"
import { TestService, type CreateTestSuiteDto } from "@/services/test.service"
import { ProjectService, type Project } from "@/services/project.service"

export default function CreateTestSuitePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  const [formData, setFormData] = useState<CreateTestSuiteDto>({
    name: "",
    description: "",
    projectId: "",
    type: "UNIT",
    framework: "Jest",
    testFiles: [],
    configuration: {}
  })

  const [testFileInput, setTestFileInput] = useState("")
  const [configKey, setConfigKey] = useState("")
  const [configValue, setConfigValue] = useState("")

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true)
      const projectsList = await ProjectService.getProjects()
      setProjects(projectsList)

      // Auto-select first project if available
      if (projectsList.length > 0 && !formData.projectId) {
        setFormData(prev => ({ ...prev, projectId: projectsList[0].id }))
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.projectId || !formData.type) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      await TestService.createTestSuite(formData)
      alert('Test suite created successfully!')
      router.push('/testing/suites')
    } catch (error: any) {
      console.error('Error creating test suite:', error)
      alert(error?.response?.data?.message || 'Failed to create test suite')
    } finally {
      setLoading(false)
    }
  }

  const addTestFile = () => {
    if (testFileInput.trim()) {
      setFormData(prev => ({
        ...prev,
        testFiles: [...(prev.testFiles || []), testFileInput.trim()]
      }))
      setTestFileInput("")
    }
  }

  const removeTestFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      testFiles: (prev.testFiles || []).filter((_, i) => i !== index)
    }))
  }

  const addConfigEntry = () => {
    if (configKey.trim() && configValue.trim()) {
      setFormData(prev => ({
        ...prev,
        configuration: {
          ...prev.configuration,
          [configKey.trim()]: configValue.trim()
        }
      }))
      setConfigKey("")
      setConfigValue("")
    }
  }

  const removeConfigEntry = (key: string) => {
    setFormData(prev => {
      const newConfig = { ...prev.configuration }
      delete newConfig[key]
      return { ...prev, configuration: newConfig }
    })
  }

  const frameworkOptions = {
    UNIT: ["Jest", "Mocha", "Jasmine", "AVA", "Tape"],
    INTEGRATION: ["Jest", "Mocha", "Supertest", "Newman"],
    E2E: ["Playwright", "Cypress", "Selenium", "Puppeteer", "TestCafe"],
    PERFORMANCE: ["Artillery", "JMeter", "K6", "Gatling"],
    SECURITY: ["OWASP ZAP", "Burp Suite", "Snyk", "SonarQube"]
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/testing/suites"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">Create Test Suite</h1>
          <p className="text-gray-600 mt-1">Set up a new test collection for your project</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <BeakerIcon className="w-6 h-6 text-blue-600" />
            Basic Information
          </h2>

          <div className="space-y-5">
            {/* Test Suite Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Suite Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., API Integration Tests"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this test suite covers..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project <span className="text-red-500">*</span>
              </label>
              {loadingProjects ? (
                <div className="text-gray-500">Loading projects...</div>
              ) : projects.length === 0 ? (
                <div className="text-red-600">No projects available. Please create a project first.</div>
              ) : (
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.framework})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Test Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  type: e.target.value as any,
                  framework: frameworkOptions[e.target.value as keyof typeof frameworkOptions][0]
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="UNIT">Unit Tests</option>
                <option value="INTEGRATION">Integration Tests</option>
                <option value="E2E">End-to-End Tests</option>
                <option value="PERFORMANCE">Performance Tests</option>
                <option value="SECURITY">Security Tests</option>
              </select>
            </div>

            {/* Framework */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Testing Framework <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.framework}
                onChange={(e) => setFormData(prev => ({ ...prev, framework: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                {frameworkOptions[formData.type].map(fw => (
                  <option key={fw} value={fw}>{fw}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Test Files */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Test Files (Optional)</h2>

          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={testFileInput}
                onChange={(e) => setTestFileInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTestFile())}
                placeholder="e.g., src/**/*.test.ts"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addTestFile}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Add
              </button>
            </div>

            {formData.testFiles && formData.testFiles.length > 0 && (
              <div className="space-y-2">
                {formData.testFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 font-mono text-sm">{file}</span>
                    <button
                      type="button"
                      onClick={() => removeTestFile(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuration (Optional)</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={configKey}
                onChange={(e) => setConfigKey(e.target.value)}
                placeholder="Key (e.g., timeout)"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  value={configValue}
                  onChange={(e) => setConfigValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addConfigEntry())}
                  placeholder="Value (e.g., 5000)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addConfigEntry}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 flex items-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add
                </button>
              </div>
            </div>

            {Object.keys(formData.configuration || {}).length > 0 && (
              <div className="space-y-2">
                {Object.entries(formData.configuration || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-700">{key}:</span>
                      <span className="text-gray-600">{String(value)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeConfigEntry(key)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
          <Link
            href="/testing/suites"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || loadingProjects || projects.length === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              loading || loadingProjects || projects.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white '
            }`}
          >
            {loading ? 'Creating...' : 'Create Test Suite'}
          </button>
        </div>
      </form>
    </div>
  )
}
