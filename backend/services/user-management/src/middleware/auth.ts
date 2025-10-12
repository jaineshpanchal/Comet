import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { User } from '../types';

const prisma = new PrismaClient();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password'> & { id: string; role: string };
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Access token required',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 401
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch (jwtError) {
      logger.warn('Invalid JWT token provided', {
        error: jwtError,
        token: token.substring(0, 20) + '...',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 401
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId 
      },
      include: {
        profile: true,
        teamMemberships: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      logger.warn('User not found for valid JWT token', {
        userId: decoded.userId,
        email: decoded.email,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not found',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 401
      });
    }

    if (!user.isActive) {
      logger.warn('Inactive user attempted to access protected route', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Account deactivated',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 401
      });
    }

    // Update last activity
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;
    
    // Add user to request object
    req.user = userWithoutPassword as any;
    
    next();
  } catch (error) {
    logger.error('Authentication middleware error', {
      error,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Authentication error',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500
    });
  }
};

// Optional authentication middleware (doesn't require authentication)
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          profile: true,
          teamMemberships: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          }
        }
      });

      if (user && user.isActive) {
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword as any;
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
      logger.debug('Optional auth middleware: invalid token', { error: jwtError });
    }
    
    next();
  } catch (error) {
    logger.error('Optional authentication middleware error', { error });
    next(); // Continue without authentication
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 401
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Insufficient permissions for user', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path
      });

      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 403
      });
    }

    next();
  };
};

// Admin-only middleware
export const requireAdmin = requireRole(['ADMIN', 'SUPER_ADMIN']);

// Manager or above middleware
export const requireManager = requireRole(['MANAGER', 'ADMIN', 'SUPER_ADMIN']);

export default {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requireAdmin,
  requireManager
};