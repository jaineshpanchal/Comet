import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Edge Runtime Configuration for GoLive Frontend
 *
 * This runs on edge middleware and captures:
 * - Middleware errors
 * - Edge function errors
 * - Edge API route errors
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
const ENVIRONMENT = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Adjust sample rate for production
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Custom tags
    initialScope: {
      tags: {
        service: 'frontend',
        component: 'nextjs-edge',
      },
    },
  });

  console.log('[Sentry Edge] Initialized successfully');
} else {
  console.log('[Sentry Edge] Not initialized - DSN not provided');
}
