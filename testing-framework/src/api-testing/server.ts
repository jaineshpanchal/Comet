// AI-Powered API Testing Engine
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import axios from 'axios';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import Table from 'cli-table3';

const app = express();
const PORT = process.env.API_TESTING_PORT || 8006;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-testing' },
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

// Test Suite Interface
interface TestSuite {
  id: string;
  name: string;
  description: string;
  endpoints: ApiEndpoint[];
  created_at: string;
  status: 'active' | 'inactive';
}

interface ApiEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  expectedStatus: number;
  expectedResponse?: any;
  validationRules?: any;
}

interface TestExecution {
  id: string;
  suiteId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
}

interface TestResult {
  endpointId: string;
  name: string;
  status: 'passed' | 'failed';
  duration: number;
  actualStatus: number;
  expectedStatus: number;
  response?: any;
  error?: string;
  validationErrors?: string[];
}

// In-memory storage (replace with database in production)
const testSuites: Map<string, TestSuite> = new Map();
const testExecutions: Map<string, TestExecution> = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-testing',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Create test suite
app.post('/api/test-suites', async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      endpoints: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').required(),
        url: Joi.string().uri().required(),
        headers: Joi.object().optional(),
        body: Joi.any().optional(),
        expectedStatus: Joi.number().required(),
        expectedResponse: Joi.any().optional(),
        validationRules: Joi.any().optional()
      })).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const testSuite: TestSuite = {
      id: uuidv4(),
      name: value.name,
      description: value.description,
      endpoints: value.endpoints.map((endpoint: any) => ({
        id: uuidv4(),
        ...endpoint
      })),
      created_at: new Date().toISOString(),
      status: 'active'
    };

    testSuites.set(testSuite.id, testSuite);

    logger.info(`Test suite created: ${testSuite.name}`, { suiteId: testSuite.id });

    res.status(201).json({
      success: true,
      message: 'Test suite created successfully',
      testSuite
    });
  } catch (error) {
    logger.error('Error creating test suite:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all test suites
app.get('/api/test-suites', (req, res) => {
  const suites = Array.from(testSuites.values());
  res.json({
    success: true,
    testSuites: suites
  });
});

// Get test suite by ID
app.get('/api/test-suites/:id', (req, res) => {
  const testSuite = testSuites.get(req.params.id);
  if (!testSuite) {
    return res.status(404).json({
      success: false,
      message: 'Test suite not found'
    });
  }

  res.json({
    success: true,
    testSuite
  });
});

// Execute test suite
app.post('/api/test-suites/:id/execute', async (req, res) => {
  try {
    const testSuite = testSuites.get(req.params.id);
    if (!testSuite) {
      return res.status(404).json({
        success: false,
        message: 'Test suite not found'
      });
    }

    const execution: TestExecution = {
      id: uuidv4(),
      suiteId: testSuite.id,
      status: 'running',
      startTime: new Date().toISOString(),
      results: [],
      summary: {
        total: testSuite.endpoints.length,
        passed: 0,
        failed: 0,
        duration: 0
      }
    };

    testExecutions.set(execution.id, execution);

    // Start execution in background
    executeTestSuite(testSuite, execution);

    res.json({
      success: true,
      message: 'Test execution started',
      execution: {
        id: execution.id,
        status: execution.status,
        startTime: execution.startTime
      }
    });
  } catch (error) {
    logger.error('Error starting test execution:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get test execution results
app.get('/api/executions/:id', (req, res) => {
  const execution = testExecutions.get(req.params.id);
  if (!execution) {
    return res.status(404).json({
      success: false,
      message: 'Test execution not found'
    });
  }

  res.json({
    success: true,
    execution
  });
});

// AI-powered test generation
app.post('/api/ai/generate-tests', async (req, res) => {
  try {
    const schema = Joi.object({
      apiSpec: Joi.string().required(), // OpenAPI spec or endpoint description
      testType: Joi.string().valid('smoke', 'regression', 'load', 'security').default('regression'),
      coverage: Joi.string().valid('basic', 'comprehensive', 'exhaustive').default('comprehensive')
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Simulate AI test generation (replace with actual AI integration)
    const generatedTests = await generateAITests(value.apiSpec, value.testType, value.coverage);

    res.json({
      success: true,
      message: 'AI tests generated successfully',
      generatedTests
    });
  } catch (error) {
    logger.error('Error generating AI tests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Smart test data generation
app.post('/api/ai/generate-data', async (req, res) => {
  try {
    const schema = Joi.object({
      schema: Joi.object().required(), // JSON schema for data generation
      count: Joi.number().min(1).max(1000).default(10),
      type: Joi.string().valid('valid', 'invalid', 'edge-cases', 'mixed').default('valid')
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const generatedData = await generateTestData(value.schema, value.count, value.type);

    res.json({
      success: true,
      message: 'Test data generated successfully',
      data: generatedData
    });
  } catch (error) {
    logger.error('Error generating test data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Execute individual test suite
async function executeTestSuite(testSuite: TestSuite, execution: TestExecution) {
  const startTime = Date.now();
  logger.info(`Starting test execution for suite: ${testSuite.name}`);

  try {
    for (const endpoint of testSuite.endpoints) {
      const result = await executeApiTest(endpoint);
      execution.results.push(result);
      
      if (result.status === 'passed') {
        execution.summary.passed++;
      } else {
        execution.summary.failed++;
      }
    }

    execution.status = 'completed';
    execution.endTime = new Date().toISOString();
    execution.summary.duration = Date.now() - startTime;

    logger.info(`Test execution completed for suite: ${testSuite.name}`, {
      total: execution.summary.total,
      passed: execution.summary.passed,
      failed: execution.summary.failed,
      duration: execution.summary.duration
    });
  } catch (error) {
    execution.status = 'failed';
    execution.endTime = new Date().toISOString();
    execution.summary.duration = Date.now() - startTime;
    logger.error(`Test execution failed for suite: ${testSuite.name}`, error);
  }
}

// Execute individual API test
async function executeApiTest(endpoint: ApiEndpoint): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const response = await axios({
      method: endpoint.method,
      url: endpoint.url,
      headers: endpoint.headers || {},
      data: endpoint.body,
      timeout: 30000,
      validateStatus: () => true // Don't throw on HTTP error status
    });

    const duration = Date.now() - startTime;
    const validationErrors = validateResponse(response.data, endpoint.expectedResponse, endpoint.validationRules);

    const result: TestResult = {
      endpointId: endpoint.id,
      name: endpoint.name,
      status: response.status === endpoint.expectedStatus && validationErrors.length === 0 ? 'passed' : 'failed',
      duration,
      actualStatus: response.status,
      expectedStatus: endpoint.expectedStatus,
      response: response.data,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined
    };

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      endpointId: endpoint.id,
      name: endpoint.name,
      status: 'failed',
      duration,
      actualStatus: 0,
      expectedStatus: endpoint.expectedStatus,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Validate API response
function validateResponse(actual: any, expected: any, rules: any): string[] {
  const errors: string[] = [];
  
  if (expected && JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push('Response body does not match expected value');
  }
  
  // Add more validation logic based on rules
  if (rules) {
    // Implement custom validation rules
  }
  
  return errors;
}

// AI test generation simulation
async function generateAITests(apiSpec: string, testType: string, coverage: string) {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    testSuite: {
      name: `AI Generated ${testType} Tests`,
      description: `Automatically generated ${testType} tests with ${coverage} coverage`,
      endpoints: [
        {
          name: 'Health Check Test',
          method: 'GET',
          url: 'http://localhost:8000/api/health',
          expectedStatus: 200,
          validationRules: {
            requiredFields: ['status', 'timestamp']
          }
        },
        {
          name: 'Authentication Test',
          method: 'POST',
          url: 'http://localhost:8000/api/auth/login',
          body: {
            email: 'test@example.com',
            password: 'testpassword'
          },
          expectedStatus: 200
        }
      ]
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      aiModel: 'GPT-4',
      confidence: 0.95,
      testType,
      coverage
    }
  };
}

// Test data generation
async function generateTestData(schema: any, count: number, type: string) {
  // Simulate data generation
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: uuidv4(),
      name: `Test User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      created_at: new Date().toISOString()
    });
  }
  return data;
}

/**
 * Creates a perfectly aligned startup table using cli-table3
 */
function displayStartupTable(): void {
  // Create a single table with custom border control
  const table = new Table({
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '', 'mid': '', 'mid-mid': '',
      'right': '║', 'right-mid': '', 'middle': ''
    },
    style: {
      head: [],
      border: [],
      'padding-left': 1,
      'padding-right': 1
    },
    colWidths: [60],
    wordWrap: false
  });

  // Add all content
  table.push([{ content: '🧪 API TESTING SERVICE', hAlign: 'center' }]);
  table.push(['Status: ✅ RUNNING']);
  table.push([`Port: ${PORT}`]);
  table.push([`Environment: ${process.env.NODE_ENV || 'development'}`.toUpperCase()]);
  table.push([`Version: ${process.env.APP_VERSION || '1.0.0'}`]);
  table.push(['']); // Empty line
  table.push([`🔍 Test API: http://localhost:${PORT}/api/tests`]);
  table.push([`📊 Results: http://localhost:${PORT}/api/results`]);
  table.push([`🤖 AI Analysis: http://localhost:${PORT}/api/analyze`]);
  table.push([`📈 Reports: http://localhost:${PORT}/api/reports`]);

  // Get the table string and manually add the separator after the header
  const tableStr = table.toString();
  const lines = tableStr.split('\n');
  
  // Insert separator after the first content line (after service name)
  const separatorLine = '╠' + '═'.repeat(60) + '╣';
  lines.splice(2, 0, separatorLine); // Insert after line 1 (0-indexed, after service name)

  console.log('\n' + lines.join('\n') + '\n');
}

app.listen(PORT, () => {
  // Display perfectly aligned startup table
  displayStartupTable();
});

export default app;