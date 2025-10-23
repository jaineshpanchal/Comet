"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeftIcon,
  PlayIcon,
  StopIcon,
  PlusIcon,
  TrashIcon,
  CodeBracketIcon,
  DocumentDuplicateIcon
} from "@heroicons/react/24/outline"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface RecordedStep {
  id: string
  action: 'click' | 'type' | 'navigate' | 'select' | 'hover' | 'wait'
  selector: string
  value?: string
  timestamp: number
}

export default function PlaywrightRecorderPage() {
  const router = useRouter()
  const [isRecording, setIsRecording] = useState(false)
  const [recordedSteps, setRecordedSteps] = useState<RecordedStep[]>([])
  const [baseUrl, setBaseUrl] = useState("https://example.com")
  const [testName, setTestName] = useState("My E2E Test")
  const [framework, setFramework] = useState<'playwright' | 'cypress'>('playwright')

  // Manual step addition
  const [manualStep, setManualStep] = useState({
    action: 'click' as RecordedStep['action'],
    selector: '',
    value: ''
  })

  const handleStartRecording = () => {
    setIsRecording(true)
    setRecordedSteps([])
    // In a real implementation, this would open a browser window and start recording
    alert('Recording started! In production, this would open a browser window for you to interact with.')
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    alert('Recording stopped!')
  }

  const handleAddManualStep = () => {
    if (!manualStep.selector) {
      alert('Please provide a selector')
      return
    }

    const step: RecordedStep = {
      id: Date.now().toString(),
      action: manualStep.action,
      selector: manualStep.selector,
      value: manualStep.value || undefined,
      timestamp: Date.now()
    }

    setRecordedSteps([...recordedSteps, step])
    setManualStep({ action: 'click', selector: '', value: '' })
  }

  const handleDeleteStep = (id: string) => {
    setRecordedSteps(recordedSteps.filter(step => step.id !== id))
  }

  const generatePlaywrightCode = () => {
    let code = `import { test, expect } from '@playwright/test';\n\n`
    code += `test('${testName}', async ({ page }) => {\n`
    code += `  // Navigate to base URL\n`
    code += `  await page.goto('${baseUrl}');\n\n`

    recordedSteps.forEach((step, index) => {
      code += `  // Step ${index + 1}: ${step.action}\n`

      switch (step.action) {
        case 'click':
          code += `  await page.click('${step.selector}');\n`
          break
        case 'type':
          code += `  await page.fill('${step.selector}', '${step.value}');\n`
          break
        case 'navigate':
          code += `  await page.goto('${step.selector}');\n`
          break
        case 'select':
          code += `  await page.selectOption('${step.selector}', '${step.value}');\n`
          break
        case 'hover':
          code += `  await page.hover('${step.selector}');\n`
          break
        case 'wait':
          code += `  await page.waitForSelector('${step.selector}');\n`
          break
      }
      code += '\n'
    })

    code += `  // Add your assertions here\n`
    code += `  // await expect(page).toHaveTitle(/Expected Title/);\n`
    code += `});\n`

    return code
  }

  const generateCypressCode = () => {
    let code = `describe('${testName}', () => {\n`
    code += `  it('should pass', () => {\n`
    code += `    // Navigate to base URL\n`
    code += `    cy.visit('${baseUrl}');\n\n`

    recordedSteps.forEach((step, index) => {
      code += `    // Step ${index + 1}: ${step.action}\n`

      switch (step.action) {
        case 'click':
          code += `    cy.get('${step.selector}').click();\n`
          break
        case 'type':
          code += `    cy.get('${step.selector}').type('${step.value}');\n`
          break
        case 'navigate':
          code += `    cy.visit('${step.selector}');\n`
          break
        case 'select':
          code += `    cy.get('${step.selector}').select('${step.value}');\n`
          break
        case 'hover':
          code += `    cy.get('${step.selector}').trigger('mouseover');\n`
          break
        case 'wait':
          code += `    cy.get('${step.selector}').should('be.visible');\n`
          break
      }
      code += '\n'
    })

    code += `    // Add your assertions here\n`
    code += `    // cy.get('selector').should('contain', 'Expected Text');\n`
    code += `  });\n`
    code += `});\n`

    return code
  }

  const generatedCode = framework === 'playwright' ? generatePlaywrightCode() : generateCypressCode()

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode)
    alert('Code copied to clipboard!')
  }

  const handleDownloadCode = () => {
    const fileName = framework === 'playwright'
      ? `${testName.toLowerCase().replace(/\s+/g, '-')}.spec.ts`
      : `${testName.toLowerCase().replace(/\s+/g, '-')}.cy.ts`

    const blob = new Blob([generatedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getActionIcon = (action: RecordedStep['action']) => {
    switch (action) {
      case 'click': return '🖱️'
      case 'type': return '⌨️'
      case 'navigate': return '🌐'
      case 'select': return '📋'
      case 'hover': return '👆'
      case 'wait': return '⏳'
      default: return '▶️'
    }
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
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <PlayIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-blue-600 tracking-tight leading-tight mb-1 [text-shadow:_2px_2px_4px_rgb(37_99_235_/_20%),_4px_4px_8px_rgb(37_99_235_/_10%)]">
                  Playwright Test Recorder
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Record browser interactions and generate E2E tests
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Configuration & Recording */}
          <div className="space-y-6">
            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
                <CardDescription>Configure your test settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Test Name
                  </label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Base URL
                  </label>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Framework
                  </label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value as 'playwright' | 'cypress')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="playwright">Playwright</option>
                    <option value="cypress">Cypress</option>
                  </select>
                </div>

                <div className="pt-4">
                  {!isRecording ? (
                    <button
                      onClick={handleStartRecording}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-md hover:from-green-600 hover:to-emerald-700 font-medium flex items-center justify-center gap-2"
                    >
                      <PlayIcon className="h-5 w-5" />
                      Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-md hover:from-red-600 hover:to-rose-700 font-medium flex items-center justify-center gap-2"
                    >
                      <StopIcon className="h-5 w-5" />
                      Stop Recording
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Manual Step Addition */}
            <Card>
              <CardHeader>
                <CardTitle>Add Manual Step</CardTitle>
                <CardDescription>Manually add test steps</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Action Type
                  </label>
                  <select
                    value={manualStep.action}
                    onChange={(e) => setManualStep({ ...manualStep, action: e.target.value as RecordedStep['action'] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="click">Click</option>
                    <option value="type">Type Text</option>
                    <option value="navigate">Navigate</option>
                    <option value="select">Select Dropdown</option>
                    <option value="hover">Hover</option>
                    <option value="wait">Wait for Element</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Selector (CSS)
                  </label>
                  <input
                    type="text"
                    value={manualStep.selector}
                    onChange={(e) => setManualStep({ ...manualStep, selector: e.target.value })}
                    placeholder="#submit-button, .login-form, [data-testid='login']"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>

                {(manualStep.action === 'type' || manualStep.action === 'select') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Value
                    </label>
                    <input
                      type="text"
                      value={manualStep.value}
                      onChange={(e) => setManualStep({ ...manualStep, value: e.target.value })}
                      placeholder="Enter value..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                <button
                  onClick={handleAddManualStep}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium flex items-center justify-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Step
                </button>
              </CardContent>
            </Card>

            {/* Recorded Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Recorded Steps ({recordedSteps.length})</CardTitle>
                <CardDescription>Your test steps in sequence</CardDescription>
              </CardHeader>
              <CardContent>
                {recordedSteps.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <PlayIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No steps recorded yet</p>
                    <p className="text-sm mt-1">Start recording or add manual steps</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {recordedSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <span className="text-2xl">{getActionIcon(step.action)}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            Step {index + 1}: {step.action.toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                            {step.selector}
                            {step.value && ` = "${step.value}"`}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteStep(step.id)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Generated Code */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generated Test Code</CardTitle>
                    <CardDescription>
                      {framework === 'playwright' ? 'Playwright' : 'Cypress'} test code
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      Copy
                    </button>
                    <button
                      onClick={handleDownloadCode}
                      className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"
                    >
                      <CodeBracketIcon className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono min-h-[600px]">
                  <code>{generatedCode}</code>
                </pre>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>💡 Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>• Use specific selectors like <code className="px-1 bg-gray-100 dark:bg-gray-800 rounded">data-testid</code> attributes for reliability</p>
                <p>• Add wait steps before interacting with dynamic elements</p>
                <p>• Test your selectors in browser DevTools first</p>
                <p>• Keep tests focused on specific user flows</p>
                <p>• Add assertions to verify expected behavior</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
