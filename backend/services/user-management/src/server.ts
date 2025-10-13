import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import Table from 'cli-table3';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import teamRoutes from './routes/teams';
import healthRoutes from './routes/health';

class UserManagementService {
  private app: Express;
  private port: number;
  private prisma: PrismaClient;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '8001');
    this.prisma = new PrismaClient();
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP
      message: {
        error: 'Too many requests from this IP, please try again later.',
        statusCode: 429,
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);
  }

  private initializeRoutes(): void {
    // Health check (no auth required)
    this.app.use('/health', healthRoutes);
    
    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/users', userRoutes);
    this.app.use('/api/v1/teams', teamRoutes);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        service: 'User Management Service',
        version: '1.0.0',
        status: 'operational',
        endpoints: {
          health: '/health',
          auth: '/api/v1/auth',
          users: '/api/v1/users',
          teams: '/api/v1/teams'
        },
        timestamp: new Date().toISOString()
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Creates a perfectly aligned startup table using cli-table3
   */
  private displayStartupTable(): void {
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
    table.push([{ content: '🎯 USER MANAGEMENT SERVICE', hAlign: 'center' }]);
    table.push(['Status: ✅ RUNNING']);
    table.push([`Port: ${this.port}`]);
    table.push([`Environment: ${process.env.NODE_ENV || 'development'}`.toUpperCase()]);
    table.push([`Version: ${process.env.APP_VERSION || '1.0.0'}`]);
    table.push(['']); // Empty line
    table.push([`🔍 Health Check: http://localhost:${this.port}/health`]);
    table.push([`🔐 Auth API: http://localhost:${this.port}/api/v1/auth`]);
    table.push([`👤 Users API: http://localhost:${this.port}/api/v1/users`]);
    table.push([`👥 Teams API: http://localhost:${this.port}/api/v1/teams`]);

    // Get the table string and manually add the separator after the header
    const tableStr = table.toString();
    const lines = tableStr.split('\n');
    
    // Insert separator after the first content line (after service name)
    const separatorLine = '╠' + '═'.repeat(60) + '╣';
    lines.splice(2, 0, separatorLine); // Insert after line 1 (0-indexed, after service name)

    console.log('\n' + lines.join('\n') + '\n');
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await this.prisma.$connect();
      logger.info('Connected to database successfully');

      // Start server
      this.app.listen(this.port, () => {
        // Display perfectly aligned startup table
        this.displayStartupTable();
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start User Management Service:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      try {
        await this.prisma.$disconnect();
        logger.info('Database connections closed');
        
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  public getApp(): Express {
    return this.app;
  }

  public getPrisma(): PrismaClient {
    return this.prisma;
  }
}

// Create and start the service
const userService = new UserManagementService();

// Start the server if this file is run directly
if (require.main === module) {
  userService.start().catch((error) => {
    logger.error('Failed to start User Management Service:', error);
    process.exit(1);
  });
}

export default userService;