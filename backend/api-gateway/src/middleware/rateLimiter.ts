import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * Rate Limiter Middleware
 * Implements endpoint-specific rate limiting to prevent abuse
 */

/**
 * Default rate limiter configuration
 */
const defaultConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });

    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      timestamp: new Date().toISOString(),
      path: req.path,
      statusCode: 429
    });
  }
};

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 * 5 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: false,
  ...defaultConfig,
  message: {
    success: false,
    error: 'Too many authentication attempts',
    message: 'Too many login attempts. Please try again after 15 minutes.',
  }
});

/**
 * Moderate rate limiter for registration
 * 3 requests per hour per IP
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  skipSuccessfulRequests: true,
  ...defaultConfig,
  message: {
    success: false,
    error: 'Too many registration attempts',
    message: 'Too many registration attempts. Please try again later.',
  }
});

/**
 * Password reset rate limiter
 * 3 requests per hour per IP
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  skipSuccessfulRequests: true,
  ...defaultConfig,
  message: {
    success: false,
    error: 'Too many password reset attempts',
    message: 'Too many password reset requests. Please try again later.',
  }
});

/**
 * API rate limiter for general endpoints
 * 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  skipSuccessfulRequests: false,
  ...defaultConfig
});

/**
 * Strict rate limiter for write operations
 * 30 requests per 15 minutes per IP
 */
export const writeOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  skipSuccessfulRequests: false,
  ...defaultConfig,
  message: {
    success: false,
    error: 'Too many write operations',
    message: 'You are making too many changes. Please slow down.',
  }
});

/**
 * Lenient rate limiter for read operations
 * 200 requests per 15 minutes per IP
 */
export const readOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  skipSuccessfulRequests: false,
  ...defaultConfig
});

/**
 * Very strict rate limiter for admin operations
 * 10 requests per 15 minutes per IP
 */
export const adminOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skipSuccessfulRequests: false,
  ...defaultConfig,
  message: {
    success: false,
    error: 'Too many admin operations',
    message: 'Too many administrative actions. Please wait before trying again.',
  }
});

/**
 * File upload rate limiter
 * 10 uploads per hour per IP
 */
export const fileUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  skipSuccessfulRequests: true,
  ...defaultConfig,
  message: {
    success: false,
    error: 'Too many file uploads',
    message: 'Upload limit reached. Please try again later.',
  }
});

/**
 * Create custom rate limiter with specific configuration
 */
export const createRateLimiter = (
  windowMs: number,
  max: number,
  message?: string
) => {
  return rateLimit({
    windowMs,
    max,
    skipSuccessfulRequests: false,
    ...defaultConfig,
    ...(message && {
      message: {
        success: false,
        error: 'Rate limit exceeded',
        message,
      }
    })
  });
};
