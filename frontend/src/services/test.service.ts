/**
 * Test Service
 * Handles all test-related API calls
 */

import { api } from '@/lib/api';

export interface TestSuite {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  type: 'UNIT' | 'INTEGRATION' | 'E2E' | 'PERFORMANCE' | 'SECURITY';
  framework: string;
  testFiles: string[];
  configuration: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    framework: string;
    language: string;
  };
  _count?: {
    testRuns: number;
  };
}

export interface TestRun {
  id: string;
  testSuiteId: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED';
  triggeredBy: string | null;
  environment: string;
  branch: string;
  startedAt: string;
  finishedAt: string | null;
  duration: number | null;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  coverage: number | null;
  results: any;
  metadata: any;
  errorMessage?: string | null;
  errorStack?: string | null;
  testSuite?: {
    name: string;
    type: string;
    project: {
      name: string;
    };
  };
  triggeredByUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateTestSuiteDto {
  name: string;
  description?: string;
  projectId: string;
  type: TestSuite['type'];
  framework?: string;
  testFiles?: string[];
  configuration?: any;
}

export interface UpdateTestSuiteDto {
  name?: string;
  description?: string;
  type?: TestSuite['type'];
  framework?: string;
  testFiles?: string[];
  configuration?: any;
  isActive?: boolean;
}

export interface RunTestDto {
  environment?: string;
  branch?: string;
  parameters?: any;
}

export class TestService {
  /**
   * Get all test suites
   */
  static async getTestSuites(
    projectId?: string,
    type?: string,
    isActive?: boolean
  ): Promise<TestSuite[]> {
    const response = await api.get<TestSuite[]>('/api/tests', {
      projectId,
      type,
      isActive,
    });
    return response.data!;
  }

  /**
   * Get test suite by ID
   */
  static async getTestSuiteById(id: string): Promise<TestSuite> {
    const response = await api.get<TestSuite>(`/api/tests/${id}`);
    return response.data!;
  }

  /**
   * Create test suite
   */
  static async createTestSuite(data: CreateTestSuiteDto): Promise<TestSuite> {
    const response = await api.post<TestSuite>('/api/tests', data);
    return response.data!;
  }

  /**
   * Update test suite
   */
  static async updateTestSuite(id: string, data: UpdateTestSuiteDto): Promise<TestSuite> {
    const response = await api.put<TestSuite>(`/api/tests/${id}`, data);
    return response.data!;
  }

  /**
   * Delete test suite
   */
  static async deleteTestSuite(id: string): Promise<void> {
    await api.delete(`/api/tests/${id}`);
  }

  /**
   * Run test suite
   */
  static async runTestSuite(id: string, data?: RunTestDto): Promise<TestRun> {
    const response = await api.post<TestRun>(`/api/tests/${id}/run`, data);
    return response.data!;
  }

  /**
   * Get test runs
   */
  static async getTestRuns(
    id: string,
    limit: number = 20,
    status?: string
  ): Promise<TestRun[]> {
    const response = await api.get<TestRun[]>(`/api/tests/${id}/runs`, {
      limit,
      status,
    });
    return response.data!;
  }

  /**
   * Get test run by ID
   */
  static async getTestRunById(runId: string): Promise<TestRun> {
    const response = await api.get<TestRun>(`/api/tests/runs/${runId}`);
    return response.data!;
  }

  /**
   * Cancel test run
   */
  static async cancelTestRun(runId: string): Promise<void> {
    await api.post(`/api/tests/runs/${runId}/cancel`);
  }

  /**
   * Generate tests using AI
   */
  static async generateTestsWithAI(data: GenerateTestsRequest): Promise<GenerateTestsResponse> {
    const response = await api.post<GenerateTestsResponse>('/api/ai/generate-tests', data);
    return response.data!;
  }

  /**
   * Analyze test failures using AI
   */
  static async analyzeFailures(data: AnalyzeFailuresRequest): Promise<AnalyzeFailuresResponse> {
    const response = await api.post<AnalyzeFailuresResponse>('/api/ai/analyze-failures', data);
    return response.data!;
  }
}

// AI Types
export interface GenerateTestsRequest {
  code: string;
  language: string;
  framework?: string;
  testType?: string;
  description?: string;
}

export interface GeneratedTest {
  fileName: string;
  testCode: string;
  description: string;
  framework: string;
}

export interface GenerateTestsResponse {
  tests: GeneratedTest[];
  totalTests: number;
  language: string;
  framework: string;
}

export interface AnalyzeFailuresRequest {
  testResults?: any;
  errorMessage?: string;
  stackTrace?: string;
}

export interface AnalyzeFailuresResponse {
  analysis: string;
  suggestedFixes: string[];
  rootCause: string;
  severity: string;
}
