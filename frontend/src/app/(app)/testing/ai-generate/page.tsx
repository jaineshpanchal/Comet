"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon, SparklesIcon } from "@heroicons/react/24/outline"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { TestService, type GeneratedTest, type GenerateTestsRequest } from "@/services/test.service"

export default function AITestGenerationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [generatedTests, setGeneratedTests] = useState<GeneratedTest[]>([])
  const [selectedTest, setSelectedTest] = useState<GeneratedTest | null>(null)

  const [formData, setFormData] = useState<GenerateTestsRequest>({
    code: "",
    language: "typescript",
    framework: "Jest",
    testType: "UNIT",
    description: ""
  })

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code.trim()) {
      alert("Please provide code to generate tests for")
      return
    }

    try {
      setLoading(true)
      const response = await TestService.generateTestsWithAI(formData)
      setGeneratedTests(response.tests)
      if (response.tests.length > 0) {
        setSelectedTest(response.tests[0])
      }
    } catch (error: any) {
      console.error("Error generating tests:", error)
      alert(error?.response?.data?.message || "Failed to generate tests")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyTest = (test: GeneratedTest) => {
    navigator.clipboard.writeText(test.testCode)
    alert("Test code copied to clipboard!")
  }

  const handleDownloadTest = (test: GeneratedTest) => {
    const blob = new Blob([test.testCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = test.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/testing"
              className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-2"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Testing
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
                  AI Test Generation
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Generate unit tests automatically using AI
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Source Code</CardTitle>
              <CardDescription>
                Paste your code below to generate tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="jsx">JSX</option>
                    <option value="tsx">TSX</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                  </select>
                </div>

                {/* Framework Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Test Framework
                  </label>
                  <select
                    value={formData.framework}
                    onChange={(e) => setFormData(prev => ({ ...prev, framework: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="Jest">Jest</option>
                    <option value="Mocha">Mocha</option>
                    <option value="Jasmine">Jasmine</option>
                    <option value="Playwright">Playwright</option>
                    <option value="Cypress">Cypress</option>
                  </select>
                </div>

                {/* Test Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Test Type
                  </label>
                  <select
                    value={formData.testType}
                    onChange={(e) => setFormData(prev => ({ ...prev, testType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="UNIT">Unit Tests</option>
                    <option value="INTEGRATION">Integration Tests</option>
                    <option value="E2E">E2E Tests</option>
                  </select>
                </div>

                {/* Code Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Source Code *
                  </label>
                  <textarea
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Paste your code here..."
                    rows={12}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Context (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add any specific requirements or edge cases..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-md hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      Generating Tests...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      Generate Tests with AI
                    </>
                  )}
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Generated Tests */}
          <div className="space-y-4">
            {generatedTests.length > 0 ? (
              <>
                {/* Test List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Generated Tests ({generatedTests.length})</CardTitle>
                    <CardDescription>
                      Click on a test to view and copy the code
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {generatedTests.map((test, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedTest(test)}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                            selectedTest === test
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            {test.fileName}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {test.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Test Code Preview */}
                {selectedTest && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{selectedTest.fileName}</CardTitle>
                          <CardDescription>{selectedTest.framework} Test</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopyTest(selectedTest)}
                            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => handleDownloadTest(selectedTest)}
                            className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                        <code>{selectedTest.testCode}</code>
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <SparklesIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No tests generated yet</p>
                    <p className="text-sm mt-2">
                      Enter your code on the left and click "Generate Tests with AI"
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
