// Request logging middleware
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Extend Request interface to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Extract user info if authenticated
  const userId = (req as any).user?.id;
  const userEmail = (req as any).user?.email;

  // Log request start
  logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId,
    userEmail,
    timestamp: new Date().toISOString()
  });

  // Override res.json to capture response data
  const originalJson = res.json;
  res.json = function(body: any) {
    const responseTime = Date.now() - (req.startTime || Date.now());
    
    // Log response
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      success: res.statusCode < 400,
      userId,
      userEmail,
      timestamp: new Date().toISOString()
    });

    return originalJson.call(this, body);
  };

  // Override res.send to capture response data
  const originalSend = res.send;
  res.send = function(body: any) {
    const responseTime = Date.now() - (req.startTime || Date.now());
    
    // Log response
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      success: res.statusCode < 400,
      userId,
      userEmail,
      timestamp: new Date().toISOString()
    });

    return originalSend.call(this, body);
  };

  next();
};