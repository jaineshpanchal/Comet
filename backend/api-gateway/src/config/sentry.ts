import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Request, Response, NextFunction } from 'express';

/**
 * Sentry Configuration for GoLive Backend
 *
 * Features:
 * - Error tracking and reporting
 * - Performance monitoring
 * - Request breadcrumbs
 * - User context tracking
 * - Custom tags and metadata
 * - Environment-based configuration
 */

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
  enabled: boolean;
}

/**
 * Initialize Sentry
 */
export function initSentry(config?: Partial<SentryConfig>): void {
  const sentryDsn = process.env.SENTRY_DSN || '';
  const environment = process.env.NODE_ENV || 'development';
  const release = process.env.SENTRY_RELEASE || process.env.npm_package_version;

  // Only enable Sentry if DSN is provided and not in test environment
  const enabled = Boolean(sentryDsn) && environment !== 'test';

  if (!enabled) {
    console.log('[Sentry] Not initialized - DSN not provided or test environment');
    return;
  }

  const defaultConfig: SentryConfig = {
    dsn: sentryDsn,
    environment,
    release,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    enabled,
  };

  const finalConfig = { ...defaultConfig, ...config };

  try {
    Sentry.init({
      dsn: finalConfig.dsn,
      environment: finalConfig.environment,
      release: finalConfig.release,

      // Performance Monitoring
      tracesSampleRate: finalConfig.tracesSampleRate,
      profilesSampleRate: finalConfig.profilesSampleRate,

      integrations: [
        // HTTP instrumentation
        new Sentry.Integrations.Http({ tracing: true }),

        // Express instrumentation
        new Sentry.Integrations.Express({ app: undefined }),

        // Profiling
        new ProfilingIntegration(),
      ],

      // Ignore common errors
      ignoreErrors: [
        // Browser/client errors that shouldn't reach backend
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',

        // Network errors
        'NetworkError',
        'Network request failed',

        // Common validation errors (we handle these)
        'ValidationError',
        'Bad Request',
      ],

      // Filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive data from error messages
        if (event.request) {
          // Remove authorization headers
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }

          // Remove sensitive query params
          if (event.request.query_string) {
            const sensitiveParams = ['password', 'token', 'api_key', 'secret'];
            sensitiveParams.forEach(param => {
              if (event.request?.query_string?.includes(param)) {
                event.request.query_string = '[FILTERED]';
              }
            });
          }
        }

        // Remove sensitive data from extra context
        if (event.extra) {
          const sensitiveKeys = ['password', 'token', 'api_key', 'secret', 'authorization'];
          Object.keys(event.extra).forEach(key => {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
              event.extra![key] = '[FILTERED]';
            }
          });
        }

        return event;
      },

      // Custom tags
      initialScope: {
        tags: {
          service: 'api-gateway',
          component: 'backend',
        },
      },
    });

    console.log(`[Sentry] Initialized successfully`);
    console.log(`[Sentry] Environment: ${finalConfig.environment}`);
    console.log(`[Sentry] Release: ${finalConfig.release || 'not set'}`);
    console.log(`[Sentry] Traces Sample Rate: ${finalConfig.tracesSampleRate * 100}%`);
  } catch (error) {
    console.error('[Sentry] Initialization failed:', error);
  }
}

/**
 * Express middleware for Sentry request handler
 * Must be used before any other middleware
 */
export function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler({
    user: ['id', 'email', 'username'],
    ip: true,
    request: true,
  });
}

/**
 * Express middleware for Sentry tracing
 * Must be used after request handler but before routes
 */
export function sentryTracingHandler() {
  return Sentry.Handlers.tracingHandler();
}

/**
 * Express middleware for Sentry error handler
 * Must be used after all routes but before other error handlers
 */
export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code >= 500
      // or errors without status code
      const statusCode = (error as any).statusCode || (error as any).status || 500;
      return statusCode >= 500;
    },
  });
}

/**
 * Capture exception with additional context
 */
export function captureException(
  error: Error,
  context?: {
    user?: { id: string; email?: string; username?: string };
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
): string | undefined {
  return Sentry.captureException(error, {
    level: context?.level || 'error',
    tags: context?.tags,
    extra: context?.extra,
    user: context?.user,
  });
}

/**
 * Capture message with context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
): string | undefined {
  return Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: context?.extra,
  });
}

/**
 * Set user context for error tracking
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: any;
}): void {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Set custom tag
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Set custom context
 */
export function setContext(name: string, context: Record<string, any>): void {
  Sentry.setContext(name, context);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}): void {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string
): Sentry.Transaction {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Middleware to add user context from JWT token
 */
export function sentryUserContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If user is authenticated, set Sentry user context
  if ((req as any).user) {
    const user = (req as any).user;
    setUser({
      id: user.userId || user.id,
      email: user.email,
      username: user.username,
    });
  }

  next();
}

/**
 * Middleware to add custom tags and context
 */
export function sentryContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Add request context
  setContext('request', {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Add custom tags
  setTag('endpoint', `${req.method} ${req.path}`);
  setTag('http.method', req.method);

  if (req.get('x-request-id')) {
    setTag('request_id', req.get('x-request-id') as string);
  }

  next();
}

/**
 * Test Sentry configuration by sending a test error
 */
export function testSentry(): void {
  try {
    throw new Error('[Sentry Test] This is a test error to verify Sentry integration');
  } catch (error) {
    captureException(error as Error, {
      tags: { test: 'true' },
      extra: { timestamp: new Date().toISOString() },
      level: 'info',
    });
    console.log('[Sentry] Test error sent successfully');
  }
}

// Export Sentry for advanced usage
export { Sentry };

export default {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  sentryUserContextMiddleware,
  sentryContextMiddleware,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  setTag,
  setContext,
  addBreadcrumb,
  startTransaction,
  testSentry,
  Sentry,
};
