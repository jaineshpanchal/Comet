# API Documentation Guide

## Table of Contents
- [Overview](#overview)
- [Accessing the Documentation](#accessing-the-documentation)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Request/Response Format](#requestresponse-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Code Examples](#code-examples)
- [Adding New Endpoints](#adding-new-endpoints)
- [Best Practices](#best-practices)

---

## Overview

The GoLive API is documented using **OpenAPI 3.0** (formerly Swagger) specification. The interactive documentation provides:

- **Complete API Reference** - All endpoints, parameters, and responses
- **Interactive Testing** - Try API calls directly from the browser
- **Request/Response Examples** - See what data to send and expect
- **Authentication Testing** - Test protected endpoints with JWT tokens
- **Schema Validation** - Automatic request/response validation

**Documentation Stats:**
- **OpenAPI Version:** 3.0.0
- **Total Endpoints:** 59
- **Categories:** 13 (Authentication, Users, Pipelines, Testing, Deployments, etc.)
- **Schemas:** 15+ (User, Pipeline, TestSuite, etc.)

---

## Accessing the Documentation

### Swagger UI (Interactive Documentation)

**URL:** `http://localhost:8000/api/docs`

Features:
- Interactive API explorer
- Try out endpoints with real requests
- View request/response schemas
- Test authentication flows
- Filter endpoints by tag

**Screenshot:**
```
┌────────────────────────────────────────────────────┐
│ GoLive API                                     v1.0│
│ Enterprise DevOps Platform                         │
├────────────────────────────────────────────────────┤
│ Authorize 🔓                                       │
│ ┌──────────────────────────────────────────────┐  │
│ │ Authentication                               │  │
│ │   POST /api/v1/auth/login                    │  │
│ │   POST /api/v1/auth/register                 │  │
│ │   POST /api/v1/auth/refresh                  │  │
│ └──────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────┐  │
│ │ Health                                       │  │
│ │   GET  /api/health                           │  │
│ │   GET  /api/health/detailed                  │  │
│ └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### Raw OpenAPI Specification

**JSON Format:**
```
GET http://localhost:8000/api/docs.json
```

**Use Cases:**
- Import into Postman/Insomnia
- Generate client SDKs
- CI/CD validation
- API contract testing

---

## Authentication

### JWT Bearer Token

All protected endpoints require a JWT access token in the Authorization header.

**1. Login to Get Token**

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@golive.dev",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "demo@golive.dev",
      "username": "demo_user",
      "role": "DEVELOPER"
    }
  }
}
```

**2. Use Token in Requests**

```bash
curl -X GET http://localhost:8000/api/v1/pipelines \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**3. Testing in Swagger UI**

1. Click the **"Authorize"** button (🔓 icon) at the top
2. Enter your access token: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Click **"Authorize"**
4. Click **"Close"**
5. All subsequent requests will include the token

**Token Expiration:**
- **Access Token:** 24 hours
- **Refresh Token:** 7 days

**Refresh Token:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

## API Endpoints

### Categories

#### 1. **Authentication**
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token
- `POST /api/v1/auth/change-password` - Change password (authenticated)

#### 2. **Health**
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health with dependencies
- `GET /api/health/services` - All microservices health
- `GET /api/health/services/{serviceName}` - Specific service health
- `GET /api/health/metrics` - System metrics
- `GET /api/health/readiness` - Kubernetes readiness probe
- `GET /api/health/liveness` - Kubernetes liveness probe

#### 3. **Users**
- `GET /api/v1/users` - List all users (admin only)
- `GET /api/v1/users/{id}` - Get user by ID
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user (admin only)
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile

#### 4. **Pipelines**
- `GET /api/v1/pipelines` - List all pipelines
- `POST /api/v1/pipelines` - Create new pipeline
- `GET /api/v1/pipelines/{id}` - Get pipeline details
- `PUT /api/v1/pipelines/{id}` - Update pipeline
- `DELETE /api/v1/pipelines/{id}` - Delete pipeline
- `POST /api/v1/pipelines/{id}/trigger` - Trigger pipeline run

#### 5. **Pipeline Runs**
- `GET /api/v1/pipelines/{id}/runs` - List pipeline runs
- `GET /api/v1/runs/{id}` - Get run details
- `POST /api/v1/runs/{id}/cancel` - Cancel running pipeline
- `GET /api/v1/runs/{id}/logs` - Get run logs

#### 6. **Testing**
- `GET /api/v1/test-suites` - List test suites
- `POST /api/v1/test-suites` - Create test suite
- `GET /api/v1/test-suites/{id}` - Get test suite details
- `PUT /api/v1/test-suites/{id}` - Update test suite
- `DELETE /api/v1/test-suites/{id}` - Delete test suite
- `POST /api/v1/test-suites/{id}/run` - Run test suite

#### 7. **Test Runs**
- `GET /api/v1/test-runs` - List test runs
- `GET /api/v1/test-runs/{id}` - Get test run details
- `GET /api/v1/test-runs/{id}/results` - Get test results

#### 8. **Projects**
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/{id}` - Get project details
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

#### 9. **Deployments**
- `GET /api/v1/deployments` - List deployments
- `POST /api/v1/deployments` - Create deployment
- `GET /api/v1/deployments/{id}` - Get deployment details
- `POST /api/v1/deployments/{id}/rollback` - Rollback deployment

#### 10. **Integrations**
- `GET /api/v1/integrations` - List integrations
- `POST /api/v1/integrations/github` - Connect GitHub
- `POST /api/v1/integrations/gitlab` - Connect GitLab
- `POST /api/v1/integrations/jira` - Connect JIRA
- `POST /api/v1/integrations/slack` - Connect Slack

#### 11. **AI Services**
- `POST /api/v1/ai/generate-tests` - AI-powered test generation
- `POST /api/v1/ai/analyze-failures` - AI error analysis
- `POST /api/v1/ai/optimize-pipeline` - AI pipeline optimization

#### 12. **Monitoring**
- `GET /api/v1/metrics` - Application metrics
- `GET /api/v1/alerts` - Active alerts
- `POST /api/v1/alerts/{id}/acknowledge` - Acknowledge alert

#### 13. **Rate Limiting**
- `GET /api/v1/rate-limit/status` - Check your rate limit status
- `POST /api/v1/rate-limit/reset` - Reset rate limit (admin only)
- `GET /api/v1/rate-limit/config` - Get rate limit configuration

---

## Request/Response Format

### Standard Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "path": "/api/v1/users",
  "statusCode": 200
}
```

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message",
  "message": "Human-readable error description",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "path": "/api/v1/users",
  "statusCode": 400
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [
      // Array of items
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### Query Parameters for Pagination

```
GET /api/v1/pipelines?page=1&pageSize=20&sortBy=createdAt&order=desc
```

Parameters:
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20, max: 100)
- `sortBy` - Field to sort by
- `order` - Sort order: `asc` or `desc`
- `search` - Search term
- `filter` - Filter criteria (JSON)

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Successful, no response body |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or invalid |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Response Examples

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Invalid input data",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  },
  "statusCode": 400
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "error": "Authentication required",
  "message": "Please provide a valid access token",
  "statusCode": 401
}
```

**Permission Error (403):**
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "message": "Admin role required for this operation",
  "statusCode": 403
}
```

**Rate Limit Error (429):**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "statusCode": 429
}
```

**Headers on Rate Limit Error:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1698067200
```

---

## Rate Limiting

### Limits by Role

| Role | Multiplier | Requests/15min |
|------|------------|----------------|
| ADMIN | 5x | 500 |
| MANAGER | 3x | 300 |
| DEVELOPER | 2x | 200 |
| TESTER | 1.5x | 150 |
| VIEWER | 1x | 100 |
| Anonymous | 0.5x | 50 |

### Checking Your Rate Limit

```bash
curl -X GET http://localhost:8000/api/v1/rate-limit/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "limit": 200,
    "current": 45,
    "remaining": 155,
    "resetTime": "2025-10-23T12:15:00.000Z"
  }
}
```

### Rate Limit Headers

Every API response includes rate limit headers:

```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 155
X-RateLimit-Reset: 1698067200
```

---

## Code Examples

### JavaScript (Fetch)

```javascript
// Login
async function login(email, password) {
  const response = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  return data.data.accessToken;
}

// Get pipelines
async function getPipelines(accessToken) {
  const response = await fetch('http://localhost:8000/api/v1/pipelines', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  const data = await response.json();
  return data.data;
}

// Usage
const token = await login('demo@golive.dev', 'password123');
const pipelines = await getPipelines(token);
```

### Python (Requests)

```python
import requests

# Login
def login(email, password):
    response = requests.post(
        'http://localhost:8000/api/v1/auth/login',
        json={'email': email, 'password': password}
    )
    data = response.json()
    return data['data']['accessToken']

# Get pipelines
def get_pipelines(access_token):
    response = requests.get(
        'http://localhost:8000/api/v1/pipelines',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    data = response.json()
    return data['data']

# Usage
token = login('demo@golive.dev', 'password123')
pipelines = get_pipelines(token)
```

### cURL

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@golive.dev","password":"password123"}'

# Save token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get pipelines
curl -X GET http://localhost:8000/api/v1/pipelines \
  -H "Authorization: Bearer $TOKEN"

# Create pipeline
curl -X POST http://localhost:8000/api/v1/pipelines \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Deploy",
    "description": "Deploy to production",
    "projectId": "123e4567-e89b-12d3-a456-426614174000",
    "trigger": "MANUAL"
  }'
```

---

## Adding New Endpoints

When adding new API endpoints, document them with JSDoc comments:

### Example

```typescript
/**
 * @swagger
 * /api/v1/pipelines:
 *   get:
 *     summary: List all pipelines
 *     description: Retrieve a paginated list of all CI/CD pipelines
 *     tags: [Pipelines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, ARCHIVED]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of pipelines
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 */
router.get('/pipelines', authenticateToken, async (req, res) => {
  // Implementation
});
```

### JSDoc Sections

1. **Summary** - Brief description (one line)
2. **Description** - Detailed explanation
3. **Tags** - Category for grouping
4. **Security** - Authentication requirements
5. **Parameters** - Query params, path params, headers
6. **RequestBody** - Request body schema
7. **Responses** - All possible responses with schemas

### Common Schema References

```yaml
# Request schemas
$ref: '#/components/schemas/LoginRequest'
$ref: '#/components/schemas/RegisterRequest'
$ref: '#/components/schemas/Pipeline'
$ref: '#/components/schemas/TestSuite'

# Response schemas
$ref: '#/components/schemas/SuccessResponse'
$ref: '#/components/schemas/ErrorResponse'
$ref: '#/components/schemas/PaginatedResponse'
$ref: '#/components/schemas/User'

# Response references
$ref: '#/components/responses/UnauthorizedError'
$ref: '#/components/responses/ForbiddenError'
$ref: '#/components/responses/NotFoundError'
$ref: '#/components/responses/ValidationError'
$ref: '#/components/responses/RateLimitError'
```

---

## Best Practices

### 1. **Use Consistent Response Format**

Always return responses in the standard format:

```typescript
return res.status(200).json({
  success: true,
  data: result,
  message: 'Operation successful',
  timestamp: new Date().toISOString(),
  path: req.path,
  statusCode: 200,
});
```

### 2. **Include Proper HTTP Status Codes**

- `200` - Success (GET, PUT, PATCH)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### 3. **Add Examples to Schemas**

```typescript
properties: {
  email: {
    type: 'string',
    format: 'email',
    example: 'demo@golive.dev'  // ← Add examples
  }
}
```

### 4. **Document All Parameters**

Include all query params, path params, and headers with descriptions and examples.

### 5. **Test in Swagger UI**

After adding documentation, test the endpoint in Swagger UI:
1. Navigate to `http://localhost:8000/api/docs`
2. Find your endpoint
3. Click "Try it out"
4. Fill in parameters
5. Click "Execute"
6. Verify response matches documentation

### 6. **Keep Schemas DRY**

Reuse schema definitions instead of duplicating:

```typescript
// Good - Reuse
schema: { $ref: '#/components/schemas/User' }

// Bad - Duplicate
schema: {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    // ... repeated everywhere
  }
}
```

### 7. **Version Your API**

Use API versioning in URLs:
- `/api/v1/pipelines`
- `/api/v2/pipelines`

Document deprecated versions and migration paths.

---

## Tools and Integrations

### Postman

Import the OpenAPI spec into Postman:

1. Open Postman
2. Click "Import"
3. Enter URL: `http://localhost:8000/api/docs.json`
4. Click "Import"

All endpoints will be available as a Postman collection.

### Insomnia

Same process as Postman - import the OpenAPI JSON URL.

### OpenAPI Generator

Generate client SDKs in any language:

```bash
# JavaScript/TypeScript
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:8000/api/docs.json \
  -g typescript-fetch \
  -o ./api-client

# Python
openapi-generator-cli generate \
  -i http://localhost:8000/api/docs.json \
  -g python \
  -o ./api-client-python

# Java
openapi-generator-cli generate \
  -i http://localhost:8000/api/docs.json \
  -g java \
  -o ./api-client-java
```

### ReDoc

Alternative documentation UI (read-only, cleaner):

```html
<!DOCTYPE html>
<html>
<head>
  <title>GoLive API Docs</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <redoc spec-url='http://localhost:8000/api/docs.json'></redoc>
  <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
</body>
</html>
```

---

## Support and Resources

- **Swagger UI:** http://localhost:8000/api/docs
- **OpenAPI JSON:** http://localhost:8000/api/docs.json
- **OpenAPI Specification:** https://spec.openapis.org/oas/v3.0.0
- **Swagger JSDoc:** https://github.com/Surnet/swagger-jsdoc

---

**Last Updated:** October 23, 2025
**API Version:** 1.0.0
**Maintained By:** GoLive Platform Team
