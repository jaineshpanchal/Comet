"use client";

import React from "react";
import Link from "next/link";

export default function HomePage() {
  // Landing page - users must sign in to access the platform

  return (
    <div className="min-h-screen bg-white">
      {/* Professional Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {/* Your exact comet logo - landing page, background removed */}
                  <img 
                    src="/Comet.png" 
                    alt="Comet Logo" 
                    className="w-7 h-7 object-contain"
                    style={{ 
                      mixBlendMode: 'multiply',
                      filter: 'brightness(0) invert(1)'
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-tight text-slate-900">Comet DevOps</h1>
                  <p className="text-[10px] font-medium tracking-wide text-slate-500 -mt-1">DEVOPS PLATFORM</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-8">
                <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Features</a>
                <a href="#enterprise" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Enterprise</a>
                <a href="#docs" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Documentation</a>
              </nav>
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors shadow-sm"
                >
                  Open Platform
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl lg:text-7xl">
              <span className="block">Enterprise-Grade</span>
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DevOps Platform
              </span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 leading-8">
              Complete CI/CD automation, intelligent testing, advanced analytics, and seamless integrations. 
              Build, test, and deploy with confidence at enterprise scale.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/auth/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:shadow-lg hover:scale-105"
              >
                Launch Platform
              </Link>
              <button className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:shadow-md">
                Watch Demo
              </button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900">Platform Capabilities</h2>
              <p className="mt-4 text-xl text-gray-600">Enterprise DevOps tools that scale with your organization</p>
            </div>
            
            <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group relative bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-lg transition-all">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">CI/CD Pipelines</h3>
                  <p className="text-gray-600 leading-6">
                    Automated build, test, and deployment pipelines with advanced parallel execution, 
                    approval gates, and deployment strategies.
                  </p>
                </div>
              </div>

              <div className="group relative bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-lg transition-all">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Quality Gates</h3>
                  <p className="text-gray-600 leading-6">
                    Comprehensive code quality analysis with SonarQube integration, 
                    security scanning, and automated quality enforcement.
                  </p>
                </div>
              </div>

              <div className="group relative bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-lg transition-all">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Testing Automation</h3>
                  <p className="text-gray-600 leading-6">
                    AI-powered test generation, parallel test execution, 
                    and comprehensive reporting across unit, integration, and E2E tests.
                  </p>
                </div>
              </div>

              <div className="group relative bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-lg transition-all">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Release Management</h3>
                  <p className="text-gray-600 leading-6">
                    End-to-end release orchestration with environment promotion, 
                    rollback capabilities, and compliance tracking.
                  </p>
                </div>
              </div>

              <div className="group relative bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-lg transition-all">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Analytics & Insights</h3>
                  <p className="text-gray-600 leading-6">
                    Real-time dashboards, DORA metrics, performance analytics, 
                    and predictive insights for continuous improvement.
                  </p>
                </div>
              </div>

              <div className="group relative bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-lg transition-all">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Enterprise Integrations</h3>
                  <p className="text-gray-600 leading-6">
                    Native integrations with JIRA, GitHub, Jenkins, SonarQube, 
                    and hundreds of other enterprise tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Status */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-12">Live Platform Status</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="bg-gray-50 rounded-xl border border-green-200 p-6 shadow-sm">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mx-auto mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">API Gateway</h3>
                  <p className="text-green-600 font-medium">Operational</p>
                  <p className="text-sm text-gray-500 mt-1">99.9% uptime</p>
                </div>
                <div className="bg-gray-50 rounded-xl border border-green-200 p-6 shadow-sm">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mx-auto mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">User Services</h3>
                  <p className="text-green-600 font-medium">Healthy</p>
                  <p className="text-sm text-gray-500 mt-1">7ms response</p>
                </div>
                <div className="bg-gray-50 rounded-xl border border-green-200 p-6 shadow-sm">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mx-auto mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Database</h3>
                  <p className="text-green-600 font-medium">Connected</p>
                  <p className="text-sm text-gray-500 mt-1">All systems go</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}