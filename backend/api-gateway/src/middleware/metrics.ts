import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestsInProgress = new client.Gauge({
  name: 'http_requests_in_progress',
  help: 'Number of HTTP requests in progress',
  labelNames: ['method', 'route'],
  registers: [register]
});

const authAttemptsTotal = new client.Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['status', 'type'],
  registers: [register]
});

const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register]
});

const databaseErrors = new client.Counter({
  name: 'database_errors_total',
  help: 'Total number of database errors',
  labelNames: ['operation', 'error_type'],
  registers: [register]
});

const cacheHits = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register]
});

const cacheMisses = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register]
});

/**
 * Middleware to collect HTTP request metrics
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const route = req.route?.path || req.path || 'unknown';

  // Increment in-progress counter
  httpRequestsInProgress.inc({ method: req.method, route });

  // Override res.end to capture metrics when response completes
  const originalEnd = res.end.bind(res);
  res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
    const duration = (Date.now() - start) / 1000;
    const statusCode = res.statusCode.toString();

    // Record metrics
    httpRequestDuration.observe(
      { method: req.method, route, status_code: statusCode },
      duration
    );
    httpRequestTotal.inc({ method: req.method, route, status_code: statusCode });
    httpRequestsInProgress.dec({ method: req.method, route });

    // Call original end function
    return originalEnd(chunk, encoding, callback);
  } as any;

  next();
};

/**
 * Metrics exposure endpoint handler
 */
export const metricsHandler = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
};

/**
 * Record authentication attempt metrics
 */
export const recordAuthAttempt = (status: 'success' | 'failure', type: 'login' | 'register' | 'refresh') => {
  authAttemptsTotal.inc({ status, type });
};

/**
 * Record database query metrics
 */
export const recordDatabaseQuery = (operation: string, table: string, duration: number) => {
  databaseQueryDuration.observe({ operation, table }, duration / 1000);
};

/**
 * Record database error metrics
 */
export const recordDatabaseError = (operation: string, errorType: string) => {
  databaseErrors.inc({ operation, error_type: errorType });
};

/**
 * Record cache hit metrics
 */
export const recordCacheHit = (cacheType: string = 'redis') => {
  cacheHits.inc({ cache_type: cacheType });
};

/**
 * Record cache miss metrics
 */
export const recordCacheMiss = (cacheType: string = 'redis') => {
  cacheMisses.inc({ cache_type: cacheType });
};

export { register };
