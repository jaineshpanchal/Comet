# CSRF Protection Implementation Guide

## Overview

Cross-Site Request Forgery (CSRF) protection has been implemented using the `csrf-csrf` package, which provides double-submit cookie CSRF protection. This is a modern, actively-maintained alternative to the deprecated `csurf` package.

## Implementation Details

### Package Used
- **Package**: `csrf-csrf` (modern, actively maintained)
- **Method**: Double-submit cookie pattern
- **Cookie Name**: `__Host-psifi.x-csrf-token`

### Security Features

1. **Double-Submit Cookie Pattern**
   - Generates a unique token per session
   - Stores token in HTTP-only cookie
   - Requires token in request header/body for state-changing operations

2. **Protected Methods**
   - POST, PUT, DELETE, PATCH are protected
   - GET, HEAD, OPTIONS are exempt (read-only operations)

3. **Cookie Security**
   - `httpOnly`: true (prevents JavaScript access)
   - `sameSite`: 'strict' (prevents cross-site requests)
   - `secure`: true in production (HTTPS only)
   - `path`: '/' (site-wide)

## Frontend Integration

### Step 1: Get CSRF Token

Before making any state-changing requests (POST, PUT, DELETE, PATCH), fetch the CSRF token:

```typescript
// Fetch CSRF token (typically on app initialization or login)
const response = await fetch('http://localhost:8000/api/csrf-token', {
  method: 'GET',
  credentials: 'include' // Important: Include cookies
});

const data = await response.json();
const csrfToken = data.data.csrfToken;

// Store token in memory or state management
localStorage.setItem('csrf-token', csrfToken);
```

### Step 2: Include Token in Requests

Include the CSRF token in all state-changing requests:

**Option 1: Request Header (Recommended)**
```typescript
const response = await fetch('http://localhost:8000/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken, // Include CSRF token
    'Authorization': `Bearer ${accessToken}`
  },
  credentials: 'include', // Important: Include cookies
  body: JSON.stringify({
    // your data
  })
});
```

**Option 2: Request Body**
```typescript
const response = await fetch('http://localhost:8000/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  credentials: 'include',
  body: JSON.stringify({
    _csrf: csrfToken, // Include CSRF token in body
    // your other data
  })
});
```

**Option 3: Query Parameter**
```typescript
const response = await fetch(`http://localhost:8000/api/users?_csrf=${csrfToken}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  credentials: 'include',
  body: JSON.stringify({
    // your data
  })
});
```

### Step 3: Handle CSRF Errors

```typescript
const response = await fetch('http://localhost:8000/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
    'Authorization': `Bearer ${accessToken}`
  },
  credentials: 'include',
  body: JSON.stringify(data)
});

if (response.status === 403) {
  const error = await response.json();
  if (error.error === 'Invalid CSRF token') {
    // Token expired or invalid, fetch new token
    await fetchNewCsrfToken();
    // Retry the request
  }
}
```

## React/Next.js Integration Example

### Create CSRF Hook

```typescript
// hooks/useCsrf.ts
import { useState, useEffect } from 'react';

export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    fetchCsrfToken();
  }, []);

  const fetchCsrfToken = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/csrf-token', {
        credentials: 'include'
      });
      const data = await response.json();
      setCsrfToken(data.data.csrfToken);
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  };

  return { csrfToken, refreshToken: fetchCsrfToken };
}
```

### Create API Client with CSRF

```typescript
// lib/apiClient.ts
class ApiClient {
  private csrfToken: string | null = null;
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async initializeCsrf() {
    const response = await fetch(`${this.baseUrl}/api/csrf-token`, {
      credentials: 'include'
    });
    const data = await response.json();
    this.csrfToken = data.data.csrfToken;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET')) {
      if (!this.csrfToken) {
        await this.initializeCsrf();
      }
      headers['X-CSRF-Token'] = this.csrfToken!;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    // Handle CSRF token expiration
    if (response.status === 403) {
      const error = await response.json();
      if (error.error === 'Invalid CSRF token') {
        await this.initializeCsrf();
        // Retry request
        return this.request(endpoint, options);
      }
    }

    return response;
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
}

export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
```

## Exempt Routes

The following routes are exempt from CSRF protection (configured in middleware):

- `/api/auth/login` - Login endpoint
- `/api/auth/register` - Registration endpoint
- `/api/auth/refresh` - Token refresh endpoint
- `/api/webhooks/*` - External webhooks

If you need to add more exempt routes, modify the `exemptPaths` array in `src/middleware/csrf.ts`.

## Testing CSRF Protection

### Test Valid Request

```bash
# Get CSRF token
curl -c cookies.txt http://localhost:8000/api/csrf-token

# Extract token from response
CSRF_TOKEN="<token-from-response>"

# Make protected request with token
curl -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -X POST \
  http://localhost:8000/api/users \
  -d '{"email":"test@example.com"}'
```

### Test Invalid Request (Should Fail)

```bash
# Try without CSRF token (should return 403)
curl -X POST \
  -H "Content-Type: application/json" \
  http://localhost:8000/api/users \
  -d '{"email":"test@example.com"}'
```

## Configuration

### Environment Variables

Add to `.env`:
```bash
CSRF_SECRET=your-super-secret-64-character-csrf-secret-change-in-production
```

Generate a secure secret:
```bash
openssl rand -hex 32
```

### Production Checklist

- [ ] Set `CSRF_SECRET` to a strong, random value
- [ ] Ensure `NODE_ENV=production` for secure cookies
- [ ] Verify HTTPS is enabled (required for secure cookies)
- [ ] Test CSRF protection with automated tests
- [ ] Document CSRF token flow for frontend team
- [ ] Monitor CSRF failures in logs

## Security Best Practices

1. **Always Use HTTPS in Production**
   - Secure cookies require HTTPS
   - Prevents token interception

2. **Rotate CSRF Secret Periodically**
   - Change secret every 90 days
   - Use secrets management system

3. **Monitor CSRF Failures**
   - Track failed CSRF attempts
   - Alert on unusual patterns
   - Investigate suspicious activity

4. **Keep Token in Memory (Not localStorage)**
   - Use React state or in-memory storage
   - Avoid localStorage (XSS vulnerable)
   - Session storage is acceptable

5. **Implement Token Refresh**
   - Handle token expiration gracefully
   - Retry failed requests with new token
   - Show user-friendly error messages

## Troubleshooting

### Issue: "Invalid CSRF token" on every request

**Solution**: Ensure cookies are being sent with requests
```typescript
fetch(url, {
  credentials: 'include' // Required!
});
```

### Issue: CORS blocking CSRF cookie

**Solution**: Update CORS configuration to allow credentials
```typescript
// Already configured in server.ts
cors({
  origin: allowedOrigins,
  credentials: true // Required for cookies
});
```

### Issue: Token works in Postman but not browser

**Solution**: Check cookie SameSite policy
- Development: `sameSite: 'lax'` or `'none'` with `secure: false`
- Production: `sameSite: 'strict'` with `secure: true`

## Files Modified

- `src/middleware/csrf.ts` - CSRF middleware implementation
- `src/server.ts` - Integrated CSRF protection
- `.env` - Added CSRF_SECRET
- `.env.example` - Added CSRF_SECRET template

## Next Steps

1. Update frontend to fetch and use CSRF tokens
2. Add CSRF token tests to test suite
3. Document CSRF flow in API documentation
4. Set up monitoring for CSRF failures
5. Train team on CSRF implementation
