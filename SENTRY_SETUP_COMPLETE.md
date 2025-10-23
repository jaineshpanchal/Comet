# Sentry Error Tracking - Setup Complete! ✅

## Overview

Comprehensive error tracking and performance monitoring has been integrated into the GoLive DevOps Platform using Sentry.io.

## What Was Implemented

### 1. Backend Integration (Node.js/Express)

**Files Created**:
- [backend/api-gateway/src/config/sentry.ts](backend/api-gateway/src/config/sentry.ts) - Complete Sentry configuration

**Features**:
- ✅ Automatic error capture for all uncaught exceptions
- ✅ Request/response tracking with breadcrumbs
- ✅ User context (from JWT authentication)
- ✅ Performance monitoring with transaction tracing
- ✅ Source maps enabled (TypeScript → JavaScript)
- ✅ Sensitive data filtering (passwords, tokens, cookies)
- ✅ Custom error levels (info, warning, error, fatal)
- ✅ Manual error tracking utilities

**Integration Points**:
- [server.ts:15](backend/api-gateway/src/server.ts#L15) - Import Sentry utilities
- [server.ts:59](backend/api-gateway/src/server.ts#L59) - Initialize Sentry (FIRST)
- [server.ts:69-72](backend/api-gateway/src/server.ts#L69-L72) - Request & tracing handlers
- [server.ts:308-309](backend/api-gateway/src/server.ts#L308-L309) - User & context middleware
- [server.ts:402](backend/api-gateway/src/server.ts#L402) - Error handler

**Utilities Available**:
```typescript
import {
  captureException,
  captureMessage,
  setUser,
  setTag,
  setContext,
  addBreadcrumb,
  startTransaction
} from './config/sentry';
```

---

### 2. Frontend Integration (Next.js/React)

**Files Created**:
- [frontend/sentry.client.config.ts](frontend/sentry.client.config.ts) - Browser error tracking
- [frontend/sentry.server.config.ts](frontend/sentry.server.config.ts) - Server-side error tracking
- [frontend/sentry.edge.config.ts](frontend/sentry.edge.config.ts) - Edge runtime error tracking

**Features**:
- ✅ Client-side JavaScript error capture
- ✅ Server-side rendering (SSR) error capture
- ✅ Edge middleware error tracking
- ✅ Session Replay (10% of sessions, 100% of errors)
- ✅ Performance monitoring (Web Vitals, page load, API calls)
- ✅ Source map upload for minified code
- ✅ Browser extension filtering
- ✅ Sensitive data masking

**Configuration**:
- [next.config.js](frontend/next.config.js) - Source maps & Sentry webpack plugin

---

### 3. Alert Configuration

**File**: [.sentry/alerts.yaml](.sentry/alerts.yaml)

**12 Pre-configured Alerts**:
1. High Error Rate (100+ errors/min)
2. Database Connection Failures
3. Authentication Failures (50+ in 5min)
4. Slow API Responses (>3s)
5. Memory Usage Spike (>80%)
6. Pipeline Failures
7. Test Suite Failures
8. Deployment Failures
9. Frontend JavaScript Errors (50+ in 5min)
10. Internal Server Errors (500)
11. CSRF Protection Failures
12. Rate Limit Exceeded

**Notification Channels**:
- Slack (6 channels configured)
- PagerDuty (2 services)
- Email (3 recipient groups)

---

### 4. Environment Configuration

**Backend** ([.env.example](backend/api-gateway/.env.example)):
```bash
SENTRY_DSN=""
SENTRY_ENVIRONMENT="development"
SENTRY_RELEASE=""
```

**Frontend** ([.env.example](frontend/.env.example)):
```bash
NEXT_PUBLIC_SENTRY_DSN=""
NEXT_PUBLIC_ENV="development"
SENTRY_ORG=""
SENTRY_PROJECT=""
SENTRY_AUTH_TOKEN=""
```

---

### 5. Documentation

**Complete Guide**: [SENTRY_INTEGRATION.md](SENTRY_INTEGRATION.md)

**Contents**:
- Quick start guide
- Backend integration details
- Frontend integration details
- Alert configuration
- Source map setup
- Environment configuration
- Best practices
- Troubleshooting
- Cost optimization
- Security considerations
- CI/CD integration

---

## Quick Setup

### 1. Create Sentry Account

```bash
# Go to sentry.io and sign up
# Create organization: "golive"
# Create projects:
#   - golive-backend (Node.js/Express)
#   - golive-frontend (Next.js)
```

### 2. Get DSN Keys

```
Backend DSN:
Settings → Projects → golive-backend → Client Keys (DSN)

Frontend DSN:
Settings → Projects → golive-frontend → Client Keys (DSN)
```

### 3. Configure Environment

**Backend** (`backend/api-gateway/.env`):
```bash
SENTRY_DSN="https://YOUR_KEY@YOUR_ORG.ingest.sentry.io/YOUR_PROJECT"
SENTRY_ENVIRONMENT="development"
```

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_SENTRY_DSN="https://YOUR_KEY@YOUR_ORG.ingest.sentry.io/YOUR_PROJECT"
NEXT_PUBLIC_ENV="development"
```

### 4. Start Services

```bash
# Backend
cd backend/api-gateway
npm run dev

# Look for: [Sentry] Initialized successfully

# Frontend
cd frontend
npm run dev

# Look for: [Sentry Client] Initialized successfully
```

### 5. Test Integration

**Backend Test**:
```bash
# Trigger a test error
curl http://localhost:8000/api/test-error

# Or use the test function
import { testSentry } from './config/sentry';
testSentry();
```

**Frontend Test**:
```javascript
// Add temporarily to any page
throw new Error('[Test] Sentry Integration');
```

**Check Sentry Dashboard**:
- Errors should appear within seconds
- Check Issues → All Issues
- Click on error to see full context

---

## Key Features

### Automatic Error Capture

**Backend**:
- All uncaught exceptions → Sentry
- All unhandled promise rejections → Sentry
- HTTP 500 errors → Sentry
- Database errors → Sentry

**Frontend**:
- JavaScript errors → Sentry
- Unhandled promise rejections → Sentry
- React errors → Sentry (with Error Boundary)
- API errors → Sentry

### Context & Debugging

**User Context** (automatic):
```javascript
{
  id: "user123",
  email: "user@example.com",
  username: "johndoe"
}
```

**Request Context** (automatic):
```javascript
{
  method: "POST",
  url: "/api/pipelines",
  headers: { /* filtered */ },
  query: { /* params */ },
  ip: "192.168.1.1"
}
```

**Breadcrumbs** (automatic):
```javascript
[
  { category: "http", message: "GET /api/users", level: "info" },
  { category: "auth", message: "User logged in", level: "info" },
  { category: "database", message: "Query users table", level: "info" },
  { category: "error", message: "Database timeout", level: "error" }
]
```

### Performance Monitoring

**Metrics Tracked**:
- API response times (P50, P75, P95, P99)
- Database query duration
- External API calls
- Page load times (frontend)
- Web Vitals: LCP, FID, CLS (frontend)

**Sample Rates**:
- Development: 100% (all transactions)
- Staging: 50% (half of transactions)
- Production: 10% (cost-optimized)

### Session Replay

**Frontend Only**:
- Records user interactions leading to errors
- Masks sensitive text automatically
- Blocks media elements for privacy
- 10% of sessions, 100% of error sessions

**Use Case**:
1. User reports: "Button doesn't work"
2. Find error in Sentry
3. Watch Session Replay
4. See exactly what user clicked
5. Reproduce and fix bug

---

## Alert Setup

### 1. Configure Slack

**Create Webhooks**:
```
Slack → Apps → Incoming Webhooks → Add to Channel

Create webhooks for:
- #alerts-critical
- #alerts-database
- #security-alerts
- #performance-alerts
- #devops-alerts
- #frontend-alerts
```

**Add to Sentry**:
```
Settings → Integrations → Slack → Configure
Add each webhook URL
```

### 2. Configure PagerDuty

**Get Integration Key**:
```
PagerDuty → Services → Add Integration → Sentry
Copy integration key
```

**Add to Sentry**:
```
Settings → Integrations → PagerDuty → Configure
Paste integration key
```

### 3. Create Alert Rules

**Navigate to**:
```
Sentry Dashboard → Alerts → Create Alert Rule
```

**Example: High Error Rate**:
```
Name: High Error Rate
When: An event occurs
If: count() is greater than 100
In: 1 minute
Environment: production
Then: Send notification to #alerts-critical (Slack)
```

Use [.sentry/alerts.yaml](.sentry/alerts.yaml) as a guide for all 12 alerts.

---

## Usage Examples

### Backend

**Capture Exception**:
```typescript
import { captureException } from './config/sentry';

try {
  await deployPipeline(pipelineId);
} catch (error) {
  captureException(error as Error, {
    tags: {
      pipelineId,
      environment: 'production'
    },
    extra: {
      config: pipelineConfig,
      timestamp: new Date()
    },
    level: 'error'
  });
  throw error;
}
```

**Capture Message**:
```typescript
import { captureMessage } from './config/sentry';

captureMessage('Deployment completed successfully', 'info', {
  tags: {
    deploymentId: deployment.id,
    version: 'v1.2.3'
  }
});
```

**Performance Monitoring**:
```typescript
import { startTransaction } from './config/sentry';

const transaction = startTransaction('process-pipeline', 'task');

try {
  await buildDockerImage();
  await pushToRegistry();
  await deployToKubernetes();

  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

**Add Breadcrumb**:
```typescript
import { addBreadcrumb } from './config/sentry';

addBreadcrumb({
  message: 'User clicked deploy button',
  category: 'ui',
  level: 'info',
  data: {
    deploymentId: deployment.id,
    userId: user.id
  }
});
```

### Frontend

**Capture Error**:
```typescript
import * as Sentry from '@sentry/nextjs';

try {
  await fetchPipelines();
} catch (error) {
  Sentry.captureException(error);
  toast.error('Failed to load pipelines');
}
```

**Set User**:
```typescript
import * as Sentry from '@sentry/nextjs';

// After login
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.username
});

// On logout
Sentry.setUser(null);
```

**Error Boundary**:
```typescript
import * as Sentry from '@sentry/nextjs';

export default function MyApp({ Component, pageProps }) {
  return (
    <Sentry.ErrorBoundary
      fallback={<ErrorFallback />}
      showDialog
    >
      <Component {...pageProps} />
    </Sentry.ErrorBoundary>
  );
}
```

---

## Production Checklist

Before deploying to production:

- [ ] Sentry account created
- [ ] Backend project created in Sentry
- [ ] Frontend project created in Sentry
- [ ] Backend `SENTRY_DSN` configured in production `.env`
- [ ] Frontend `NEXT_PUBLIC_SENTRY_DSN` configured in production `.env`
- [ ] `SENTRY_ENVIRONMENT` set to "production"
- [ ] `SENTRY_RELEASE` set to git commit SHA or version tag
- [ ] Source map upload configured (`SENTRY_AUTH_TOKEN` for frontend)
- [ ] Alert rules created in Sentry dashboard
- [ ] Slack webhooks configured
- [ ] PagerDuty integration configured (for critical alerts)
- [ ] Email notifications configured
- [ ] Test error sent to verify integration
- [ ] Quotas reviewed (errors/transactions per month)
- [ ] Data scrubbing enabled (PII protection)
- [ ] IP address storage disabled (privacy)
- [ ] Team members added to Sentry project

---

## File Summary

**Backend**:
- `backend/api-gateway/src/config/sentry.ts` - Sentry configuration (289 lines)
- `backend/api-gateway/src/server.ts` - Integration points (4 locations)
- `backend/api-gateway/.env.example` - Updated with Sentry variables

**Frontend**:
- `frontend/sentry.client.config.ts` - Client-side config (106 lines)
- `frontend/sentry.server.config.ts` - Server-side config (58 lines)
- `frontend/sentry.edge.config.ts` - Edge runtime config (36 lines)
- `frontend/next.config.js` - Source map & webpack config
- `frontend/.env.example` - Sentry environment variables

**Configuration**:
- `.sentry/alerts.yaml` - 12 alert rules (252 lines)

**Documentation**:
- `SENTRY_INTEGRATION.md` - Complete guide (550+ lines)
- `SENTRY_SETUP_COMPLETE.md` - This file

---

## Metrics

**Lines of Code**: ~1,300 lines
**Configuration Files**: 8 files
**Alert Rules**: 12 pre-configured alerts
**Notification Channels**: 9 channels (6 Slack, 2 PagerDuty, 1 Email)
**Documentation**: 550+ lines

---

## Next Steps

1. **Get Sentry DSN Keys**:
   - Create account at sentry.io
   - Create backend and frontend projects
   - Copy DSN keys

2. **Configure Environment**:
   - Add DSNs to `.env` files
   - Set environment to "development" for testing

3. **Test Integration**:
   - Start backend and frontend
   - Trigger test errors
   - Verify errors appear in Sentry dashboard

4. **Set Up Alerts**:
   - Configure Slack webhooks
   - Create alert rules in Sentry
   - Test notifications

5. **Deploy to Production**:
   - Update production environment variables
   - Enable source map uploads
   - Monitor error rates

---

**Status**: ✅ Sentry Integration Complete
**Implementation Date**: October 23, 2025
**Coverage**: Backend (Node.js) + Frontend (Next.js)
**Features**: Error Tracking, Performance Monitoring, Session Replay, Alerts, Source Maps
**Ready for Production**: Yes (after DSN configuration)
