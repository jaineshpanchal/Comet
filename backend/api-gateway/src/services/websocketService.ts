import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';
import { AuthService } from './authService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
}

class WebSocketService {
  private io: Server | null = null;
  private connectedClients: Map<string, AuthenticatedSocket> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3030',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupConnectionHandlers();
    logger.info('WebSocket server initialized');
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', async (socket) => {
      logger.info('New WebSocket connection attempt', { socketId: socket.id });

      try {
        // Authenticate the socket connection
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          logger.warn('WebSocket connection rejected - no token', { socketId: socket.id });
          socket.disconnect();
          return;
        }

        const user = await AuthService.verifyToken(token);

        // Store authenticated socket info
        this.connectedClients.set(socket.id, {
          id: socket.id,
          userId: user.id,
          userEmail: user.email,
          userRole: user.role
        });

        logger.info('WebSocket client authenticated', {
          socketId: socket.id,
          userId: user.id,
          email: user.email
        });

        // Join user-specific room
        socket.join(`user:${user.id}`);
        socket.join(`role:${user.role}`);

        // Send connection success
        socket.emit('connected', {
          message: 'Successfully connected to WebSocket server',
          userId: user.id,
          timestamp: new Date().toISOString()
        });

        // Handle subscription to specific resources
        socket.on('subscribe:pipeline', async (pipelineId: string) => {
          await this.handlePipelineSubscription(socket, pipelineId, user.id);
        });

        socket.on('subscribe:project', async (projectId: string) => {
          await this.handleProjectSubscription(socket, projectId, user.id);
        });

        socket.on('subscribe:testSuite', async (testSuiteId: string) => {
          await this.handleTestSuiteSubscription(socket, testSuiteId, user.id);
        });

        // Handle unsubscribe
        socket.on('unsubscribe', (room: string) => {
          socket.leave(room);
          logger.debug('Client unsubscribed', { socketId: socket.id, room });
        });

        // Handle disconnection
        socket.on('disconnect', () => {
          this.connectedClients.delete(socket.id);
          logger.info('WebSocket client disconnected', { socketId: socket.id, userId: user.id });
        });

        // Handle ping/pong for connection health
        socket.on('ping', () => {
          socket.emit('pong', { timestamp: new Date().toISOString() });
        });

      } catch (error: any) {
        logger.error('WebSocket authentication failed', {
          socketId: socket.id,
          error: error.message
        });
        socket.disconnect();
      }
    });
  }

  /**
   * Handle pipeline subscription
   */
  private async handlePipelineSubscription(socket: any, pipelineId: string, userId: string): Promise<void> {
    try {
      // Verify user has access to pipeline
      const pipeline = await prisma.pipeline.findUnique({
        where: { id: pipelineId },
        include: {
          project: {
            include: {
              team: {
                include: {
                  members: true
                }
              }
            }
          }
        }
      });

      if (!pipeline) {
        socket.emit('error', { message: 'Pipeline not found', pipelineId });
        return;
      }

      const client = this.connectedClients.get(socket.id);
      const hasAccess =
        client?.userRole === 'ADMIN' ||
        pipeline.project.ownerId === userId ||
        pipeline.project.team?.members.some(m => m.userId === userId);

      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to pipeline', pipelineId });
        return;
      }

      socket.join(`pipeline:${pipelineId}`);
      logger.info('Client subscribed to pipeline', { socketId: socket.id, pipelineId });

      socket.emit('subscribed', {
        type: 'pipeline',
        id: pipelineId,
        message: 'Successfully subscribed to pipeline updates'
      });

    } catch (error: any) {
      logger.error('Pipeline subscription failed', { error: error.message, pipelineId });
      socket.emit('error', { message: 'Subscription failed', pipelineId });
    }
  }

  /**
   * Handle project subscription
   */
  private async handleProjectSubscription(socket: any, projectId: string, userId: string): Promise<void> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          team: {
            include: {
              members: true
            }
          }
        }
      });

      if (!project) {
        socket.emit('error', { message: 'Project not found', projectId });
        return;
      }

      const client = this.connectedClients.get(socket.id);
      const hasAccess =
        client?.userRole === 'ADMIN' ||
        project.ownerId === userId ||
        project.team?.members.some(m => m.userId === userId);

      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to project', projectId });
        return;
      }

      socket.join(`project:${projectId}`);
      logger.info('Client subscribed to project', { socketId: socket.id, projectId });

      socket.emit('subscribed', {
        type: 'project',
        id: projectId,
        message: 'Successfully subscribed to project updates'
      });

    } catch (error: any) {
      logger.error('Project subscription failed', { error: error.message, projectId });
      socket.emit('error', { message: 'Subscription failed', projectId });
    }
  }

  /**
   * Handle test suite subscription
   */
  private async handleTestSuiteSubscription(socket: any, testSuiteId: string, userId: string): Promise<void> {
    try {
      const testSuite = await prisma.testSuite.findUnique({
        where: { id: testSuiteId },
        include: {
          project: {
            include: {
              team: {
                include: {
                  members: true
                }
              }
            }
          }
        }
      });

      if (!testSuite) {
        socket.emit('error', { message: 'Test suite not found', testSuiteId });
        return;
      }

      const client = this.connectedClients.get(socket.id);
      const hasAccess =
        client?.userRole === 'ADMIN' ||
        testSuite.project.ownerId === userId ||
        testSuite.project.team?.members.some(m => m.userId === userId);

      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to test suite', testSuiteId });
        return;
      }

      socket.join(`testSuite:${testSuiteId}`);
      logger.info('Client subscribed to test suite', { socketId: socket.id, testSuiteId });

      socket.emit('subscribed', {
        type: 'testSuite',
        id: testSuiteId,
        message: 'Successfully subscribed to test suite updates'
      });

    } catch (error: any) {
      logger.error('Test suite subscription failed', { error: error.message, testSuiteId });
      socket.emit('error', { message: 'Subscription failed', testSuiteId });
    }
  }

  /**
   * Broadcast pipeline run update
   */
  broadcastPipelineRunUpdate(pipelineId: string, data: any): void {
    if (!this.io) return;

    this.io.to(`pipeline:${pipelineId}`).emit('pipeline:run:update', {
      pipelineId,
      data,
      timestamp: new Date().toISOString()
    });

    logger.debug('Pipeline run update broadcasted', { pipelineId });
  }

  /**
   * Broadcast pipeline status change
   */
  broadcastPipelineStatusChange(pipelineId: string, status: string, data?: any): void {
    if (!this.io) return;

    this.io.to(`pipeline:${pipelineId}`).emit('pipeline:status:change', {
      pipelineId,
      status,
      data,
      timestamp: new Date().toISOString()
    });

    logger.debug('Pipeline status change broadcasted', { pipelineId, status });
  }

  /**
   * Broadcast test run update
   */
  broadcastTestRunUpdate(testSuiteId: string, data: any): void {
    if (!this.io) return;

    this.io.to(`testSuite:${testSuiteId}`).emit('test:run:update', {
      testSuiteId,
      data,
      timestamp: new Date().toISOString()
    });

    logger.debug('Test run update broadcasted', { testSuiteId });
  }

  /**
   * Broadcast deployment update
   */
  broadcastDeploymentUpdate(projectId: string, data: any): void {
    if (!this.io) return;

    this.io.to(`project:${projectId}`).emit('deployment:update', {
      projectId,
      data,
      timestamp: new Date().toISOString()
    });

    logger.debug('Deployment update broadcasted', { projectId });
  }

  /**
   * Broadcast metrics update
   */
  broadcastMetricsUpdate(data: any): void {
    if (!this.io) return;

    // Broadcast to all connected clients
    this.io.emit('metrics:update', {
      data,
      timestamp: new Date().toISOString()
    });

    logger.debug('Metrics update broadcasted');
  }

  /**
   * Send notification to specific user
   */
  sendUserNotification(userId: string, notification: any): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });

    logger.debug('User notification sent', { userId });
  }

  /**
   * Send notification to users with specific role
   */
  sendRoleNotification(role: string, notification: any): void {
    if (!this.io) return;

    this.io.to(`role:${role}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });

    logger.debug('Role notification sent', { role });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get connected clients by user ID
   */
  getUserConnections(userId: string): string[] {
    return Array.from(this.connectedClients.values())
      .filter(client => client.userId === userId)
      .map(client => client.id);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
