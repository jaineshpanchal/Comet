// Main API Gateway Server
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import Table from 'cli-table3';
import { createServer, Server as HttpServer } from 'http';
import { APP_CONFIG } from './config/services';
import { connectDatabase } from './config/database';
import { redis, checkRedisConnection } from './config/redis';
import { errorHandler, notFoundHandler, timeoutHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authenticateToken } from './middleware/auth';
import { auditMiddleware } from './middleware/audit';
import { ServiceProxy } from './services/serviceProxy';
import { websocketService } from './services/websocketService';
import { logger } from './utils/logger';
import { ApiResponse } from './types';

// Import routes
import authRoutes from './routes/auth';
import healthRoutes from './routes/health';
import proxyRoutes from './routes/proxy';
import projectRoutes from './routes/projects';
import pipelineRoutes from './routes/pipelines';
import testRoutes from './routes/tests';
import deploymentRoutes from './routes/deployments';
import metricsRoutes from './routes/metrics';
import usersRoutes from './routes/users';
import auditLogsRoutes from './routes/auditLogs';
import teamsRoutes from './routes/teams';
import permissionsRoutes from './routes/permissions';
import secretsRoutes from './routes/secrets';
import securityScansRoutes from './routes/securityScans';

class APIGateway {
  private app: Express;
  private httpServer: HttpServer;
  private port: number;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.port = APP_CONFIG.PORT;
    this.initializeMiddleware();
    this.initializeSwagger();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3030',
          'http://localhost:8080'
        ];
        
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests from this IP',
        message: 'Please try again later',
        statusCode: 429
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api', limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Request timeout
    this.app.use(timeoutHandler(30000));

    // Request logging
    this.app.use(requestLogger);

    // Audit logging (after request logging)
    this.app.use(auditMiddleware);

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);
  }

  private initializeSwagger(): void {
    const swaggerOptions = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Comet DevOps Platform API',
          version: '1.0.0',
          description: 'Enterprise DevOps Platform API Gateway',
          contact: {
            name: 'Comet DevOps Team',
            email: 'api@comet-devops.com'
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
          }
        },
        servers: [
          {
            url: `http://localhost:${this.port}`,
            description: 'Development server'
          },
          {
            url: 'https://api.comet-devops.com',
            description: 'Production server'
          }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          },
          schemas: {
            ApiResponse: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  description: 'Indicates if the request was successful'
                },
                data: {
                  type: 'object',
                  description: 'Response data'
                },
                message: {
                  type: 'string',
                  description: 'Human-readable message'
                },
                error: {
                  type: 'string',
                  description: 'Error message if request failed'
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Request timestamp'
                },
                path: {
                  type: 'string',
                  description: 'Request path'
                },
                statusCode: {
                  type: 'integer',
                  description: 'HTTP status code'
                }
              }
            },
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                username: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                avatar: { type: 'string' },
                role: { 
                  type: 'string',
                  enum: ['ADMIN', 'MANAGER', 'DEVELOPER', 'TESTER', 'VIEWER']
                },
                isActive: { type: 'boolean' },
                lastLoginAt: { type: 'string', format: 'date-time' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            AuthTokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' },
                tokenType: { type: 'string', default: 'Bearer' }
              }
            }
          }
        },
        security: [
          {
            bearerAuth: []
          }
        ]
      },
      apis: ['./src/routes/*.ts']
    };

    const swaggerSpec = swaggerJsdoc(swaggerOptions);
    
    this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Comet DevOps API Documentation'
    }));

    // Serve raw swagger JSON
    this.app.get('/api/docs.json', (req: Request, res: Response) => {
      res.json(swaggerSpec);
    });
  }

  private initializeRoutes(): void {
    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      const response: ApiResponse = {
        success: true,
        message: 'Comet DevOps Platform API Gateway',
        data: {
          name: 'API Gateway',
          version: process.env.APP_VERSION || '1.0.0',
          environment: APP_CONFIG.NODE_ENV,
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200
      };
      res.json(response);
    });

    // API routes
    this.app.use('/api/health', healthRoutes);
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', usersRoutes);
    this.app.use('/api/teams', teamsRoutes);
    this.app.use('/api/permissions', permissionsRoutes);
    this.app.use('/api/projects', projectRoutes);
    this.app.use('/api', secretsRoutes); // Secrets routes are nested under /api/projects/:projectId/secrets
    this.app.use('/api/security', securityScansRoutes);
    this.app.use('/api/pipelines', pipelineRoutes);
    this.app.use('/api/tests', testRoutes);
    this.app.use('/api/deployments', deploymentRoutes);
    this.app.use('/api/metrics', metricsRoutes);
    this.app.use('/api/audit-logs', auditLogsRoutes);

    // Microservice proxy routes
    this.app.use('/', proxyRoutes);

    // Protected route examples
    this.app.get('/api/profile', authenticateToken, (req: Request, res: Response) => {
      const response: ApiResponse = {
        success: true,
        data: (req as any).user,
        message: 'User profile retrieved successfully',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200
      };
      res.json(response);
    });

    // Service proxy routes
    this.setupServiceProxyRoutes();
  }

  private setupServiceProxyRoutes(): void {
    // Integration Service routes
    this.app.use('/api/integrations', authenticateToken, (req: Request, res: Response, next) => {
      res.json({
        success: true,
        message: 'Integration service proxy - Coming soon',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200
      });
    });

    // Code Analysis Service routes
    this.app.use('/api/analysis', authenticateToken, (req: Request, res: Response, next) => {
      res.json({
        success: true,
        message: 'Code analysis service proxy - Coming soon',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200
      });
    });

    // Monitoring Service routes
    this.app.use('/api/monitoring', authenticateToken, (req: Request, res: Response, next) => {
      res.json({
        success: true,
        message: 'Monitoring service proxy - Coming soon',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200
      });
    });

    // AI Services routes
    this.app.use('/api/ai', authenticateToken, (req: Request, res: Response, next) => {
      res.json({
        success: true,
        message: 'AI services proxy - Coming soon',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler for unmatched routes
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Creates a perfectly aligned ASCII table using character-precise calculations
   */
  private displayStartupTable(): void {
    // Fixed table dimensions for perfect alignment
    const INNER_WIDTH = 60;
    const TOTAL_WIDTH = INNER_WIDTH + 4; // 2 borders + 2 spaces

    // Box drawing characters
    const BOX = {
      TOP_LEFT: '╔',
      TOP_RIGHT: '╗', 
      BOTTOM_LEFT: '╚',
      BOTTOM_RIGHT: '╝',
      HORIZONTAL: '═',
      VERTICAL: '║',
      CROSS: '╬',
      T_DOWN: '╦',
      T_UP: '╩',
      T_RIGHT: '╠',
      T_LEFT: '╣'
    };

    // Precise line builders
    const topBorder = BOX.TOP_LEFT + BOX.HORIZONTAL.repeat(INNER_WIDTH + 2) + BOX.TOP_RIGHT;
    const middleBorder = BOX.T_RIGHT + BOX.HORIZONTAL.repeat(INNER_WIDTH + 2) + BOX.T_LEFT;
    const bottomBorder = BOX.BOTTOM_LEFT + BOX.HORIZONTAL.repeat(INNER_WIDTH + 2) + BOX.BOTTOM_RIGHT;
    const emptyLine = BOX.VERTICAL + ' '.repeat(INNER_WIDTH + 2) + BOX.VERTICAL;

    // Text formatter with guaranteed precision
    const formatLine = (text: string, align: 'center' | 'left' = 'left'): string => {
      if (align === 'center') {
        const spaces = Math.max(0, INNER_WIDTH - text.length);
        const leftSpaces = Math.floor(spaces / 2);
        const rightSpaces = spaces - leftSpaces;
        return BOX.VERTICAL + ' ' + ' '.repeat(leftSpaces) + text + ' '.repeat(rightSpaces) + ' ' + BOX.VERTICAL;
      } else {
        const spaces = Math.max(0, INNER_WIDTH - text.length - 1); // -1 for initial space
        return BOX.VERTICAL + ' ' + text + ' '.repeat(spaces) + ' ' + BOX.VERTICAL;
      }
    };

    // Dynamic content
    const port = this.port.toString();
    const environment = APP_CONFIG.NODE_ENV.toUpperCase();
    const version = process.env.APP_VERSION || '1.0.0';
    
    // Build table with precise formatting
    const lines = [
      topBorder,
      formatLine('🚀 COMET DEVOPS PLATFORM', 'center'),
      formatLine('API Gateway', 'center'),
      middleBorder,
      formatLine('Status: ✅ RUNNING'),
      formatLine(`Port: ${port}`),
      formatLine(`Environment: ${environment}`),
      formatLine(`Version: ${version}`),
      emptyLine,
      formatLine(`📚 API Documentation: http://localhost:${port}/api/docs`),
      formatLine(`🔍 Health Check: http://localhost:${port}/api/health`),
      formatLine(`📊 Metrics: http://localhost:${port}/api/health/metrics`),
      bottomBorder
    ];

    // Output with clean formatting
    console.log('\n' + lines.join('\n') + '\n');
  }

  /**
   * Alternative method using professional cli-table3 library for perfect alignment
   */
  private displayStartupTablePro(): void {
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

    // Dynamic content
    const port = this.port.toString();
    const environment = APP_CONFIG.NODE_ENV.toUpperCase();
    const version = process.env.APP_VERSION || '1.0.0';

    // Add all content
    table.push([{ content: '🚀 COMET DEVOPS PLATFORM', hAlign: 'center' }]);
    table.push([{ content: 'API Gateway', hAlign: 'center' }]);
    table.push(['Status: ✅ RUNNING']);
    table.push([`Port: ${port}`]);
    table.push([`Environment: ${environment}`]);
    table.push([`Version: ${version}`]);
    table.push(['']); // Empty line
    table.push([`📚 API Documentation: http://localhost:${port}/api/docs`]);
    table.push([`🔍 Health Check: http://localhost:${port}/api/health`]);
    table.push([`📊 Metrics: http://localhost:${port}/api/health/metrics`]);

    // Get the table string and manually add the separator after the header
    const tableStr = table.toString();
    const lines = tableStr.split('\n');
    
    // Insert separator after the second content line (after "API Gateway")
    const separatorLine = '╠' + '═'.repeat(60) + '╣';
    lines.splice(3, 0, separatorLine); // Insert after line 2 (0-indexed, so after "API Gateway" line)

    console.log('\n' + lines.join('\n') + '\n');
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      logger.info('Connecting to database...', { service: 'api-gateway' });
      await connectDatabase();
      logger.info('✅ Database connected successfully', { service: 'api-gateway' });

      // Note: Redis connection can be added here if needed in the future
      // logger.info('Connecting to Redis...', { service: 'api-gateway' });

      // Initialize WebSocket server
      logger.info('Initializing WebSocket server...', { service: 'api-gateway' });
      websocketService.initialize(this.httpServer);
      logger.info('✅ WebSocket server initialized', { service: 'api-gateway' });

      // Initialize service health checks
      logger.info('Initializing service health checks...');
      // ServiceProxy health checks will be implemented in next phase
      logger.info('Service health checks initialized');

      // Start the HTTP server (this will also start WebSocket)
      this.httpServer.listen(this.port, () => {
        logger.info(`API Gateway started successfully`, {
          port: this.port,
          environment: APP_CONFIG.NODE_ENV,
          version: process.env.APP_VERSION || '1.0.0',
          pid: process.pid,
          websocket: 'enabled',
          timestamp: new Date().toISOString()
        });

        // Display perfectly aligned startup table using professional library
        this.displayStartupTablePro();
      });

      // Graceful shutdown handlers
      this.setupGracefulShutdown();

    } catch (error: any) {
      logger.error('Failed to start API Gateway', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      try {
        // Close database connections
        logger.info('Closing database connections...');
        // Add database close logic here
        
        // Close Redis connections
        logger.info('Closing Redis connections...');
        // Add Redis close logic here
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error: any) {
        logger.error('Error during graceful shutdown', {
          error: error.message,
          signal
        });
        process.exit(1);
      }
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason,
        promise
      });
      process.exit(1);
    });
  }

  public getApp(): Express {
    return this.app;
  }
}

// Create and export the API Gateway instance
const apiGateway = new APIGateway();

// Start the server if this file is run directly
if (require.main === module) {
  apiGateway.start().catch((error) => {
    logger.error('Failed to start server', error);
    process.exit(1);
  });
}

export default apiGateway;
export { APIGateway };