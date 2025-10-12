import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { UserRole } from '../types';
import { logger } from '../utils/logger';

// Extend Express Request interface
export interface AuthenticatedRequest extends Request {
  user?: any;
  token?: string;
}

// Authentication middleware
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token is required',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 401
      });
      return;
    }

    // Verify token and get user
    const user = await AuthService.verifyToken(token);
    
    // Attach user and token to request
    req.user = user;
    req.token = token;

    logger.info('User authenticated successfully', {
      userId: user.id,
      email: user.email,
      path: req.path
    });

    next();
  } catch (error: any) {
    logger.warn('Authentication failed', {
      error: error.message,
      path: req.path
    });

    res.status(401).json({
      success: false,
      error: error.message || 'Authentication failed',
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 401
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (token) {
      const user = await AuthService.verifyToken(token);
      req.user = user;
      req.token = token;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (roles: UserRole | UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User must be authenticated',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 401
      });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization failed - insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path
      });

      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource',
        timestamp: new Date().toISOString(),
        path: req.path,
        statusCode: 403
      });
      return;
    }

    next();
  };
};

// Admin only middleware
export const requireAdmin = requireRole(UserRole.ADMIN);

// Manager or Admin middleware
export const requireManager = requireRole([UserRole.ADMIN, UserRole.MANAGER]);

// Legacy middleware for backward compatibility
export const authMiddleware = authenticateToken;
export const optionalAuthMiddleware = optionalAuth;