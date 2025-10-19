"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeftIcon,
  BeakerIcon,
  ChartPieIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Test {
  id: string;
  name: string;
  createdAt: string;
}

interface TestRun {
  id: string;
  status: "SUCCESS" | "FAILED" | "IN_PROGRESS" | "PENDING";
  passRate: number;
  duration: number;
  createdAt: string;
  completedAt: string;
  _count?: {
    tests: number;
  };
}

interface TestSuiteDetails {
  id: string;
  name: string;
  description: string | null;
  type: string;
  project: {
    id: string;
    name: string;
  };
  runs: TestRun[];
  tests: Test[];
}

export default function TestSuiteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [suite, setSuite] = useState<TestSuiteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuiteDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("comet_jwt");
      const response = await fetch(`http://localhost:8000/api/test-suites/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSuite(data.data);
      } else {
        setError(data.message || "Failed to load test suite details.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSuiteDetails();
  }, [fetchSuiteDetails]);

  const runTestSuite = async () => {
    // This would ideally show a toast and update via WebSocket
    await fetch(`http://localhost:8000/api/test-suites/${id}/run`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("comet_jwt")}` },
    });
    fetchSuiteDetails(); // Re-fetch for now
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!suite) {
    return <div className="p-8">Test suite not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/testing")}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to All Test Suites
          </button>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-5xl font-bold text-gray-900 tracking-tight">{suite.name}</h1>
                <Badge variant="outline" className="text-sm">{suite.type}</Badge>
              </div>
              <p className="text-lg text-gray-600 mt-2">{suite.description}</p>
            </div>
            <Button onClick={runTestSuite} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <PlayIcon className="w-5 h-5" />
              Run Suite
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="runs" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview"><ChartPieIcon className="w-5 h-5 mr-2"/>Overview</TabsTrigger>
            <TabsTrigger value="runs"><BeakerIcon className="w-5 h-5 mr-2"/>Run History</TabsTrigger>
            <TabsTrigger value="tests"><DocumentTextIcon className="w-5 h-5 mr-2"/>Tests ({suite.tests.length})</TabsTrigger>
            <TabsTrigger value="settings"><Cog6ToothIcon className="w-5 h-5 mr-2"/>Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardHeader><CardTitle>Suite Overview</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700">Total Runs</h4>
                  <p className="text-3xl font-bold">{suite.runs.length}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700">Tests in Suite</h4>
                  <p className="text-3xl font-bold">{suite.tests.length}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700">Project</h4>
                  <p className="text-xl font-semibold text-blue-600">{suite.project.name}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Run History Tab */}
          <TabsContent value="runs">
            <Card>
              <CardHeader><CardTitle>Run History</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead className="text-left text-sm text-gray-500">
                    <tr>
                      <th className="p-2">Status</th>
                      <th className="p-2">Run ID</th>
                      <th className="p-2">Pass Rate</th>
                      <th className="p-2">Duration</th>
                      <th className="p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suite.runs.map(run => (
                      <tr key={run.id} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="p-3">
                          <span className="flex items-center gap-2">
                            {run.status === 'SUCCESS' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                            {run.status === 'FAILED' && <XCircleIcon className="w-5 h-5 text-red-500" />}
                            {run.status === 'IN_PROGRESS' && <ClockIcon className="w-5 h-5 text-blue-500 animate-spin" />}
                            <span className="font-medium">{run.status}</span>
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs text-gray-600">{run.id.split('-')[0]}...</td>
                        <td className="p-3">
                          <span className={`font-semibold ${run.passRate > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {run.passRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3">{formatDuration(run.duration)}</td>
                        <td className="p-3 text-sm text-gray-600">{new Date(run.completedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {suite.runs.length === 0 && <p className="text-center text-gray-500 py-8">No runs found for this suite.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests">
            <Card>
              <CardHeader><CardTitle>Tests</CardTitle><CardDescription>List of all test cases in this suite.</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suite.tests.map(test => (
                    <div key={test.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <p className="font-medium text-gray-800">{test.name}</p>
                      <p className="text-sm text-gray-500">Added: {new Date(test.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
                {suite.tests.length === 0 && <p className="text-center text-gray-500 py-8">No tests have been added to this suite yet.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Suite Settings</CardTitle>
                <CardDescription>Manage this test suite's configuration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg">Edit Suite</h4>
                  <p className="text-gray-600">Editing functionality is not yet implemented.</p>
                  <Button variant="outline" className="mt-2" disabled>Edit Details</Button>
                </div>
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-lg text-red-600">Danger Zone</h4>
                  <div className="p-4 border border-red-200 bg-red-50 rounded-lg mt-2 flex items-center justify-between">
                    <div>
                      <p className="font-bold">Delete this test suite</p>
                      <p className="text-sm text-red-700">Once deleted, this action cannot be undone.</p>
                    </div>
                    <Button variant="destructive" disabled>Delete Suite</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}