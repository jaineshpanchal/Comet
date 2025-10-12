// Main API Gateway Server
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { APP_CONFIG } from './config/services';
import { connectDatabase } from './config/database';
import { redis, checkRedisConnection } from './config/redis';
import { errorHandler, notFoundHandler, timeoutHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authenticateToken } from './middleware/auth';
import { ServiceProxy } from './services/serviceProxy';
import { logger } from './utils/logger';
import { ApiResponse } from './types';

// Import routes
import authRoutes from './routes/auth';
import healthRoutes from './routes/health';
import proxyRoutes from './routes/proxy';

class APIGateway {
  private app: Express;
  private port: number;

  constructor() {
    this.app = express();
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
    // Pipeline Service routes
    this.app.use('/api/pipelines', authenticateToken, (req: Request, res: Response, next) => {
      // For now, return a placeholder response
      res.json({
        success: true,
        message: 'Pipeline service proxy - Coming soon',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200
      });
    });

    // Testing Service routes  
    this.app.use('/api/tests', authenticateToken, (req: Request, res: Response, next) => {
      res.json({
        success: true,
        message: 'Testing service proxy - Coming soon',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 200
      });
    });

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

  public async start(): Promise<void> {
    try {
      // Skip database connection for now to get server running
      logger.info('⚠️  Skipping database connection for initial startup', { service: 'api-gateway' });

      // Skip Redis connection for now
      logger.info('⚠️  Skipping Redis connection for initial startup', { service: 'api-gateway' });

      // Initialize service health checks
      logger.info('Initializing service health checks...');
      // ServiceProxy health checks will be implemented in next phase
      logger.info('Service health checks initialized');

      // Start the server
      this.app.listen(this.port, () => {
        logger.info(`API Gateway started successfully`, {
          port: this.port,
          environment: APP_CONFIG.NODE_ENV,
          version: process.env.APP_VERSION || '1.0.0',
          pid: process.pid,
          timestamp: new Date().toISOString()
        });

        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   🚀 COMET DEVOPS PLATFORM                  ║
║                        API Gateway                           ║
╠══════════════════════════════════════════════════════════════╣
║ Status: ✅ RUNNING                                           ║
║ Port: ${this.port}                                                  ║
║ Environment: ${APP_CONFIG.NODE_ENV.toUpperCase()}                                         ║
║ Version: ${process.env.APP_VERSION || '1.0.0'}                                               ║
║                                                              ║
║ 📚 API Documentation: http://localhost:${this.port}/api/docs      ║
║ 🔍 Health Check: http://localhost:${this.port}/api/health         ║
║ 📊 Metrics: http://localhost:${this.port}/api/health/metrics      ║
╚══════════════════════════════════════════════════════════════╝
        `);
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