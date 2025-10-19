import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { websocketService } from './websocketService';

const prisma = new PrismaClient();

// Test execution context
interface TestExecutionContext {
  testRunId: string;
  testSuiteId: string;
  projectId: string;
  repositoryUrl: string;
  branch: string;
  type: string;
  framework: string;
  testFiles: string[];
  configuration: any;
  environment: string;
  triggeredBy: string;
}

// Test result for individual test case
interface TestCaseResult {
  name: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  duration: number;
  error?: string;
  stackTrace?: string;
}

enum TestRunStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED'
}

/**
 * Test Executor Service
 * Handles execution of test suites with different frameworks and types
 */
export class TestExecutor extends EventEmitter {
  private activeExecutions: Set<string> = new Set();

  /**
   * Execute a test suite
   */
  public async executeTests(context: TestExecutionContext): Promise<void> {
    const { testRunId, testSuiteId, type, framework } = context;

    try {
      logger.info('Starting test execution', { testRunId, testSuiteId, type, framework });

      this.activeExecutions.add(testRunId);

      // Update test run status to RUNNING
      const startedRun = await prisma.testRun.update({
        where: { id: testRunId },
        data: {
          status: TestRunStatus.RUNNING,
          startedAt: new Date()
        },
        include: {
          testSuite: true
        }
      });

      this.emit('test:started', { testRunId, testSuiteId });

      // Broadcast test run started via WebSocket
      websocketService.broadcastTestRunUpdate(testSuiteId, {
        type: 'started',
        testRun: startedRun,
        timestamp: new Date().toISOString()
      });

      // Execute tests based on type
      let testResults: TestCaseResult[];

      switch (type) {
        case 'UNIT':
          testResults = await this.executeUnitTests(context);
          break;
        case 'INTEGRATION':
          testResults = await this.executeIntegrationTests(context);
          break;
        case 'E2E':
          testResults = await this.executeE2ETests(context);
          break;
        case 'PERFORMANCE':
          testResults = await this.executePerformanceTests(context);
          break;
        case 'SECURITY':
          testResults = await this.executeSecurityTests(context);
          break;
        default:
          throw new Error(`Unsupported test type: ${type}`);
      }

      // Check if execution was cancelled
      if (!this.activeExecutions.has(testRunId)) {
        logger.info('Test execution was cancelled', { testRunId });
        return;
      }

      // Calculate test statistics
      const totalTests = testResults.length;
      const passedTests = testResults.filter(r => r.status === 'PASSED').length;
      const failedTests = testResults.filter(r => r.status === 'FAILED').length;
      const skippedTests = testResults.filter(r => r.status === 'SKIPPED').length;
      const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);

      // Determine overall status
      const finalStatus = failedTests > 0
        ? TestRunStatus.FAILED
        : passedTests > 0
          ? TestRunStatus.PASSED
          : TestRunStatus.SKIPPED;

      // Update test run with results
      const completedRun = await prisma.testRun.update({
        where: { id: testRunId },
        data: {
          status: finalStatus,
          finishedAt: new Date(),
          duration: totalDuration,
          totalTests,
          passedTests,
          failedTests,
          skippedTests,
          results: JSON.stringify(testResults),
          coverage: this.calculateCoverage(testResults)
        },
        include: {
          testSuite: true
        }
      });

      this.emit('test:completed', {
        testRunId,
        testSuiteId,
        status: finalStatus,
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        duration: totalDuration
      });

      // Broadcast test run completed via WebSocket
      websocketService.broadcastTestRunUpdate(testSuiteId, {
        type: 'completed',
        testRun: completedRun,
        status: finalStatus,
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        duration: totalDuration,
        coverage: this.calculateCoverage(testResults),
        timestamp: new Date().toISOString()
      });

      logger.info('Test execution completed', {
        testRunId,
        status: finalStatus,
        totalTests,
        passedTests,
        failedTests,
        duration: totalDuration
      });

    } catch (error: any) {
      logger.error('Test execution error', { testRunId, error: error.message });

      const failedRun = await prisma.testRun.update({
        where: { id: testRunId },
        data: {
          status: TestRunStatus.FAILED,
          finishedAt: new Date(),
          errorMessage: error.message,
          errorStack: error.stack
        },
        include: {
          testSuite: true
        }
      });

      this.emit('test:failed', { testRunId, error: error.message });

      // Broadcast test run failed via WebSocket
      websocketService.broadcastTestRunUpdate(testSuiteId, {
        type: 'failed',
        testRun: failedRun,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      this.activeExecutions.delete(testRunId);
    }
  }

  /**
   * Execute unit tests
   */
  private async executeUnitTests(context: TestExecutionContext): Promise<TestCaseResult[]> {
    const { framework, testFiles, testRunId, testSuiteId } = context;

    logger.info('Executing unit tests', { framework, fileCount: testFiles.length });

    // Simulate test execution (in production, this would use actual test runners)
    const results: TestCaseResult[] = [];
    let completedTests = 0;

    for (const testFile of testFiles) {
      // Simulate running tests in each file
      const fileTests = this.generateTestCases(testFile, framework, 'unit');
      const totalTests = testFiles.reduce((sum, file) =>
        sum + this.generateTestCases(file, framework, 'unit').length, 0
      );

      for (const test of fileTests) {
        await this.delay(Math.random() * 500 + 200); // Simulate test execution time
        results.push(test);
        completedTests++;

        // Broadcast progress update every test
        const progress = Math.round((completedTests / totalTests) * 100);
        websocketService.broadcastTestRunUpdate(testSuiteId, {
          type: 'progress',
          testRunId,
          progress,
          completedTests,
          totalTests,
          currentTest: test.name,
          status: test.status,
          timestamp: new Date().toISOString()
        });
      }
    }

    return results;
  }

  /**
   * Execute integration tests
   */
  private async executeIntegrationTests(context: TestExecutionContext): Promise<TestCaseResult[]> {
    const { framework, testFiles, configuration } = context;

    logger.info('Executing integration tests', { framework, fileCount: testFiles.length });

    const results: TestCaseResult[] = [];

    for (const testFile of testFiles) {
      const fileTests = this.generateTestCases(testFile, framework, 'integration');

      for (const test of fileTests) {
        await this.delay(Math.random() * 1000 + 500); // Integration tests take longer
        results.push(test);
      }
    }

    return results;
  }

  /**
   * Execute E2E tests
   */
  private async executeE2ETests(context: TestExecutionContext): Promise<TestCaseResult[]> {
    const { framework, testFiles, configuration } = context;

    logger.info('Executing E2E tests', { framework, fileCount: testFiles.length });

    const results: TestCaseResult[] = [];

    for (const testFile of testFiles) {
      const fileTests = this.generateTestCases(testFile, framework, 'e2e');

      for (const test of fileTests) {
        await this.delay(Math.random() * 2000 + 1000); // E2E tests take the longest
        results.push(test);
      }
    }

    return results;
  }

  /**
   * Execute performance tests
   */
  private async executePerformanceTests(context: TestExecutionContext): Promise<TestCaseResult[]> {
    const { framework, testFiles, configuration } = context;

    logger.info('Executing performance tests', { framework, fileCount: testFiles.length });

    const results: TestCaseResult[] = [];

    for (const testFile of testFiles) {
      const fileTests = this.generateTestCases(testFile, framework, 'performance');

      for (const test of fileTests) {
        await this.delay(Math.random() * 1500 + 800);
        results.push(test);
      }
    }

    return results;
  }

  /**
   * Execute security tests
   */
  private async executeSecurityTests(context: TestExecutionContext): Promise<TestCaseResult[]> {
    const { framework, testFiles, configuration } = context;

    logger.info('Executing security tests', { framework, fileCount: testFiles.length });

    const results: TestCaseResult[] = [];

    for (const testFile of testFiles) {
      const fileTests = this.generateTestCases(testFile, framework, 'security');

      for (const test of fileTests) {
        await this.delay(Math.random() * 1200 + 600);
        results.push(test);
      }
    }

    return results;
  }

  /**
   * Generate simulated test cases for a file
   */
  private generateTestCases(
    testFile: string,
    framework: string,
    type: string
  ): TestCaseResult[] {
    const testCount = Math.floor(Math.random() * 10) + 5; // 5-15 tests per file
    const results: TestCaseResult[] = [];

    for (let i = 0; i < testCount; i++) {
      const status = this.getRandomTestStatus();
      const duration = Math.random() * 1000 + 100;

      const testCase: TestCaseResult = {
        name: `${testFile} - ${type} test case ${i + 1}`,
        status,
        duration
      };

      // Add error details for failed tests
      if (status === 'FAILED') {
        testCase.error = this.getRandomError(type);
        testCase.stackTrace = this.generateStackTrace(testFile, i + 1);
      }

      results.push(testCase);
    }

    return results;
  }

  /**
   * Get random test status (weighted towards PASSED)
   */
  private getRandomTestStatus(): 'PASSED' | 'FAILED' | 'SKIPPED' {
    const rand = Math.random();
    if (rand < 0.80) return 'PASSED';  // 80% pass
    if (rand < 0.95) return 'FAILED';  // 15% fail
    return 'SKIPPED';                  // 5% skipped
  }

  /**
   * Get random error message based on test type
   */
  private getRandomError(type: string): string {
    const errors: Record<string, string[]> = {
      unit: [
        'Expected value to be defined but received undefined',
        'Assertion failed: expected true to equal false',
        'TypeError: Cannot read property of undefined',
        'ReferenceError: variable is not defined'
      ],
      integration: [
        'Database connection timeout',
        'API endpoint returned 500 Internal Server Error',
        'Authentication failed: invalid token',
        'Service dependency unavailable'
      ],
      e2e: [
        'Element not found: button[data-testid="submit"]',
        'Page load timeout exceeded',
        'Navigation failed: ERR_CONNECTION_REFUSED',
        'Screenshot comparison failed: 5% difference detected'
      ],
      performance: [
        'Response time exceeded threshold: 2500ms > 2000ms',
        'Memory usage exceeded limit: 512MB > 256MB',
        'Throughput below target: 50 req/s < 100 req/s',
        'CPU usage above threshold: 85% > 80%'
      ],
      security: [
        'SQL injection vulnerability detected in user input',
        'XSS vulnerability found in comment field',
        'Insecure dependency: lodash@4.17.15 (CVE-2020-8203)',
        'Weak password policy: minimum length not enforced'
      ]
    };

    const typeErrors = errors[type] || errors.unit;
    return typeErrors[Math.floor(Math.random() * typeErrors.length)];
  }

  /**
   * Generate stack trace for failed tests
   */
  private generateStackTrace(testFile: string, lineNumber: number): string {
    return `Error: Test failed
    at Object.<anonymous> (${testFile}:${lineNumber}:${Math.floor(Math.random() * 50) + 1})
    at processImmediate (internal/timers.js:461:21)
    at processTicksAndRejections (internal/process/task_queues.js:82:9)`;
  }

  /**
   * Calculate code coverage (simulated)
   */
  private calculateCoverage(results: TestCaseResult[]): number {
    const passRate = results.filter(r => r.status === 'PASSED').length / results.length;
    // Simulate coverage based on pass rate (in production, use actual coverage tools)
    return Math.min(Math.round(passRate * 100 * (0.8 + Math.random() * 0.2)), 100);
  }

  /**
   * Cancel a running test execution
   */
  public cancelTest(testRunId: string): void {
    if (this.activeExecutions.has(testRunId)) {
      this.activeExecutions.delete(testRunId);

      prisma.testRun.update({
        where: { id: testRunId },
        data: {
          status: TestRunStatus.SKIPPED,
          finishedAt: new Date(),
          errorMessage: 'Test execution cancelled by user'
        }
      }).then(() => {
        logger.info('Test execution cancelled', { testRunId });
        this.emit('test:cancelled', { testRunId });
      }).catch(error => {
        logger.error('Error updating cancelled test run', { testRunId, error: error.message });
      });
    }
  }

  /**
   * Check if a test is currently running
   */
  public isTestRunning(testRunId: string): boolean {
    return this.activeExecutions.has(testRunId);
  }

  /**
   * Get all active test executions
   */
  public getActiveExecutions(): string[] {
    return Array.from(this.activeExecutions);
  }

  /**
   * Utility: Delay for simulating async operations
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
const testExecutor = new TestExecutor();
export default testExecutor;
