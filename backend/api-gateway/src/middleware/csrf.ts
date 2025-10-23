import { Request, Response, NextFunction } from 'express';
import { doubleCsrf } from 'csrf-csrf';
import { logger } from '../utils/logger';

// Configure CSRF protection with correct API
const doubleCsrfOptions = {
  getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    sameSite: 'lax' as const, // 'lax' for development, 'strict' for production
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getSessionIdentifier: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP address as fallback
    return (req as any).user?.id || req.ip || 'anonymous';
  },
};

const csrfProtectionInstance = doubleCsrf(doubleCsrfOptions);

/**
 * CSRF protection middleware
 * Validates CSRF token for state-changing requests (POST, PUT, DELETE, PATCH)
 */
export const csrfProtection = csrfProtectionInstance;

/**
 * Generate and send CSRF token endpoint
 * This should be called by the frontend to get a CSRF token
 */
export const csrfTokenHandler = (req: Request, res: Response) => {
  try {
    // Generate token using the csrf-csrf package's correct API
    // The doubleCsrf function returns an object with generateCsrfToken function
    const token = csrfProtectionInstance.generateCsrfToken(req, res);

    res.json({
      success: true,
      data: {
        csrfToken: token
      },
      message: 'CSRF token generated successfully',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 200
    });
  } catch (error: any) {
    logger.error('Failed to generate CSRF token', {
      error: error.message,
      path: req.path
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate CSRF token',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 500
    });
  }
};

/**
 * Custom CSRF error handler
 * Provides better error messages for CSRF validation failures
 */
export const csrfErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.code === 'EBADCSRFTOKEN' || err.message?.includes('CSRF') || err.message?.includes('csrf')) {
    logger.warn('CSRF token validation failed', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      error: err.message
    });

    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      message: 'CSRF token validation failed. Please refresh and try again.',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 403
    });
  }

  next(err);
};

/**
 * Conditional CSRF protection
 * Only apply CSRF to routes that need it (exclude auth routes in some cases)
 */
export const conditionalCsrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for specific routes if needed
  const exemptPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/webhooks', // Webhooks from external services
    '/api/health',
    '/api/csrf-token',
    '/metrics',
  ];

  const isExempt = exemptPaths.some(path => req.path.startsWith(path));

  if (isExempt) {
    return next();
  }

  // Apply CSRF protection for state-changing methods
  const statChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (statChangingMethods.includes(req.method)) {
    return csrfProtectionInstance.doubleCsrfProtection(req, res, next);
  }

  next();
};
