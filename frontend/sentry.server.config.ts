import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Server-Side Configuration for GoLive Frontend
 *
 * This runs on the Next.js server and captures:
 * - Server-side rendering errors
 * - API route errors
 * - Server component errors
 * - Build-time errors
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
const ENVIRONMENT = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Adjust sample rate for production
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
    ],

    // Ignore errors that are handled by Next.js
    ignoreErrors: [
      'NEXT_NOT_FOUND',
      'NEXT_REDIRECT',
    ],

    beforeSend(event, hint) {
      // Filter sensitive data from server-side errors
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

      return event;
    },

    // Custom tags
    initialScope: {
      tags: {
        service: 'frontend',
        component: 'nextjs-server',
      },
    },
  });

  console.log('[Sentry Server] Initialized successfully');
} else {
  console.log('[Sentry Server] Not initialized - DSN not provided');
}
