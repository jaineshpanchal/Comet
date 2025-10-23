import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Client-Side Configuration for GoLive Frontend
 *
 * This runs in the browser and captures:
 * - JavaScript errors
 * - Unhandled promise rejections
 * - Network errors
 * - User interactions
 * - Performance metrics
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
const ENVIRONMENT = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Adjust sample rate for production
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0, // Always capture replays for errors

    integrations: [
      new Sentry.Replay({
        maskAllText: true, // Mask sensitive text
        blockAllMedia: true, // Block media elements
      }),
      new Sentry.BrowserTracing({
        // Custom routing instrumentation for Next.js
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/.*\.golive\.dev/,
          /^https:\/\/api\.golive\.dev/,
        ],
      }),
    ],

    // Ignore common errors
    ignoreErrors: [
      // Random plugins/extensions
      'top.GLOBALS',
      // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'http://tt.epicplay.com',
      "Can't find variable: ZiteReader",
      'jigsaw is not defined',
      'ComboSearch is not defined',
      'http://loading.retry.widdit.com/',
      'atomicFindClose',
      // Facebook borked
      'fb_xd_fragment',
      // ISP "optimizing" proxy - `Cache-Control: no-transform` seems to
      // reduce this. (thanks @acdha)
      // See http://stackoverflow.com/questions/4113268
      'bmi_SafeAddOnload',
      'EBCallBackMessageReceived',
      // See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
      'conduitPage',
      // Generic error code from errors outside the security sandbox
      'Script error.',
      // Avast extension errors
      '_avast_submit',
      // React DevTools
      '__REACT_DEVTOOLS',
      // Chrome extensions
      'chrome-extension://',
      'moz-extension://',
      // Common browser errors
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Network errors
      'NetworkError',
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      // Hydration mismatches (Next.js specific)
      'Hydration failed',
      'Text content does not match',
    ],

    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      // Firefox extensions
      /^moz-extension:\/\//i,
      // Safari extensions
      /^safari-extension:\/\//i,
      // Other plugins
      /127\.0\.0\.1:4001\/isrunning/i, // Cacaoweb
      /webappstoolbarba\.texthelp\.com\//i,
      /metrics\.itunes\.apple\.com\.edgesuite\.net\//i,
    ],

    beforeSend(event, hint) {
      // Filter out errors from browser extensions
      if (event.exception) {
        const frames = event.exception.values?.[0]?.stacktrace?.frames;
        if (frames) {
          const isExtension = frames.some(frame =>
            frame.filename?.includes('extension://') ||
            frame.filename?.includes('chrome-extension://') ||
            frame.filename?.includes('moz-extension://')
          );
          if (isExtension) {
            return null;
          }
        }
      }

      // Add additional context
      if (typeof window !== 'undefined') {
        event.contexts = {
          ...event.contexts,
          browser: {
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            screen: `${window.screen.width}x${window.screen.height}`,
            online: navigator.onLine,
          },
        };
      }

      return event;
    },

    // Custom tags
    initialScope: {
      tags: {
        service: 'frontend',
        component: 'nextjs',
      },
    },
  });

  console.log('[Sentry Client] Initialized successfully');
} else {
  console.log('[Sentry Client] Not initialized - DSN not provided');
}
