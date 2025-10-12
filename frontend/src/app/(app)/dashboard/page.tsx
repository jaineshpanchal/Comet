"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SectionHeader } from "@/components/ui/section-header";
import { KpiMetric } from "@/components/ui/kpi-metric";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
	const [isLoading, setIsLoading] = React.useState(true);
	React.useEffect(() => {
		const t = setTimeout(() => setIsLoading(false), 800);
		return () => clearTimeout(t);
	}, []);

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
					<p className="text-sm text-neutral-600 mt-1">Monitor your DevOps pipeline performance and system health</p>
				</div>
			</div>

			<Tabs defaultValue="overview" className="w-full">
				<TabsList>
					<TabsTrigger value="overview">📊 Overview</TabsTrigger>
					<TabsTrigger value="pipelines" badge={3}>⚡ Pipelines</TabsTrigger>
					<TabsTrigger value="projects" badge={12}>📁 Projects</TabsTrigger>
					<TabsTrigger value="testing">🧪 Testing</TabsTrigger>
					<TabsTrigger value="quality">🔍 Quality</TabsTrigger>
					<TabsTrigger value="releases" badge={2}>📦 Releases</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="mt-8">
					<div className="space-y-8">
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
							{isLoading ? (
								Array.from({ length: 4 }).map((_, i) => (
									<div key={i} className="rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm">
										<Skeleton className="h-3 w-32 mb-4" />
										<Skeleton className="h-9 w-20 mb-2" />
										<Skeleton className="h-4 w-28" />
									</div>
								))
							) : (
								<>
									<KpiMetric
										label="Deployment Success Rate"
										value="98.5%"
										delta="+2.1% from last week"
										color="green"
										icon={(
											<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										)}
									/>
									<KpiMetric
										label="Lead Time"
										value="2.3h"
										delta="-15min from last week"
										color="blue"
										icon={(
											<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										)}
									/>
									<KpiMetric
										label="Test Coverage"
										value="94.2%"
										delta="+1.8% from last week"
										color="purple"
										icon={(
											<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
											</svg>
										)}
									/>
									<KpiMetric
										label="Active Deployments"
										value="7"
										delta="2 in production"
										color="orange"
										icon={(
											<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
											</svg>
										)}
									/>
								</>
							)}
						</div>

						<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
							{isLoading ? (
								<>
									<div className="rounded-xl border border-neutral-200/60 bg-white shadow-sm">
										<div className="border-b border-neutral-200/60 px-6 py-4">
											<Skeleton className="h-5 w-40" />
										</div>
										<div className="p-6 space-y-4">
											{Array.from({ length: 4 }).map((_, i) => (
												<div key={i} className="flex items-center space-x-4">
													<Skeleton className="h-2 w-2 rounded-full" />
													<div className="flex-1">
														<Skeleton className="h-4 w-64 mb-1" />
														<Skeleton className="h-3 w-40" />
													</div>
												</div>
											))}
										</div>
									</div>
									<div className="rounded-xl border border-neutral-200/60 bg-white shadow-sm">
										<div className="border-b border-neutral-200/60 px-6 py-4">
											<Skeleton className="h-5 w-44" />
										</div>
										<div className="p-6 space-y-6">
											{Array.from({ length: 3 }).map((_, i) => (
												<div key={i}>
													<div className="flex items-center justify-between mb-2">
														<Skeleton className="h-4 w-52" />
														<Skeleton className="h-5 w-20 rounded-full" />
													</div>
													<Skeleton className="h-2 w-full" />
													<Skeleton className="h-3 w-48 mt-2" />
												</div>
											))}
										</div>
									</div>
								</>
							) : (
								<>
									<div className="rounded-xl border border-neutral-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
										<div className="border-b border-neutral-200/60 px-6 py-4">
											<h3 className="text-base font-semibold text-neutral-900">Recent Activity</h3>
										</div>
										<div className="divide-y divide-neutral-100">
											<div className="flex items-center space-x-4 px-6 py-4">
												<div className="h-2 w-2 rounded-full bg-emerald-500" />
												<div className="flex-1">
													<p className="text-sm font-medium text-neutral-900">Production deployment successful</p>
													<p className="text-xs text-neutral-500">user-service v2.1.4 • 2 minutes ago</p>
												</div>
											</div>
											<div className="flex items-center space-x-4 px-6 py-4">
												<div className="h-2 w-2 rounded-full bg-blue-500" />
												<div className="flex-1">
													<p className="text-sm font-medium text-neutral-900">Code quality scan completed</p>
													<p className="text-xs text-neutral-500">payment-api • Grade A • 5 minutes ago</p>
												</div>
											</div>
											<div className="flex items-center space-x-4 px-6 py-4">
												<div className="h-2 w-2 rounded-full bg-purple-500" />
												<div className="flex-1">
													<p className="text-sm font-medium text-neutral-900">Test suite execution completed</p>
													<p className="text-xs text-neutral-500">frontend-app • 847 tests passed • 8 minutes ago</p>
												</div>
											</div>
											<div className="flex items-center space-x-4 px-6 py-4">
												<div className="h-2 w-2 rounded-full bg-orange-500" />
												<div className="flex-1">
													<p className="text-sm font-medium text-neutral-900">Release candidate created</p>
													<p className="text-xs text-neutral-500">mobile-app v3.0.0-rc.1 • 12 minutes ago</p>
												</div>
											</div>
										</div>
									</div>

									<div className="rounded-xl border border-neutral-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
										<div className="border-b border-neutral-200/60 px-6 py-4">
											<h3 className="text-base font-semibold text-neutral-900">Active Pipelines</h3>
										</div>
										<div className="divide-y divide-neutral-100">
											<div className="px-6 py-5">
												<div className="flex items-center justify-between mb-3">
													<p className="text-sm font-medium text-neutral-900">user-authentication-service</p>
													<span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
														Deployed
													</span>
												</div>
												<div className="w-full bg-neutral-200 rounded-full h-1.5 mb-2">
													<div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "100%" }} />
												</div>
												<p className="text-xs text-neutral-500 font-medium">Build #142 • 3m 24s • main branch</p>
											</div>
											<div className="px-6 py-5">
												<div className="flex items-center justify-between mb-3">
													<p className="text-sm font-medium text-neutral-900">payment-processing-api</p>
													<span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
														Testing
													</span>
												</div>
												<div className="w-full bg-neutral-200 rounded-full h-1.5 mb-2">
													<div className="bg-blue-500 h-1.5 rounded-full animate-pulse" style={{ width: "75%" }} />
												</div>
												<p className="text-xs text-neutral-500 font-medium">Build #89 • 1m 12s • feature/payment-v2</p>
											</div>
											<div className="px-6 py-5">
												<div className="flex items-center justify-between mb-3">
													<p className="text-sm font-medium text-neutral-900">frontend-dashboard</p>
													<span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700 border border-orange-200">
														Building
													</span>
												</div>
												<div className="w-full bg-neutral-200 rounded-full h-1.5 mb-2">
													<div className="bg-orange-500 h-1.5 rounded-full animate-pulse" style={{ width: "45%" }} />
												</div>
												<p className="text-xs text-neutral-500 font-medium">Build #67 • 2m 8s • develop branch</p>
											</div>
										</div>
									</div>
								</>
							)}
						</div>
					</div>
				</TabsContent>

				<TabsContent value="pipelines">
					<div className="space-y-6">
						<SectionHeader title="CI/CD Pipelines" subtitle="Manage pipeline runs, environments and approvals" />
						<div className="rounded-xl border border-neutral-200/60 bg-white p-8 shadow-sm">
							<p className="text-neutral-600">Pipeline management interface would be implemented here with detailed pipeline views, logs, and controls.</p>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="projects">
					<div className="space-y-6">
						<SectionHeader title="Project Portfolio" subtitle="Repositories, ownership and activity" />
						<div className="rounded-xl border border-neutral-200/60 bg-white p-8 shadow-sm">
							<p className="text-neutral-600">Project management interface would be implemented here with project details, repositories, and team assignments.</p>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="testing">
					<div className="space-y-6">
						<SectionHeader title="Testing Hub" subtitle="Automated and manual test suites with coverage" />
						<div className="rounded-xl border border-neutral-200/60 bg-white p-8 shadow-sm">
							<p className="text-neutral-600">Comprehensive testing interface would be implemented here with test results, coverage reports, and automation controls.</p>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="quality">
					<div className="space-y-6">
						<SectionHeader title="Code Quality Analysis" subtitle="Static analysis, quality gates and technical debt" />
						<div className="rounded-xl border border-neutral-200/60 bg-white p-8 shadow-sm">
							<p className="text-neutral-600">Code quality dashboard would be implemented here with SonarQube integration, quality gates, and technical debt analysis.</p>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="releases">
					<div className="space-y-6">
						<SectionHeader title="Release Management" subtitle="Plans, approvals and progressive delivery" />
						<div className="rounded-xl border border-neutral-200/60 bg-white p-8 shadow-sm">
							<p className="text-neutral-600">Release management interface would be implemented here with release pipelines, environment promotion, and deployment tracking.</p>
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}