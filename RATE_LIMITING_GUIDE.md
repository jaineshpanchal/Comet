# Rate Limiting Guide

## Overview

GoLive Platform implements comprehensive, Redis-based distributed rate limiting to protect against abuse and ensure fair resource allocation across all users.

## Key Features

- ✅ **Redis-based distributed rate limiting** - Works across multiple instances
- ✅ **Per-endpoint configuration** - Different limits for different operations
- ✅ **Role-based tiered limits** - Higher limits for privileged users
- ✅ **User and IP-based tracking** - Tracks both authenticated users and anonymous IPs
- ✅ **Sliding window algorithm** - Smooth rate limiting without bursts
- ✅ **Standard rate limit headers** - X-RateLimit-* headers for client awareness
- ✅ **Automatic cleanup** - Expired keys are automatically removed
- ✅ **Admin management** - View and reset rate limits via API

## Rate Limit Presets

### Authentication Endpoints
**Preset**: `auth`
- **Window**: 15 minutes
- **Max Requests**: 5
- **Use Case**: Login, register, password reset
- **Protection**: Prevents brute force attacks

### API Endpoints (General)
**Preset**: `api`
- **Window**: 15 minutes
- **Max Requests**: 100
- **Use Case**: General API operations
- **Protection**: Standard API protection

### Heavy Operations
**Preset**: `heavy`
- **Window**: 1 hour
- **Max Requests**: 10
- **Use Case**: Builds, deployments, test runs, file uploads
- **Protection**: Prevents resource exhaustion

### Public Endpoints
**Preset**: `public`
- **Window**: 1 minute
- **Max Requests**: 20
- **Use Case**: Unauthenticated access
- **Protection**: Rapid request protection

### Admin Endpoints
**Preset**: `admin`
- **Window**: 15 minutes
- **Max Requests**: 500
- **Use Case**: Administrative operations
- **Protection**: High limit for admin tasks

### Write Operations
**Preset**: `write`
- **Window**: 15 minutes
- **Max Requests**: 30
- **Use Case**: Create, update, delete operations
- **Protection**: Prevents excessive modifications

### Read Operations
**Preset**: `read`
- **Window**: 15 minutes
- **Max Requests**: 200
- **Use Case**: GET requests, data retrieval
- **Protection**: Higher limit for read-only operations

## Role-Based Multipliers

Rate limits are automatically adjusted based on user roles:

| Role | Multiplier | Example (API Preset) |
|------|------------|----------------------|
| ADMIN | 5x | 500 requests / 15 min |
| MANAGER | 3x | 300 requests / 15 min |
| DEVELOPER | 2x | 200 requests / 15 min |
| TESTER | 1.5x | 150 requests / 15 min |
| VIEWER | 1x | 100 requests / 15 min |
| Unauthenticated | 1x | 100 requests / 15 min |

## Rate Limit Headers

Every response includes these headers:

```
X-RateLimit-Limit: 100          # Maximum requests allowed
X-RateLimit-Remaining: 95       # Requests remaining in window
X-RateLimit-Reset: 1698765432   # Unix timestamp when limit resets
Retry-After: 300                # Seconds to wait (only if limit exceeded)
```

## Using Rate Limiters in Code

### Basic Usage

```typescript
import { authRateLimiter, apiRateLimiter } from '../middleware/rateLimiter';

// Apply to specific routes
router.post('/login', authRateLimiter, loginHandler);
router.get('/users', apiRateLimiter, getUsersHandler);
```

### Using Presets

```typescript
import { createRateLimiter } from '../middleware/rateLimiter';

// Create with preset
const myLimiter = createRateLimiter('heavy');

// Create with preset + overrides
const customLimiter = createRateLimiter('api', {
  maxRequests: 50,  // Override max requests
  windowMs: 60000,  // Override window (1 minute)
});
```

### Custom Configuration

```typescript
import { customRateLimiter } from '../middleware/rateLimiter';

const specialLimiter = customRateLimiter({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  maxRequests: 25,
  skipSuccessfulRequests: true,  // Don't count 2xx responses
  skip: (req) => req.path === '/health',  // Skip health checks
  handler: (req, res) => {
    // Custom response
    res.status(429).json({
      error: 'Custom rate limit message',
    });
  },
});
```

### Available Limiters

```typescript
import {
  globalRateLimiter,           // General API limit (100/15min)
  authRateLimiter,             // Auth endpoints (5/15min)
  registerRateLimiter,         // Registration (3/hour)
  passwordResetRateLimiter,    // Password reset (3/hour)
  heavyRateLimiter,            // Heavy ops (10/hour)
  publicRateLimiter,           // Public endpoints (20/min)
  adminRateLimiter,            // Admin endpoints (500/15min)
  adminOperationLimiter,       // Admin operations (10/hour)
  writeOperationLimiter,       // Write ops (30/15min)
  readOperationLimiter,        // Read ops (200/15min)
  apiRateLimiter,              // Standard API (100/15min)
  fileUploadLimiter,           // File uploads (10/hour)
} from '../middleware/rateLimiter';
```

## Admin API Endpoints

### Get Rate Limit Status
Get your current rate limit status:

```bash
GET /api/v1/rate-limits/status
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "limit": 200,
    "current": 45,
    "remaining": 155,
    "resetTime": "2025-10-23T23:00:00.000Z",
    "resetIn": 650
  },
  "timestamp": "2025-10-23T22:49:10.000Z"
}
```

### Reset Rate Limit (Admin Only)
Reset rate limit for a specific user:

```bash
POST /api/v1/rate-limits/reset
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userId": "user-123",
  "path": "/api/v1/pipelines"  // Optional: specific path
}
```

**Response**:
```json
{
  "success": true,
  "message": "Rate limit reset successfully",
  "data": {
    "userId": "user-123",
    "path": "/api/v1/pipelines"
  },
  "timestamp": "2025-10-23T22:50:00.000Z"
}
```

### Get Rate Limit Configuration (Admin Only)
View all rate limit presets and configuration:

```bash
GET /api/v1/rate-limits/config
Authorization: Bearer <admin-token>
```

**Response**:
```json
{
  "success": true,
  "data": {
    "presets": {
      "auth": {
        "windowMs": 900000,
        "maxRequests": 5,
        "description": "Authentication endpoints (login, register)"
      },
      "api": {
        "windowMs": 900000,
        "maxRequests": 100,
        "description": "General API endpoints"
      },
      // ... other presets
    },
    "roleMultipliers": {
      "ADMIN": 5,
      "MANAGER": 3,
      "DEVELOPER": 2,
      "TESTER": 1.5,
      "VIEWER": 1
    },
    "features": [
      "Redis-based distributed rate limiting",
      "Per-endpoint configuration",
      // ... other features
    ]
  },
  "timestamp": "2025-10-23T22:51:00.000Z"
}
```

## Error Responses

When rate limit is exceeded:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetTime": 1698765432000,
      "retryAfter": 300
    }
  },
  "timestamp": "2025-10-23T22:52:00.000Z"
}
```

HTTP Status: `429 Too Many Requests`

## Best Practices

### For Developers

1. **Always check rate limit headers** before making requests
2. **Implement exponential backoff** when approaching limits
3. **Cache responses** when possible to reduce request count
4. **Batch operations** instead of making individual requests
5. **Use webhooks** instead of polling for updates

### For Administrators

1. **Monitor rate limit logs** for abuse patterns
2. **Adjust role multipliers** based on usage patterns
3. **Reset limits judiciously** - only for legitimate users
4. **Review configuration regularly** as traffic grows
5. **Set up alerts** for consistent rate limit violations

### Example: Handling Rate Limits in Client

```typescript
async function makeApiRequest(url: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  // Check rate limit headers
  const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0');
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
  const reset = parseInt(response.headers.get('X-RateLimit-Reset') || '0');

  // Warn if approaching limit
  if (remaining < limit * 0.1) {
    console.warn(`Approaching rate limit: ${remaining} requests remaining`);
  }

  // Handle 429 response
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return makeApiRequest(url);  // Retry
  }

  return response.json();
}
```

## Redis Key Structure

Rate limit counters are stored in Redis with the following key pattern:

```
ratelimit:{identifier}:{path}
```

- **identifier**: User ID (if authenticated) or IP address
- **path**: API endpoint path

Examples:
```
ratelimit:user-123:/api/v1/pipelines
ratelimit:192.168.1.1:/api/v1/auth/login
```

Keys automatically expire after the rate limit window.

## Monitoring

### Logs

Rate limit violations are logged with:

```json
{
  "level": "warn",
  "message": "Rate limit exceeded",
  "key": "ratelimit:user-123:/api/v1/pipelines",
  "limit": 100,
  "current": 101,
  "ip": "192.168.1.1",
  "path": "/api/v1/pipelines",
  "user": "user-123",
  "timestamp": "2025-10-23T22:55:00.000Z"
}
```

### Metrics

Track rate limit metrics in your monitoring system:

- `rate_limit.exceeded` - Counter for limit violations
- `rate_limit.requests` - Total requests per endpoint
- `rate_limit.users_limited` - Users hitting limits

## Troubleshooting

### Issue: User consistently hitting rate limits

**Solution**:
1. Check if the user's usage is legitimate
2. Consider upgrading their role for higher limits
3. Temporarily reset their limit: `POST /api/v1/rate-limits/reset`
4. Review if the endpoint's limit is too restrictive

### Issue: Rate limiting not working

**Checklist**:
- [ ] Redis is running and accessible
- [ ] Rate limiter middleware is applied to routes
- [ ] Check Redis for rate limit keys: `redis-cli KEYS "ratelimit:*"`
- [ ] Verify logger output for rate limiter errors

### Issue: Different limits across instances

**Cause**: Using in-memory rate limiting instead of Redis

**Solution**: Ensure all rate limiters use the Redis-based implementation in `middleware/rateLimiter.ts`

## Configuration

### Environment Variables

```bash
# Redis configuration (required for distributed rate limiting)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password  # Optional

# Rate limiting feature flag (optional)
RATE_LIMITING_ENABLED=true
```

### Disabling Rate Limiting (Development Only)

```typescript
// In middleware configuration
const limiter = createRateLimiter('api', {
  skip: (req) => process.env.NODE_ENV === 'development',
});
```

**⚠️ Warning**: Never disable rate limiting in production!

## Migration from Old Rate Limiter

If upgrading from express-rate-limit:

### Old Code
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
```

### New Code
```typescript
import { createRateLimiter } from '../middleware/rateLimiter';

const limiter = createRateLimiter('api', {
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
});
```

## Support

For rate limiting issues:

1. Check logs: `/var/log/golive/api-gateway.log`
2. View Redis keys: `redis-cli KEYS "ratelimit:*"`
3. Check configuration: `GET /api/v1/rate-limits/config`
4. Contact platform administrators

---

**Last Updated**: October 23, 2025
**Version**: 2.0.0 (Redis-based distributed rate limiting)
