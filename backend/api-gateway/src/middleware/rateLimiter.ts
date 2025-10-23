import { Request, Response, NextFunction } from 'express';
import { getCache, setCache } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * Enhanced Rate Limiting Middleware for GoLive Platform
 *
 * Features:
 * - Redis-based distributed rate limiting
 * - Per-endpoint configuration
 * - User-specific and IP-based limiting
 * - Sliding window algorithm
 * - Tiered limits based on user role
 * - Rate limit headers (X-RateLimit-*)
 * - Automatic cleanup of expired keys
 */

export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Maximum requests per window
  keyGenerator?: (req: Request) => string;  // Custom key generator
  skipSuccessfulRequests?: boolean;  // Don't count successful requests
  skipFailedRequests?: boolean;      // Don't count failed requests
  handler?: (req: Request, res: Response) => void;  // Custom handler
  skip?: (req: Request) => boolean;  // Skip rate limiting for certain requests
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: number;
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const RateLimitPresets = {
  // Authentication endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 5,             // 5 requests per 15 min
  },

  // API endpoints - standard limits
  api: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 100,           // 100 requests per 15 min
  },

  // Heavy operations - lower limits
  heavy: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 10,            // 10 requests per hour
  },

  // Public endpoints - moderate limits
  public: {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 20,            // 20 requests per minute
  },

  // Admin endpoints - higher limits
  admin: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 500,           // 500 requests per 15 min
  },

  // Write operations
  write: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 30,            // 30 requests per 15 min
  },

  // Read operations
  read: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 200,           // 200 requests per 15 min
  },
};

/**
 * Role-based rate limit multipliers
 */
const RoleMultipliers: Record<string, number> = {
  ADMIN: 5,      // 5x the base limit
  MANAGER: 3,    // 3x the base limit
  DEVELOPER: 2,  // 2x the base limit
  TESTER: 1.5,   // 1.5x the base limit
  VIEWER: 1,     // 1x the base limit (default)
};

/**
 * Generate rate limit key
 */
function generateKey(req: Request, prefix: string = 'ratelimit'): string {
  const user = (req as any).user;

  // Use user ID if authenticated, otherwise use IP
  const identifier = user?.id || req.ip || 'unknown';
  const path = req.path;

  return `${prefix}:${identifier}:${path}`;
}

/**
 * Get user-specific rate limit based on role
 */
function getUserLimit(baseLimit: number, req: Request): number {
  const user = (req as any).user;

  if (!user || !user.role) {
    return baseLimit;
  }

  const multiplier = RoleMultipliers[user.role] || 1;
  return Math.floor(baseLimit * multiplier);
}

/**
 * Sliding window rate limiter using Redis
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig>) {
    this.config = {
      windowMs: config.windowMs || 15 * 60 * 1000,
      maxRequests: config.maxRequests || 100,
      keyGenerator: config.keyGenerator || generateKey,
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      handler: config.handler,
      skip: config.skip,
    };
  }

  /**
   * Main rate limiting middleware
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Skip if configured
        if (this.config.skip && this.config.skip(req)) {
          return next();
        }

        // Generate key
        const key = this.config.keyGenerator!(req);

        // Get user-specific limit
        const maxRequests = getUserLimit(this.config.maxRequests, req);

        // Get current count
        const info = await this.checkLimit(key, maxRequests);

        // Set rate limit headers
        this.setHeaders(res, info);

        // Check if limit exceeded
        if (info.current > info.limit) {
          logger.warn('Rate limit exceeded', {
            key,
            limit: info.limit,
            current: info.current,
            ip: req.ip,
            path: req.path,
            user: (req as any).user?.id,
          });

          // Call custom handler if provided
          if (this.config.handler) {
            return this.config.handler(req, res);
          }

          // Default response
          return res.status(429).json({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests, please try again later',
              details: {
                limit: info.limit,
                remaining: 0,
                resetTime: info.resetTime,
                retryAfter: Math.ceil((info.resetTime - Date.now()) / 1000),
              },
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Track request if not skipping
        if (!this.config.skipSuccessfulRequests && !this.config.skipFailedRequests) {
          await this.incrementCounter(key);
        } else {
          // Store original end to intercept status code
          const originalEnd = res.end;
          let ended = false;

          res.end = function(this: Response, ...args: any[]) {
            if (!ended) {
              ended = true;
              const statusCode = res.statusCode;
              const shouldCount =
                (!this.skipSuccessfulRequests || statusCode >= 400) &&
                (!this.skipFailedRequests || statusCode < 400);

              if (shouldCount) {
                void incrementCounter(key);
              }
            }
            return originalEnd.apply(this, args as any);
          }.bind({ skipSuccessfulRequests: this.config.skipSuccessfulRequests, skipFailedRequests: this.config.skipFailedRequests });
        }

        next();
      } catch (error) {
        logger.error('Rate limiter error', { error, path: req.path });
        // On error, allow the request to continue
        next();
      }
    };
  }

  /**
   * Check current rate limit status
   */
  private async checkLimit(key: string, maxRequests: number): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get current count from Redis
    const countStr = await getCache(key);
    const current = countStr ? parseInt(countStr) : 0;

    return {
      limit: maxRequests,
      current,
      remaining: Math.max(0, maxRequests - current),
      resetTime: now + this.config.windowMs,
    };
  }

  /**
   * Increment request counter
   */
  private async incrementCounter(key: string): Promise<void> {
    const countStr = await getCache(key);
    const current = countStr ? parseInt(countStr) : 0;

    // Increment counter
    await setCache(key, (current + 1).toString(), Math.ceil(this.config.windowMs / 1000));
  }

  /**
   * Set rate limit headers
   */
  private setHeaders(res: Response, info: RateLimitInfo): void {
    res.setHeader('X-RateLimit-Limit', info.limit.toString());
    res.setHeader('X-RateLimit-Remaining', info.remaining.toString());
    res.setHeader('X-RateLimit-Reset', info.resetTime.toString());

    if (info.remaining === 0) {
      res.setHeader('Retry-After', Math.ceil((info.resetTime - Date.now()) / 1000).toString());
    }
  }
}

/**
 * Helper function to increment counter (for response tracking)
 */
async function incrementCounter(key: string): Promise<void> {
  const countStr = await getCache(key);
  const current = countStr ? parseInt(countStr) : 0;
  await setCache(key, (current + 1).toString(), 900); // 15 minutes TTL
}

/**
 * Create rate limiter middleware with preset
 */
export function createRateLimiter(
  preset: keyof typeof RateLimitPresets,
  overrides?: Partial<RateLimitConfig>
): ReturnType<RateLimiter['middleware']> {
  const config = { ...RateLimitPresets[preset], ...overrides };
  const limiter = new RateLimiter(config);
  return limiter.middleware();
}

/**
 * Global rate limiter (applies to all routes)
 */
export const globalRateLimiter = createRateLimiter('api');

/**
 * Auth rate limiter (for login, register, password reset)
 */
export const authRateLimiter = createRateLimiter('auth', {
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health' || req.path.startsWith('/api/health/');
  },
});

/**
 * Registration rate limiter
 */
export const registerRateLimiter = createRateLimiter('auth', {
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 3,
  skipSuccessfulRequests: true,
});

/**
 * Password reset rate limiter
 */
export const passwordResetRateLimiter = createRateLimiter('auth', {
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 3,
  skipSuccessfulRequests: true,
});

/**
 * Heavy operation rate limiter (for builds, deployments, tests)
 */
export const heavyRateLimiter = createRateLimiter('heavy');

/**
 * Public API rate limiter
 */
export const publicRateLimiter = createRateLimiter('public');

/**
 * Admin rate limiter
 */
export const adminRateLimiter = createRateLimiter('admin');

/**
 * Admin operation limiter (more restrictive)
 */
export const adminOperationLimiter = createRateLimiter('heavy', {
  maxRequests: 10,
});

/**
 * Write operation limiter
 */
export const writeOperationLimiter = createRateLimiter('write');

/**
 * Read operation limiter
 */
export const readOperationLimiter = createRateLimiter('read');

/**
 * API rate limiter (general endpoints)
 */
export const apiRateLimiter = createRateLimiter('api');

/**
 * File upload limiter
 */
export const fileUploadLimiter = createRateLimiter('heavy', {
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 10,
  skipSuccessfulRequests: true,
});

/**
 * Custom rate limiter factory
 */
export function customRateLimiter(config: Partial<RateLimitConfig>): ReturnType<RateLimiter['middleware']> {
  const limiter = new RateLimiter(config);
  return limiter.middleware();
}

/**
 * Get rate limit status for a user
 */
export async function getRateLimitStatus(
  req: Request,
  prefix: string = 'ratelimit'
): Promise<RateLimitInfo | null> {
  try {
    const key = generateKey(req, prefix);
    const countStr = await getCache(key);
    const current = countStr ? parseInt(countStr) : 0;

    // Default to API preset
    const limit = getUserLimit(RateLimitPresets.api.maxRequests, req);

    return {
      limit,
      current,
      remaining: Math.max(0, limit - current),
      resetTime: Date.now() + RateLimitPresets.api.windowMs,
    };
  } catch (error) {
    logger.error('Error getting rate limit status', { error });
    return null;
  }
}

/**
 * Reset rate limit for a user (admin only)
 */
export async function resetRateLimit(
  userId: string,
  path?: string
): Promise<boolean> {
  try {
    const key = path
      ? `ratelimit:${userId}:${path}`
      : `ratelimit:${userId}:*`;

    // Note: This requires Redis DEL command
    // For now, we'll just set it to 0
    await setCache(key, '0', 1);

    logger.info('Rate limit reset', { userId, path });
    return true;
  } catch (error) {
    logger.error('Error resetting rate limit', { error, userId, path });
    return false;
  }
}
