# Sentry Error Tracking - Complete Integration Guide

## Overview

Sentry is fully integrated into the GoLive DevOps Platform for comprehensive error tracking, performance monitoring, and alerting across both backend and frontend applications.

## What's Implemented

### Backend (Node.js/Express)
- ✅ Automatic error capture for all uncaught exceptions
- ✅ Request breadcrumbs for debugging context
- ✅ User context tracking (attached to JWT authentication)
- ✅ Performance monitoring with transaction tracing
- ✅ Source maps for accurate stack traces
- ✅ Custom tags and metadata
- ✅ Sensitive data filtering (passwords, tokens, etc.)

### Frontend (Next.js/React)
- ✅ Client-side JavaScript error tracking
- ✅ Server-side rendering (SSR) error capture
- ✅ Edge runtime error tracking
- ✅ Session Replay for debugging user sessions
- ✅ Performance monitoring (Web Vitals)
- ✅ Source map upload for minified code
- ✅ Browser extension filtering

##Quick Start

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io) and sign up
2. Create a new organization: "golive" (or your org name)
3. Create two projects:
   - **golive-backend** (Platform: Node.js/Express)
   - **golive-frontend** (Platform: Next.js)

### 2. Get Your DSN Keys

Each project has a unique DSN (Data Source Name):

**Backend DSN**:
```
Settings → Projects → golive-backend → Client Keys (DSN)
Example: https://abc123@o123456.ingest.sentry.io/123456
```

**Frontend DSN**:
```
Settings → Projects → golive-frontend → Client Keys (DSN)
Example: https://def456@o123456.ingest.sentry.io/789012
```

### 3. Configure Environment Variables

**Backend** (`backend/api-gateway/.env`):
```bash
SENTRY_DSN="https://abc123@o123456.ingest.sentry.io/123456"
SENTRY_ENVIRONMENT="development"  # or staging, production
SENTRY_RELEASE="v1.0.0"  # optional: your app version
```

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_SENTRY_DSN="https://def456@o123456.ingest.sentry.io/789012"
NEXT_PUBLIC_ENV="development"

# For source map uploads (optional, for production)
SENTRY_ORG="golive"
SENTRY_PROJECT="golive-frontend"
SENTRY_AUTH_TOKEN="your-auth-token-here"
```

### 4. Test the Integration

**Backend Test**:
```bash
# The backend will log Sentry initialization on startup
cd backend/api-gateway
npm run dev

# Look for:
# [Sentry] Initialized successfully
# [Sentry] Environment: development
```

**Frontend Test**:
```bash
cd frontend
npm run dev

# Look for:
# [Sentry Client] Initialized successfully
# [Sentry Server] Initialized successfully
```

### 5. Trigger a Test Error

**Backend**:
```bash
# Send a test error to Sentry
curl http://localhost:8000/api/test-sentry-error
```

**Frontend**:
```javascript
// Add this temporarily to any page component
throw new Error('[Test] Frontend Sentry Integration');
```

Check your Sentry dashboard - you should see the error appear within seconds!

---

## Backend Integration Details

### File Structure

```
backend/api-gateway/src/
└── config/
    └── sentry.ts          # Sentry configuration and utilities
```

### How It Works

1. **Initialization** ([server.ts:59](backend/api-gateway/src/server.ts#L59))
   ```typescript
   initSentry();  // Must be FIRST
   ```

2. **Request Tracking** ([server.ts:69-72](backend/api-gateway/src/server.ts#L69-L72))
   ```typescript
   app.use(sentryRequestHandler());    // Capture request data
   app.use(sentryTracingHandler());     // Performance monitoring
   ```

3. **User Context** ([server.ts:308-309](backend/api-gateway/src/server.ts#L308-L309))
   ```typescript
   app.use(sentryUserContextMiddleware);   // Attach user info
   app.use(sentryContextMiddleware);       // Add custom tags
   ```

4. **Error Handler** ([server.ts:402](backend/api-gateway/src/server.ts#L402))
   ```typescript
   app.use(sentryErrorHandler());  // Must be BEFORE other error handlers
   ```

### Manual Error Tracking

Use Sentry utilities anywhere in your code:

```typescript
import { captureException, captureMessage, setUser, setTag, addBreadcrumb } from './config/sentry';

// Capture exception with context
try {
  await riskyOperation();
} catch (error) {
  captureException(error as Error, {
    tags: { operation: 'risky-operation' },
    extra: { userId: user.id },
    level: 'error'
  });
}

// Log informational message
captureMessage('Pipeline started', 'info', {
  tags: { pipelineId: pipeline.id }
});

// Set user context
setUser({
  id: user.id,
  email: user.email,
  username: user.username
});

// Add breadcrumb for debugging
addBreadcrumb({
  message: 'User clicked deploy button',
  category: 'ui',
  level: 'info',
  data: { deploymentId: deployment.id }
});

// Add custom tag
setTag('feature', 'auto-deployment');
```

### Performance Monitoring

```typescript
import { startTransaction } from './config/sentry';

// Track slow operations
const transaction = startTransaction('process-pipeline', 'task');

try {
  await processLongRunningTask();
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

### Data Filtering

Sentry automatically filters sensitive data:

**Filtered Fields**:
- `password`
- `token`
- `api_key`
- `secret`
- `authorization` (headers)
- `cookie` (headers)

**Custom Filtering** ([sentry.ts:92-122](backend/api-gateway/src/config/sentry.ts#L92-L122)):
```typescript
beforeSend(event, hint) {
  // Remove authorization headers
  if (event.request?.headers) {
    delete event.request.headers.authorization;
    delete event.request.headers.cookie;
  }

  // Filter sensitive query params
  if (event.request?.query_string?.includes('password')) {
    event.request.query_string = '[FILTERED]';
  }

  return event;
}
```

---

## Frontend Integration Details

### File Structure

```
frontend/
├── sentry.client.config.ts    # Browser error tracking
├── sentry.server.config.ts    # Next.js server error tracking
├── sentry.edge.config.ts      # Edge middleware error tracking
└── next.config.js             # Source map configuration
```

### Features

#### 1. Session Replay

Replay user sessions leading up to an error:

```typescript
// Automatically enabled in production
replaysSessionSampleRate: 0.1,  // 10% of sessions
replaysOnErrorSampleRate: 1.0,  // 100% of error sessions
```

**Privacy**:
- All text is masked by default
- Media elements are blocked
- Sensitive inputs are filtered

#### 2. Performance Monitoring

Tracks:
- Page load times
- API request durations
- Component render times
- Web Vitals (LCP, FID, CLS)

#### 3. Error Boundary

Wrap components to catch React errors:

```typescript
import * as Sentry from '@sentry/nextjs';

export default function MyApp({ Component, pageProps }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div>
          <h1>An error occurred</h1>
          <button onClick={resetError}>Try again</button>
        </div>
      )}
      showDialog
    >
      <Component {...pageProps} />
    </Sentry.ErrorBoundary>
  );
}
```

#### 4. Manual Error Tracking

```typescript
import * as Sentry from '@sentry/nextjs';

// Capture error
try {
  await fetchData();
} catch (error) {
  Sentry.captureException(error);
}

// Add user context
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.username
});

// Add breadcrumb
Sentry.addBreadcrumb({
  category: 'navigation',
  message: 'User navigated to dashboard',
  level: 'info'
});
```

---

## Alert Configuration

### Location
`.sentry/alerts.yaml` - Comprehensive alert rules

### Available Alerts

1. **High Error Rate** - 100+ errors/minute
2. **Database Connection Failures** - DB errors detected
3. **Authentication Failures** - 50+ auth errors in 5min
4. **Slow API Responses** - Response time > 3s
5. **Memory Usage Spike** - Memory > 80%
6. **Pipeline Failures** - CI/CD errors
7. **Test Suite Failures** - Testing errors
8. **Deployment Failures** - Deployment errors
9. **Frontend JavaScript Errors** - 50+ JS errors in 5min
10. **Internal Server Errors (500)** - 10+ in 5min
11. **CSRF Protection Failures** - CSRF errors
12. **Rate Limit Exceeded** - 100+ rate limit hits in 5min

### Setting Up Alerts

1. Go to Sentry Dashboard → Alerts → Create Alert Rule
2. Choose alert type (e.g., "Error" or "Metric")
3. Configure conditions (frequency, thresholds)
4. Add notification actions (Slack, Email, PagerDuty)
5. Test the alert

### Slack Integration

1. Create Slack Incoming Webhook:
   ```
   Slack → Apps → Incoming Webhooks → Add to Channel
   ```

2. Add to Sentry:
   ```
   Settings → Integrations → Slack → Configure
   ```

3. Configure alert channels:
   - `#alerts-critical` - Critical production issues
   - `#alerts-database` - Database errors
   - `#security-alerts` - Security issues
   - `#performance-alerts` - Performance degradation
   - `#devops-alerts` - Pipeline/infrastructure
   - `#frontend-alerts` - Frontend errors

### PagerDuty Integration

1. Get integration key from PagerDuty
2. Add to Sentry:
   ```
   Settings → Integrations → PagerDuty → Configure
   ```

3. Configure for critical alerts only

---

## Source Maps

### Backend

Source maps are automatically generated:

```json
// tsconfig.json
{
  "compilerOptions": {
    "sourceMap": true
  }
}
```

Stack traces will point to original TypeScript files!

### Frontend

Source maps are uploaded to Sentry on production builds:

```javascript
// next.config.js
productionBrowserSourceMaps: true  // Generate maps
```

**Upload** (automatic during build when `SENTRY_AUTH_TOKEN` is set):
```bash
npm run build  # Automatically uploads source maps to Sentry
```

**Manual Upload**:
```bash
npx @sentry/cli releases files <release> upload-sourcemaps ./out
```

---

## Environment Configuration

### Development

```bash
# Backend
SENTRY_DSN=""  # Leave empty to disable
SENTRY_ENVIRONMENT="development"

# Frontend
NEXT_PUBLIC_SENTRY_DSN=""  # Leave empty to disable
NEXT_PUBLIC_ENV="development"
```

**Behavior**:
- 100% of transactions tracked
- All errors captured
- Verbose logging
- No PagerDuty alerts

### Staging

```bash
# Backend
SENTRY_DSN="https://..."
SENTRY_ENVIRONMENT="staging"

# Frontend
NEXT_PUBLIC_SENTRY_DSN="https://..."
NEXT_PUBLIC_ENV="staging"
```

**Behavior**:
- 50% of transactions sampled
- All errors captured
- Slack notifications only
- No PagerDuty alerts

### Production

```bash
# Backend
SENTRY_DSN="https://..."
SENTRY_ENVIRONMENT="production"
SENTRY_RELEASE="v1.2.3"  # Git tag or commit SHA

# Frontend
NEXT_PUBLIC_SENTRY_DSN="https://..."
NEXT_PUBLIC_ENV="production"
SENTRY_ORG="golive"
SENTRY_PROJECT="golive-frontend"
SENTRY_AUTH_TOKEN="<auth-token>"
```

**Behavior**:
- 10% of transactions sampled
- All errors captured
- Full alerting (Slack + PagerDuty)
- Source maps uploaded

---

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
captureMessage('Info message', 'info');      // FYI
captureMessage('Warning', 'warning');         // Potential issue
captureException(error, { level: 'error' });  // Actual error
captureException(error, { level: 'fatal' });  // Critical failure
```

### 2. Add Context

```typescript
captureException(error, {
  tags: {
    feature: 'deployment',
    environment: 'production',
    version: 'v1.2.3'
  },
  extra: {
    deploymentId: deployment.id,
    userId: user.id,
    metadata: deployment.metadata
  },
  user: {
    id: user.id,
    email: user.email
  }
});
```

### 3. Use Breadcrumbs

```typescript
addBreadcrumb({ message: 'Started deployment', category: 'deployment' });
addBreadcrumb({ message: 'Built Docker image', category: 'deployment' });
addBreadcrumb({ message: 'Pushed to registry', category: 'deployment' });
// ... error occurs ...
// Sentry shows full breadcrumb trail!
```

### 4. Filter Noise

```typescript
// Ignore expected errors
ignoreErrors: [
  'ResizeObserver loop limit exceeded',
  'Network request failed',
  'Hydration failed'
]
```

### 5. Release Tracking

```bash
# Set release on deployment
export SENTRY_RELEASE=$(git rev-parse HEAD)

# Or use version tags
export SENTRY_RELEASE="v1.2.3"
```

### 6. Monitor Performance

```typescript
// Track slow database queries
const transaction = startTransaction('database-query', 'db');
const span = transaction.startChild({ op: 'db.query', description: 'SELECT * FROM users' });

await database.query('SELECT * FROM users');

span.finish();
transaction.finish();
```

---

## Troubleshooting

### Sentry Not Initializing

**Check**:
```bash
# Backend logs should show:
[Sentry] Initialized successfully
[Sentry] Environment: development

# Frontend console should show:
[Sentry Client] Initialized successfully
[Sentry Server] Initialized successfully
```

**If missing**:
- Verify `SENTRY_DSN` is set correctly
- Check DSN format: `https://<key>@<org>.ingest.sentry.io/<project>`
- Ensure not in test environment (Sentry disabled for tests)

### Errors Not Appearing in Sentry

**Check**:
1. Is DSN configured?
2. Is environment production/staging? (dev might be filtered)
3. Check browser console for Sentry upload errors
4. Verify project ID in DSN matches Sentry project

### Source Maps Not Working

**Backend**:
- Verify `tsconfig.json` has `"sourceMap": true`
- Check `dist/` folder contains `.js.map` files

**Frontend**:
- Set `SENTRY_AUTH_TOKEN` in `.env.local`
- Run `npm run build` and check for upload logs
- Verify `productionBrowserSourceMaps: true` in `next.config.js`

### Performance Data Missing

**Check sample rates**:
```typescript
tracesSampleRate: 0.1  // 10% of transactions tracked

// Increase for more data (higher cost)
tracesSampleRate: 1.0  // 100% of transactions
```

### Alerts Not Firing

**Verify**:
1. Alert rule is enabled
2. Conditions match your error pattern
3. Notification integration is configured
4. Check alert history in Sentry dashboard

---

## Cost Optimization

Sentry pricing is based on:
- Number of errors
- Number of transactions (performance monitoring)
- Session replays

### Free Tier
- 5,000 errors/month
- 10,000 transactions/month
- Limited team members

### Reducing Costs

1. **Adjust Sample Rates** (production):
   ```typescript
   tracesSampleRate: 0.05,  // 5% instead of 10%
   replaysSessionSampleRate: 0.05,  // 5% instead of 10%
   ```

2. **Filter Noisy Errors**:
   ```typescript
   ignoreErrors: [
     'ResizeObserver',
     'Network request failed',
     'Chrome extension errors'
   ]
   ```

3. **Use Spike Protection**:
   ```
   Settings → Data → Spike Protection → Enable
   ```

4. **Monitor Quota**:
   ```
   Settings → Subscription → Usage & Billing
   ```

---

## Security Considerations

### Data Privacy

✅ **Automatically filtered**:
- Authorization headers
- Cookies
- Passwords in request bodies
- API keys in URLs
- Secret tokens

### PII (Personally Identifiable Information)

Configure PII scrubbing:
```
Settings → Security & Privacy → Data Scrubbing → Enable
```

### IP Addresses

Prevent IP logging:
```
Settings → Security & Privacy → Prevent Storing of IP Addresses → Enable
```

### GDPR Compliance

Sentry is GDPR compliant:
- Data Processing Agreement available
- EU data residency option
- Right to deletion supported

---

## Monitoring Dashboard

### Key Metrics to Watch

1. **Error Rate**: Errors per minute
2. **Apdex Score**: User satisfaction (performance)
3. **Transaction Duration**: P50, P75, P95, P99
4. **Browser Distribution**: Which browsers have most errors
5. **Release Health**: Crash-free sessions per release

### Creating Dashboards

1. Go to Dashboards → Create Dashboard
2. Add widgets:
   - Error frequency over time
   - Top 10 errors
   - Slowest transactions
   - Browser/OS distribution
   - Release comparison

### Custom Queries

```sql
-- Errors by user
SELECT user.email, COUNT() as error_count
FROM errors
WHERE timestamp > now() - INTERVAL '7 days'
GROUP BY user.email
ORDER BY error_count DESC
LIMIT 10
```

---

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/deploy.yml`:

```yaml
- name: Create Sentry Release
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: golive
    SENTRY_PROJECT: golive-backend
  run: |
    # Install Sentry CLI
    curl -sL https://sentry.io/get-cli/ | bash

    # Create release
    export SENTRY_RELEASE=$(git rev-parse HEAD)
    sentry-cli releases new $SENTRY_RELEASE

    # Associate commits
    sentry-cli releases set-commits $SENTRY_RELEASE --auto

    # Finalize release
    sentry-cli releases finalize $SENTRY_RELEASE

- name: Deploy Application
  run: ./deploy.sh

- name: Mark Deployment in Sentry
  run: |
    sentry-cli releases deploys $SENTRY_RELEASE new -e production
```

---

## Support & Resources

### Documentation
- **Sentry Docs**: https://docs.sentry.io/
- **Node.js SDK**: https://docs.sentry.io/platforms/node/
- **Next.js SDK**: https://docs.sentry.io/platforms/javascript/guides/nextjs/

### Internal Files
- Backend config: [backend/api-gateway/src/config/sentry.ts](backend/api-gateway/src/config/sentry.ts)
- Frontend client: [frontend/sentry.client.config.ts](frontend/sentry.client.config.ts)
- Frontend server: [frontend/sentry.server.config.ts](frontend/sentry.server.config.ts)
- Alert rules: [.sentry/alerts.yaml](.sentry/alerts.yaml)

### Community
- Sentry Discord: https://discord.gg/sentry
- GitHub Issues: https://github.com/getsentry/sentry
- Stack Overflow: Tag `sentry`

---

**Status**: ✅ Sentry Integration Complete
**Implementation Date**: October 23, 2025
**Coverage**: Backend (Node.js) + Frontend (Next.js)
**Features**: Error Tracking, Performance Monitoring, Session Replay, Alerts
