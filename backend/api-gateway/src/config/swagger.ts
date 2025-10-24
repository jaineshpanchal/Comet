import swaggerJsdoc = require('swagger-jsdoc');

const packageJson = require('../../package.json');

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GoLive API',
      version: packageJson.version || '1.0.0',
      description: 'Enterprise DevOps Platform - Complete Release Management, AI-Powered Testing, and Seamless Integrations',
      contact: {
        name: 'GoLive Platform Team',
        email: 'support@golive.dev',
        url: 'https://golive.dev',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Development server',
      },
      {
        url: 'https://api.golive.dev',
        description: 'Production server',
      },
      {
        url: 'https://staging-api.golive.dev',
        description: 'Staging server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from /api/v1/auth/login',
        },
        refreshToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Refresh-Token',
          description: 'Refresh token for obtaining new access tokens',
        },
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
            email: { type: 'string', format: 'email', example: 'demo@golive.dev' },
            username: { type: 'string', example: 'demo_user' },
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'DEVELOPER', 'TESTER', 'VIEWER'], example: 'DEVELOPER' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Auth schemas
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'demo@golive.dev' },
            password: { type: 'string', format: 'password', example: 'password123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                user: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'username'],
          properties: {
            email: { type: 'string', format: 'email', example: 'newuser@golive.dev' },
            password: { type: 'string', format: 'password', minLength: 8, example: 'SecurePass123!' },
            username: { type: 'string', minLength: 3, example: 'new_user' },
          },
        },
        // Pipeline schemas
        Pipeline: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Production Deployment Pipeline' },
            description: { type: 'string', example: 'Automated deployment to production environment' },
            projectId: { type: 'string', format: 'uuid' },
            trigger: { type: 'string', enum: ['MANUAL', 'GIT_PUSH', 'GIT_PR', 'SCHEDULE', 'WEBHOOK'] },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'] },
            stages: {
              type: 'array',
              items: { $ref: '#/components/schemas/PipelineStage' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        PipelineStage: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Build' },
            type: { type: 'string', enum: ['BUILD', 'TEST', 'SECURITY_SCAN', 'DEPLOY', 'ROLLBACK'] },
            order: { type: 'integer', example: 1 },
            config: { type: 'object', additionalProperties: true },
          },
        },
        PipelineRun: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            pipelineId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED'] },
            triggeredBy: { type: 'string', format: 'uuid' },
            startedAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            duration: { type: 'integer', description: 'Duration in milliseconds', nullable: true },
          },
        },
        // Test schemas
        TestSuite: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'API Integration Tests' },
            description: { type: 'string', example: 'End-to-end API testing suite' },
            projectId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['UNIT', 'INTEGRATION', 'E2E', 'LOAD', 'SECURITY'] },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'] },
            testCount: { type: 'integer', example: 42 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        TestRun: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            testSuiteId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['PENDING', 'RUNNING', 'PASSED', 'FAILED', 'SKIPPED'] },
            passed: { type: 'integer', example: 38 },
            failed: { type: 'integer', example: 2 },
            skipped: { type: 'integer', example: 2 },
            duration: { type: 'integer', description: 'Duration in milliseconds', example: 45000 },
            startedAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        // Generic response schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Invalid credentials' },
                code: { type: 'string', example: 'AUTH_INVALID_CREDENTIALS' },
                details: { type: 'object', additionalProperties: true },
              },
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array', items: {} },
                total: { type: 'integer', example: 100 },
                page: { type: 'integer', example: 1 },
                pageSize: { type: 'integer', example: 20 },
                totalPages: { type: 'integer', example: 5 },
              },
            },
          },
        },
        // Health check schemas
        HealthCheck: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'], example: 'healthy' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number', description: 'Uptime in seconds', example: 3600 },
            version: { type: 'string', example: '1.0.0' },
          },
        },
        DetailedHealthCheck: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number', description: 'Uptime in seconds' },
            version: { type: 'string' },
            services: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['connected', 'disconnected'] },
                    responseTime: { type: 'number', description: 'Response time in ms' },
                  },
                },
                redis: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['connected', 'disconnected'] },
                    responseTime: { type: 'number', description: 'Response time in ms' },
                  },
                },
              },
            },
            system: {
              type: 'object',
              properties: {
                memory: {
                  type: 'object',
                  properties: {
                    used: { type: 'number', description: 'Used memory in bytes' },
                    total: { type: 'number', description: 'Total memory in bytes' },
                    percentage: { type: 'number', description: 'Memory usage percentage' },
                  },
                },
                cpu: {
                  type: 'object',
                  properties: {
                    usage: { type: 'number', description: 'CPU usage percentage' },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required or token invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: {
                  message: 'Authentication required',
                  code: 'AUTH_REQUIRED',
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: {
                  message: 'Insufficient permissions',
                  code: 'FORBIDDEN',
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: {
                  message: 'Resource not found',
                  code: 'NOT_FOUND',
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: {
                  message: 'Validation failed',
                  code: 'VALIDATION_ERROR',
                  details: {
                    email: 'Invalid email format',
                  },
                },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: {
                  message: 'Rate limit exceeded',
                  code: 'RATE_LIMIT_EXCEEDED',
                },
              },
            },
          },
          headers: {
            'X-RateLimit-Limit': {
              schema: { type: 'integer' },
              description: 'Request limit per window',
            },
            'X-RateLimit-Remaining': {
              schema: { type: 'integer' },
              description: 'Remaining requests in current window',
            },
            'X-RateLimit-Reset': {
              schema: { type: 'integer' },
              description: 'Unix timestamp when limit resets',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Pipelines',
        description: 'CI/CD pipeline management',
      },
      {
        name: 'Pipeline Runs',
        description: 'Pipeline execution and monitoring',
      },
      {
        name: 'Testing',
        description: 'Test suite management',
      },
      {
        name: 'Test Runs',
        description: 'Test execution and results',
      },
      {
        name: 'Projects',
        description: 'Project management',
      },
      {
        name: 'Deployments',
        description: 'Deployment tracking and management',
      },
      {
        name: 'Integrations',
        description: 'Third-party integrations (GitHub, GitLab, JIRA, Slack)',
      },
      {
        name: 'AI Services',
        description: 'AI-powered test generation and error analysis',
      },
      {
        name: 'Monitoring',
        description: 'System monitoring and metrics',
      },
      {
        name: 'Health',
        description: 'Health check and system status endpoints',
      },
      {
        name: 'Rate Limiting',
        description: 'Rate limit management and monitoring',
      },
    ],
  },
  apis: [
    './src/routes/**/*.ts',
    './src/routes/**/*.js',
    './src/index.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
