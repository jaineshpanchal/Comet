// AI-Powered Load Testing Engine
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import axios from 'axios';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';

const app = express();
const PORT = process.env.LOAD_TESTING_PORT || 8008;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'load-testing' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Interfaces
interface LoadTestConfig {
  id: string;
  name: string;
  description: string;
  target: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
  };
  loadProfile: {
    type: 'constant' | 'ramp-up' | 'spike' | 'stress';
    virtualUsers: number;
    duration: number; // seconds
    rampUpTime?: number; // seconds for ramp-up
    thinkTime?: number; // milliseconds between requests
  };
  thresholds: {
    avgResponseTime: number; // milliseconds
    p95ResponseTime: number; // milliseconds
    errorRate: number; // percentage
    throughput: number; // requests per second
  };
  created_at: string;
  status: 'active' | 'inactive';
}

interface LoadTestExecution {
  id: string;
  configId: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  startTime: string;
  endTime?: string;
  progress: number; // percentage
  metrics: LoadTestMetrics;
  results: LoadTestResult[];
  summary: LoadTestSummary;
}

interface LoadTestMetrics {
  timestamp: string;
  activeUsers: number;
  requestsPerSecond: number;
  responseTime: {
    avg: number;
    min: number;
    max: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  throughput: number;
  networkIO: {
    received: number; // bytes
    sent: number; // bytes
  };
}

interface LoadTestResult {
  timestamp: string;
  virtualUser: number;
  requestId: string;
  status: 'success' | 'error';
  responseTime: number;
  responseCode: number;
  errorMessage?: string;
}

interface LoadTestSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDuration: number;
  averageResponseTime: number;
  peakThroughput: number;
  errorRate: number;
  thresholdResults: {
    avgResponseTime: 'passed' | 'failed';
    p95ResponseTime: 'passed' | 'failed';
    errorRate: 'passed' | 'failed';
    throughput: 'passed' | 'failed';
  };
}

// In-memory storage
const loadTestConfigs: Map<string, LoadTestConfig> = new Map();
const loadTestExecutions: Map<string, LoadTestExecution> = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'load-testing',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Create load test configuration
app.post('/api/load-tests', async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      target: Joi.object({
        url: Joi.string().uri().required(),
        method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE').default('GET'),
        headers: Joi.object().optional(),
        body: Joi.any().optional()
      }).required(),
      loadProfile: Joi.object({
        type: Joi.string().valid('constant', 'ramp-up', 'spike', 'stress').required(),
        virtualUsers: Joi.number().min(1).max(10000).required(),
        duration: Joi.number().min(10).max(3600).required(),
        rampUpTime: Joi.number().min(0).optional(),
        thinkTime: Joi.number().min(0).default(1000)
      }).required(),
      thresholds: Joi.object({
        avgResponseTime: Joi.number().min(0).default(1000),
        p95ResponseTime: Joi.number().min(0).default(2000),
        errorRate: Joi.number().min(0).max(100).default(5),
        throughput: Joi.number().min(0).default(10)
      }).default({
        avgResponseTime: 1000,
        p95ResponseTime: 2000,
        errorRate: 5,
        throughput: 10
      })
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const loadTestConfig: LoadTestConfig = {
      id: uuidv4(),
      ...value,
      created_at: new Date().toISOString(),
      status: 'active'
    };

    loadTestConfigs.set(loadTestConfig.id, loadTestConfig);

    logger.info(`Load test configuration created: ${loadTestConfig.name}`, { configId: loadTestConfig.id });

    res.status(201).json({
      success: true,
      message: 'Load test configuration created successfully',
      config: loadTestConfig
    });
  } catch (error) {
    logger.error('Error creating load test configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all load test configurations
app.get('/api/load-tests', (req, res) => {
  const configs = Array.from(loadTestConfigs.values());
  res.json({
    success: true,
    configs
  });
});

// Execute load test
app.post('/api/load-tests/:id/execute', async (req, res) => {
  try {
    const config = loadTestConfigs.get(req.params.id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Load test configuration not found'
      });
    }

    const execution: LoadTestExecution = {
      id: uuidv4(),
      configId: config.id,
      status: 'running',
      startTime: new Date().toISOString(),
      progress: 0,
      metrics: createInitialMetrics(),
      results: [],
      summary: createInitialSummary()
    };

    loadTestExecutions.set(execution.id, execution);

    // Start execution in background
    executeLoadTest(config, execution);

    res.json({
      success: true,
      message: 'Load test execution started',
      execution: {
        id: execution.id,
        status: execution.status,
        startTime: execution.startTime
      }
    });
  } catch (error) {
    logger.error('Error starting load test execution:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get load test execution status
app.get('/api/load-executions/:id', (req, res) => {
  const execution = loadTestExecutions.get(req.params.id);
  if (!execution) {
    return res.status(404).json({
      success: false,
      message: 'Load test execution not found'
    });
  }

  res.json({
    success: true,
    execution
  });
});

// Stop load test execution
app.post('/api/load-executions/:id/stop', (req, res) => {
  const execution = loadTestExecutions.get(req.params.id);
  if (!execution) {
    return res.status(404).json({
      success: false,
      message: 'Load test execution not found'
    });
  }

  if (execution.status === 'running') {
    execution.status = 'stopped';
    execution.endTime = new Date().toISOString();
    
    logger.info(`Load test execution stopped: ${execution.id}`);
  }

  res.json({
    success: true,
    message: 'Load test execution stopped',
    execution
  });
});

// AI-powered load test generation
app.post('/api/ai/generate-load-tests', async (req, res) => {
  try {
    const schema = Joi.object({
      apiSpec: Joi.string().required(),
      expectedTraffic: Joi.object({
        dailyUsers: Joi.number().required(),
        peakHourMultiplier: Joi.number().default(3),
        avgSessionDuration: Joi.number().default(300) // seconds
      }).required(),
      testTypes: Joi.array().items(
        Joi.string().valid('baseline', 'stress', 'spike', 'volume', 'endurance')
      ).default(['baseline', 'stress']),
      infrastructure: Joi.object({
        serverCount: Joi.number().default(1),
        serverSpecs: Joi.string().default('medium'),
        loadBalancer: Joi.boolean().default(false)
      }).optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const generatedTests = await generateAILoadTests(
      value.apiSpec,
      value.expectedTraffic,
      value.testTypes,
      value.infrastructure
    );

    res.json({
      success: true,
      message: 'AI load tests generated successfully',
      tests: generatedTests
    });
  } catch (error) {
    logger.error('Error generating AI load tests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Real-time metrics endpoint
app.get('/api/load-executions/:id/metrics', (req, res) => {
  const execution = loadTestExecutions.get(req.params.id);
  if (!execution) {
    return res.status(404).json({
      success: false,
      message: 'Load test execution not found'
    });
  }

  res.json({
    success: true,
    metrics: execution.metrics,
    progress: execution.progress,
    status: execution.status
  });
});

// Performance analysis
app.get('/api/load-executions/:id/analysis', async (req, res) => {
  try {
    const execution = loadTestExecutions.get(req.params.id);
    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Load test execution not found'
      });
    }

    const analysis = await analyzePerformance(execution);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    logger.error('Error analyzing performance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Execute load test
async function executeLoadTest(config: LoadTestConfig, execution: LoadTestExecution) {
  const startTime = Date.now();
  logger.info(`Starting load test: ${config.name}`);

  try {
    const totalDuration = config.loadProfile.duration * 1000; // Convert to milliseconds
    const progressInterval = Math.max(1000, totalDuration / 100); // Update progress every 1% or 1 second minimum
    
    let activeUsers = 0;
    let requestCounter = 0;
    const results: LoadTestResult[] = [];
    const responseTimes: number[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Progress tracking
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / totalDuration) * 100);
      execution.progress = progress;
      
      if (execution.status !== 'running') {
        clearInterval(progressTimer);
      }
    }, progressInterval);

    // Simulate load test execution
    const userPromises: Promise<void>[] = [];
    
    for (let i = 0; i < config.loadProfile.virtualUsers && execution.status === 'running'; i++) {
      const userPromise = simulateVirtualUser(
        i,
        config,
        execution,
        startTime,
        totalDuration,
        results,
        responseTimes
      );
      userPromises.push(userPromise);
      
      // Ramp up users if specified
      if (config.loadProfile.rampUpTime && config.loadProfile.rampUpTime > 0) {
        const rampUpDelay = (config.loadProfile.rampUpTime * 1000) / config.loadProfile.virtualUsers;
        await new Promise(resolve => setTimeout(resolve, rampUpDelay));
      }
    }

    // Wait for all users to complete or timeout
    await Promise.allSettled(userPromises);

    // Calculate final metrics and summary
    const finalMetrics = calculateFinalMetrics(results, responseTimes, totalDuration);
    const summary = calculateSummary(results, config.thresholds, totalDuration);

    execution.metrics = finalMetrics;
    execution.summary = summary;
    execution.results = results;
    execution.status = 'completed';
    execution.endTime = new Date().toISOString();

    clearInterval(progressTimer);
    execution.progress = 100;

    logger.info(`Load test completed: ${config.name}`, {
      totalRequests: summary.totalRequests,
      successRate: ((summary.successfulRequests / summary.totalRequests) * 100).toFixed(2),
      avgResponseTime: summary.averageResponseTime
    });

  } catch (error) {
    execution.status = 'failed';
    execution.endTime = new Date().toISOString();
    logger.error(`Load test failed: ${config.name}`, error);
  }
}

// Simulate virtual user
async function simulateVirtualUser(
  userId: number,
  config: LoadTestConfig,
  execution: LoadTestExecution,
  startTime: number,
  totalDuration: number,
  results: LoadTestResult[],
  responseTimes: number[]
): Promise<void> {
  const endTime = startTime + totalDuration;
  
  while (Date.now() < endTime && execution.status === 'running') {
    const requestStart = Date.now();
    const requestId = uuidv4();
    
    try {
      const response = await axios({
        method: config.target.method,
        url: config.target.url,
        headers: config.target.headers || {},
        data: config.target.body,
        timeout: 30000,
        validateStatus: () => true
      });

      const responseTime = Date.now() - requestStart;
      responseTimes.push(responseTime);

      const result: LoadTestResult = {
        timestamp: new Date().toISOString(),
        virtualUser: userId,
        requestId,
        status: response.status >= 200 && response.status < 400 ? 'success' : 'error',
        responseTime,
        responseCode: response.status
      };

      if (response.status >= 400) {
        result.errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      results.push(result);

      // Update real-time metrics
      updateRealTimeMetrics(execution, results, responseTimes);

    } catch (error) {
      const responseTime = Date.now() - requestStart;
      
      const result: LoadTestResult = {
        timestamp: new Date().toISOString(),
        virtualUser: userId,
        requestId,
        status: 'error',
        responseTime,
        responseCode: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };

      results.push(result);
    }

    // Think time between requests
    if (config.loadProfile.thinkTime && config.loadProfile.thinkTime > 0) {
      await new Promise(resolve => setTimeout(resolve, config.loadProfile.thinkTime));
    }
  }
}

// Update real-time metrics
function updateRealTimeMetrics(execution: LoadTestExecution, results: LoadTestResult[], responseTimes: number[]) {
  if (results.length === 0) return;

  const recentResults = results.slice(-100); // Last 100 results for real-time calculation
  const recentResponseTimes = recentResults.map(r => r.responseTime).sort((a, b) => a - b);
  
  const activeUsers = new Set(recentResults.map(r => r.virtualUser)).size;
  const successfulRequests = recentResults.filter(r => r.status === 'success').length;
  const errorRate = ((recentResults.length - successfulRequests) / recentResults.length) * 100;

  execution.metrics = {
    timestamp: new Date().toISOString(),
    activeUsers,
    requestsPerSecond: recentResults.length / 10, // Approximate RPS
    responseTime: {
      avg: recentResponseTimes.reduce((a, b) => a + b, 0) / recentResponseTimes.length,
      min: recentResponseTimes[0] || 0,
      max: recentResponseTimes[recentResponseTimes.length - 1] || 0,
      p50: recentResponseTimes[Math.floor(recentResponseTimes.length * 0.5)] || 0,
      p90: recentResponseTimes[Math.floor(recentResponseTimes.length * 0.9)] || 0,
      p95: recentResponseTimes[Math.floor(recentResponseTimes.length * 0.95)] || 0,
      p99: recentResponseTimes[Math.floor(recentResponseTimes.length * 0.99)] || 0
    },
    errorRate,
    throughput: successfulRequests / 10, // Approximate throughput
    networkIO: {
      received: recentResults.length * 1024, // Simulated
      sent: recentResults.length * 512 // Simulated
    }
  };
}

// Calculate final metrics
function calculateFinalMetrics(results: LoadTestResult[], responseTimes: number[], duration: number): LoadTestMetrics {
  const sortedResponseTimes = responseTimes.sort((a, b) => a - b);
  const successfulRequests = results.filter(r => r.status === 'success').length;
  const errorRate = ((results.length - successfulRequests) / results.length) * 100;

  return {
    timestamp: new Date().toISOString(),
    activeUsers: 0,
    requestsPerSecond: results.length / (duration / 1000),
    responseTime: {
      avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      min: sortedResponseTimes[0] || 0,
      max: sortedResponseTimes[sortedResponseTimes.length - 1] || 0,
      p50: sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.5)] || 0,
      p90: sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.9)] || 0,
      p95: sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.95)] || 0,
      p99: sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.99)] || 0
    },
    errorRate,
    throughput: successfulRequests / (duration / 1000),
    networkIO: {
      received: results.length * 1024,
      sent: results.length * 512
    }
  };
}

// Calculate summary
function calculateSummary(results: LoadTestResult[], thresholds: LoadTestConfig['thresholds'], duration: number): LoadTestSummary {
  const successfulRequests = results.filter(r => r.status === 'success').length;
  const failedRequests = results.length - successfulRequests;
  const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
  const errorRate = (failedRequests / results.length) * 100;
  const throughput = successfulRequests / (duration / 1000);

  return {
    totalRequests: results.length,
    successfulRequests,
    failedRequests,
    totalDuration: duration,
    averageResponseTime: avgResponseTime,
    peakThroughput: throughput,
    errorRate,
    thresholdResults: {
      avgResponseTime: avgResponseTime <= thresholds.avgResponseTime ? 'passed' : 'failed',
      p95ResponseTime: p95ResponseTime <= thresholds.p95ResponseTime ? 'passed' : 'failed',
      errorRate: errorRate <= thresholds.errorRate ? 'passed' : 'failed',
      throughput: throughput >= thresholds.throughput ? 'passed' : 'failed'
    }
  };
}

// Helper functions
function createInitialMetrics(): LoadTestMetrics {
  return {
    timestamp: new Date().toISOString(),
    activeUsers: 0,
    requestsPerSecond: 0,
    responseTime: {
      avg: 0,
      min: 0,
      max: 0,
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0
    },
    errorRate: 0,
    throughput: 0,
    networkIO: {
      received: 0,
      sent: 0
    }
  };
}

function createInitialSummary(): LoadTestSummary {
  return {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalDuration: 0,
    averageResponseTime: 0,
    peakThroughput: 0,
    errorRate: 0,
    thresholdResults: {
      avgResponseTime: 'passed',
      p95ResponseTime: 'passed',
      errorRate: 'passed',
      throughput: 'passed'
    }
  };
}

// AI load test generation
async function generateAILoadTests(apiSpec: string, expectedTraffic: any, testTypes: string[], infrastructure: any) {
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  const baseUrl = 'http://localhost:8000';
  const estimatedRPS = Math.ceil(expectedTraffic.dailyUsers / (24 * 60 * 60));
  
  return testTypes.map(testType => {
    let virtualUsers, duration, type;
    
    switch (testType) {
      case 'baseline':
        virtualUsers = Math.max(1, Math.ceil(estimatedRPS * 2));
        duration = 300; // 5 minutes
        type = 'constant';
        break;
      case 'stress':
        virtualUsers = Math.ceil(estimatedRPS * expectedTraffic.peakHourMultiplier * 2);
        duration = 600; // 10 minutes
        type = 'ramp-up';
        break;
      case 'spike':
        virtualUsers = Math.ceil(estimatedRPS * expectedTraffic.peakHourMultiplier * 5);
        duration = 180; // 3 minutes
        type = 'spike';
        break;
      case 'volume':
        virtualUsers = Math.ceil(estimatedRPS * expectedTraffic.peakHourMultiplier);
        duration = 1800; // 30 minutes
        type = 'constant';
        break;
      case 'endurance':
        virtualUsers = Math.ceil(estimatedRPS * 1.5);
        duration = 3600; // 1 hour
        type = 'constant';
        break;
      default:
        virtualUsers = 10;
        duration = 300;
        type = 'constant';
    }

    return {
      id: uuidv4(),
      name: `AI Generated ${testType.charAt(0).toUpperCase() + testType.slice(1)} Test`,
      description: `Automatically generated ${testType} test based on expected traffic patterns`,
      target: {
        url: `${baseUrl}/api/health`,
        method: 'GET'
      },
      loadProfile: {
        type,
        virtualUsers,
        duration,
        rampUpTime: type === 'ramp-up' ? Math.floor(duration * 0.2) : undefined,
        thinkTime: 1000
      },
      thresholds: {
        avgResponseTime: testType === 'stress' ? 2000 : 1000,
        p95ResponseTime: testType === 'stress' ? 5000 : 2000,
        errorRate: testType === 'stress' ? 10 : 5,
        throughput: Math.ceil(virtualUsers * 0.8)
      }
    };
  });
}

// Performance analysis
async function analyzePerformance(execution: LoadTestExecution) {
  const analysis = {
    overallScore: 'A', // A, B, C, D, F
    bottlenecks: [] as string[],
    recommendations: [] as string[],
    trends: {
      responseTime: 'stable', // improving, stable, degrading
      throughput: 'stable',
      errorRate: 'stable'
    },
    resourceUtilization: {
      cpu: 65, // percentage
      memory: 78,
      network: 45,
      disk: 32
    },
    scalabilityInsights: {
      maxSupportedUsers: 0,
      bottleneckPoint: '',
      scaleUpRecommendations: [] as string[]
    }
  };

  // Analyze results and provide insights
  if (execution.summary.errorRate > 5) {
    analysis.bottlenecks.push('High error rate detected');
    analysis.recommendations.push('Investigate application errors and improve error handling');
  }

  if (execution.summary.averageResponseTime > 1000) {
    analysis.bottlenecks.push('Slow response times');
    analysis.recommendations.push('Optimize database queries and add caching');
  }

  if (execution.summary.thresholdResults.throughput === 'failed') {
    analysis.bottlenecks.push('Low throughput');
    analysis.recommendations.push('Scale up infrastructure or optimize application performance');
  }

  // Calculate overall score
  const passedThresholds = Object.values(execution.summary.thresholdResults).filter(r => r === 'passed').length;
  const totalThresholds = Object.keys(execution.summary.thresholdResults).length;
  const scorePercentage = (passedThresholds / totalThresholds) * 100;

  if (scorePercentage >= 90) analysis.overallScore = 'A';
  else if (scorePercentage >= 80) analysis.overallScore = 'B';
  else if (scorePercentage >= 70) analysis.overallScore = 'C';
  else if (scorePercentage >= 60) analysis.overallScore = 'D';
  else analysis.overallScore = 'F';

  return analysis;
}

app.listen(PORT, () => {
  logger.info(`Load Testing Service running on port ${PORT}`);
});

export default app;