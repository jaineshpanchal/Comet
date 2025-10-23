# GoLive API Documentation

## Overview

Complete API reference for the GoLive DevOps Platform. All API endpoints follow RESTful conventions and return standardized JSON responses.

**Base URL**: `http://localhost:8000/api`
**Production**: `https://api.golive.dev/api`
**Version**: v1

## Quick Links

- **Swagger UI**: http://localhost:8000/api/docs
- **OpenAPI JSON**: http://localhost:8000/api/docs.json
- **Postman Collection**: [Download](./postman/GoLive-API.postman_collection.json)

## Authentication

### JWT Bearer Token

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Login Flow

```bash
# 1. Login to get tokens
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "yourpassword"
}

# Response
{
  "success": true,
  "data": {
    "user": {...},
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 86400
    }
  }
}

# 2. Use access token for requests
GET /api/v1/projects
Authorization: Bearer eyJhbGc...

# 3. Refresh when expired
POST /api/auth/refresh
{
  "refreshToken": "eyJhbGc..."
}
```

## Standard Response Format

All API responses follow this structure:

```typescript
{
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  timestamp: string;
  path: string;
  statusCode: number;
}
```

**Success Response**:
```json
{
  "success": true,
  "data": { "id": "123", "name": "Project" },
  "message": "Project retrieved successfully",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "path": "/api/v1/projects/123",
  "statusCode": 200
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Resource not found",
  "message": "Project with ID 123 not found",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "path": "/api/v1/projects/123",
  "statusCode": 404
}
```

## API Endpoints

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request**:
```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "newuser@example.com",
      "username": "newuser",
      "role": "DEVELOPER"
    }
  },
  "message": "User registered successfully"
}
```

#### POST /api/auth/login
Authenticate user and receive JWT tokens.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "DEVELOPER"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400,
      "tokenType": "Bearer"
    }
  }
}
```

#### POST /api/auth/refresh
Refresh an expired access token.

**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

#### POST /api/auth/logout
Invalidate user session and tokens.

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Projects

#### GET /api/v1/projects
List all projects for the authenticated user.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search by name/description
- `status` (string): Filter by status

**Response** (200):
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "proj-123",
        "name": "My Project",
        "description": "Project description",
        "repository": "https://github.com/user/repo",
        "status": "ACTIVE",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### GET /api/v1/projects/:id
Get a specific project by ID.

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "proj-123",
    "name": "My Project",
    "description": "Detailed project description",
    "repository": "https://github.com/user/repo",
    "branch": "main",
    "status": "ACTIVE",
    "settings": {
      "autoDeployEnabled": true,
      "notificationsEnabled": true
    },
    "team": {
      "id": "team-123",
      "name": "Engineering Team"
    },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-15T00:00:00.000Z"
  }
}
```

#### POST /api/v1/projects
Create a new project.

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "name": "New Project",
  "description": "Project description",
  "repository": "https://github.com/user/new-repo",
  "branch": "main",
  "teamId": "team-123"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "proj-456",
    "name": "New Project",
    "status": "ACTIVE"
  },
  "message": "Project created successfully"
}
```

---

### Pipelines

#### GET /api/v1/pipelines
List all CI/CD pipelines.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `projectId` (string): Filter by project
- `status` (string): Filter by status (RUNNING, SUCCESS, FAILED)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "pipelines": [
      {
        "id": "pipe-123",
        "name": "Build & Deploy",
        "projectId": "proj-123",
        "trigger": "GIT_PUSH",
        "status": "ACTIVE",
        "lastRunAt": "2025-10-23T10:00:00.000Z",
        "successRate": 95.5
      }
    ]
  }
}
```

#### POST /api/v1/pipelines/:id/execute
Trigger a pipeline execution.

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "branch": "main",
  "environment": "production",
  "parameters": {
    "skipTests": false,
    "deployTarget": "k8s-prod-cluster"
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "runId": "run-789",
    "pipelineId": "pipe-123",
    "status": "RUNNING",
    "startedAt": "2025-10-23T12:00:00.000Z",
    "estimatedDuration": 300
  },
  "message": "Pipeline execution started"
}
```

---

### Deployments

#### GET /api/v1/deployments
List all deployments.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `projectId` (string): Filter by project
- `environment` (string): Filter by environment
- `status` (string): Filter by status

**Response** (200):
```json
{
  "success": true,
  "data": {
    "deployments": [
      {
        "id": "deploy-123",
        "projectId": "proj-123",
        "environment": "production",
        "version": "v1.2.3",
        "status": "SUCCESS",
        "deployedAt": "2025-10-23T11:00:00.000Z",
        "deployedBy": {
          "id": "user-123",
          "username": "johndoe"
        }
      }
    ]
  }
}
```

---

## Error Codes

| Status Code | Meaning | Description |
|-------------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (duplicate) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily down |

## Rate Limiting

**Limits**:
- Authenticated: 1000 requests per 15 minutes
- Unauthenticated: 100 requests per 15 minutes

**Headers**:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1634567890
```

**Rate Limit Exceeded Response**:
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Please try again later",
  "statusCode": 429
}
```

## Webhooks

Configure webhooks to receive real-time notifications:

**Events**:
- `pipeline.started`
- `pipeline.completed`
- `pipeline.failed`
- `deployment.started`
- `deployment.completed`
- `deployment.failed`

**Webhook Payload**:
```json
{
  "event": "pipeline.completed",
  "timestamp": "2025-10-23T12:00:00.000Z",
  "data": {
    "pipelineId": "pipe-123",
    "runId": "run-789",
    "status": "SUCCESS",
    "duration": 245
  }
}
```

## Code Examples

### cURL

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Get projects (with auth)
curl http://localhost:8000/api/v1/projects \
  -H "Authorization: Bearer eyJhbGc..."

# Create project
curl -X POST http://localhost:8000/api/v1/projects \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"name":"New Project","repository":"https://github.com/user/repo"}'
```

### JavaScript/TypeScript

```typescript
// Login
const login = async () => {
  const response = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'pass123'
    })
  });

  const data = await response.json();
  return data.data.tokens.accessToken;
};

// Get projects
const getProjects = async (token: string) => {
  const response = await fetch('http://localhost:8000/api/v1/projects', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

### Python

```python
import requests

# Login
response = requests.post(
    'http://localhost:8000/api/auth/login',
    json={
        'email': 'user@example.com',
        'password': 'pass123'
    }
)
token = response.json()['data']['tokens']['accessToken']

# Get projects
response = requests.get(
    'http://localhost:8000/api/v1/projects',
    headers={'Authorization': f'Bearer {token}'}
)
projects = response.json()
```

## Testing with Postman

1. Import collection: [GoLive-API.postman_collection.json](./postman/GoLive-API.postman_collection.json)
2. Set environment variables:
   - `base_url`: `http://localhost:8000/api`
   - `access_token`: (auto-set after login)
3. Run authentication request first
4. All other requests will use the token automatically

## Versioning

The API uses URL versioning:

- **v1**: `/api/v1/...` (current)
- **Legacy**: `/api/...` (maps to v1 for backward compatibility)

## CORS

**Allowed Origins** (configurable):
- `http://localhost:3000`
- `http://localhost:3030`
- `https://app.golive.dev`

**Allowed Methods**:
- GET, POST, PUT, PATCH, DELETE, OPTIONS

**Allowed Headers**:
- Content-Type, Authorization, X-Requested-With

## Support

- **Swagger UI**: http://localhost:8000/api/docs
- **GitHub**: https://github.com/your-org/golive
- **Email**: api@golive.dev

---

**Last Updated**: October 23, 2025
**API Version**: 1.0.0
