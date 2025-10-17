# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Comet is a flagship enterprise DevOps platform providing complete release management, AI-powered testing, code analysis, and seamless integrations. The platform combines a TypeScript/Node.js microservices backend, React/Next.js frontend, and Python AI services.

## Essential Commands

### Development
```bash
# Start all services (from root)
npm run dev                    # Frontend, backend, and AI services concurrently
npm run dev:backend            # Backend services only (port 8000)
npm run dev:frontend           # Frontend only (port 3030)
npm run dev:ai                 # AI services only (port 8001)

# Individual backend services
cd backend && npm run dev:gateway    # API Gateway (port 8000)
cd backend && npm run dev:services   # All microservices

# Testing framework
cd testing-framework && npm run dev  # All testing services
```

### Building
```bash
npm run build                  # Build both frontend and backend
npm run build:backend          # Backend build (TypeScript → dist/)
npm run build:frontend         # Frontend build (Next.js production)
```

### Testing
```bash
# Backend tests
cd backend && npm test                # Run all backend tests
cd backend && npm run test:watch      # Watch mode
cd backend && npm run test:coverage   # With coverage report

# Frontend tests
cd frontend && npm test               # Jest with jsdom
cd frontend && npm run test:watch     # Watch mode

# Testing framework
cd testing-framework && npm run test:api    # API tests
cd testing-framework && npm run test:e2e    # E2E tests (Playwright)
cd testing-framework && npm run test:load   # Load tests (Artillery)

# Integration tests
cd testing-framework && npm test      # All integration tests
```

### Linting & Type Checking
```bash
npm run lint                   # Lint all projects
npm run lint:fix               # Auto-fix linting issues
cd backend && npm run typecheck       # TypeScript type checking
cd frontend && npm run typecheck      # Frontend type checking
```

### Database Operations
```bash
# Prisma operations (in backend/api-gateway)
cd backend/api-gateway
npx prisma generate            # Generate Prisma client
npx prisma migrate dev         # Run migrations in development
npx prisma migrate deploy      # Apply migrations in production
npx prisma studio              # Open database GUI
npx prisma db seed             # Seed database
```

### Docker
```bash
npm run docker:build           # Build all Docker containers
npm run docker:up              # Start all services via Docker Compose
npm run docker:down            # Stop all Docker containers
docker-compose logs -f [service]  # View logs for a specific service
```

### AI Services (Python)
```bash
cd ai-services
pip install -r requirements.txt       # Install dependencies
python -m uvicorn main:app --reload --port 8001  # Start AI service
```

## Architecture

### Backend Microservices (Port 8000-8005)

**API Gateway Pattern**: All client requests flow through the API Gateway (port 8000), which proxies to downstream services.

**Core Services**:
- **API Gateway** (8000) - Authentication, request routing, health checks
- **User Management** (8001) - User profiles, teams, RBAC
- **Pipeline Service** (8001) - CI/CD pipeline orchestration
- **Testing Service** (8002) - Test suite execution and results
- **Integration Service** (8003) - GitHub, GitLab, JIRA, Slack, SonarQube
- **Code Analysis** (8004) - Code quality and security scanning
- **Monitoring** (8005) - Metrics collection and system health
- **AI Services** (9000) - Test generation, error analysis, pipeline optimization

**Key Backend Patterns**:
- Service-to-service communication via `ServiceProxy` class in `backend/api-gateway/src/services/serviceProxy.ts`
- Circuit breaker pattern with automatic retry logic (3 attempts for GET requests)
- Request tracing with `X-Request-ID` headers across all services
- Centralized error handling with custom error classes (`AppError`, `ValidationAppError`, etc.)
- JWT-based authentication with refresh tokens (access: 24h, refresh: 7d)
- Redis caching for sessions and password reset tokens
- Prisma ORM for type-safe database access

**Database Models** (PostgreSQL via Prisma):
- Schema location: `backend/api-gateway/prisma/schema.prisma`
- Key models: User, Team, Project, Pipeline, PipelineRun, TestSuite, TestRun, Deployment, AuditLog
- User roles: ADMIN, MANAGER, DEVELOPER, TESTER, VIEWER
- Pipeline triggers: MANUAL, GIT_PUSH, GIT_PR, SCHEDULE, WEBHOOK
- Stage types: BUILD, TEST, SECURITY_SCAN, DEPLOY, ROLLBACK

**Authentication Flow**:
1. Login → JWT access token (24h) + refresh token (7d stored in DB)
2. Protected routes use `authenticateToken` middleware
3. Role-based access via `requireRole` middleware
4. Password reset via time-limited tokens in Redis (1h expiry)
5. Session invalidation on password change

**Service Discovery**:
- Configuration in `backend/api-gateway/src/config/services.ts`
- Each service has: host, port, basePath, healthEndpoint, timeout, retryCount
- Health checks available at `/api/health/services` and `/api/health/services/{name}`

### Frontend (Port 3030)

**Stack**: Next.js 14.0.4 (App Router), React 18.2.0, TypeScript 5.3.3, Tailwind CSS 3.3.6

**Architecture**:
- App Router pattern in `frontend/src/app/`
- Route groups: `(app)` for protected dashboard, `(auth)` for login/register
- Nested layouts: Root Layout → App Section Layout (with Sidebar + Header) → Page
- Path aliases: `@/*` → `./src/*`

**State Management**:
- Hook-based with `useState` and `useCallback` (no Redux/Zustand)
- Custom `useMetrics` hook for data fetching in `frontend/src/hooks/use-metrics.ts`
- React Query for server state (optional, already installed)

**Key Routes**:
- `/` - Landing page
- `/dashboard` - Main dashboard (481 lines, complex metrics visualization)
- `/pipelines` - Pipeline management
- `/testing` - Test suite management
- `/deployments` - Deployment tracking
- `/settings` - User and system settings

**API Integration**:
- Base URL: `http://localhost:8000` (via `NEXT_PUBLIC_API_URL`)
- WebSocket: `ws://localhost:8000` (via `NEXT_PUBLIC_WS_URL`)
- Real-time updates via WebSocket for pipelines, KPIs, and activities
- Fallback to HTTP polling if WebSocket connection fails

**Component Organization**:
- `components/layout/` - Sidebar, Header (fixed positioning)
- `components/ui/` - Reusable components (Card, Button, Badge, Tabs, etc.)
- Compound component pattern for Card: CardHeader → CardTitle → CardContent → CardFooter
- Uses `React.forwardRef` for ref forwarding

**Design System**:
- Tailwind CSS with custom design tokens in `frontend/src/styles/globals.css`
- Color palette: Primary (blue), Success (green), Warning (orange), Error (red)
- Inter font family from Google Fonts
- Custom animations: pulse, accordion, fade-in, slide-in
- Utility libraries: Framer Motion for animations, Heroicons for icons
- Status indicators with color mapping and pulse effects

**TypeScript Types**:
- Comprehensive type definitions in `frontend/src/types/index.ts`
- Domain models: User, Pipeline, TestSuite, Deployment, Metric, Alert
- API response types: `ApiResponse<T>`, `PaginatedResponse<T>`
- WebSocket message types enum for type-safe real-time communication

**Utility Functions** (`frontend/src/lib/utils.ts`):
- `cn()` - ClassName merger (clsx + tailwind-merge)
- `formatDate()`, `formatDuration()`, `formatBytes()` - Formatting utilities
- `debounce()`, `throttle()` - Performance optimization
- `parseGitUrl()` - Extract GitHub repo info

### AI Services (Port 8001/9000)

**Stack**: Python 3.11+, FastAPI 0.104.1, OpenAI 1.6.1, LangChain 0.0.348, Transformers 4.36.2, PyTorch 2.1.2

**Core Responsibilities**:
- AI-powered test generation from code analysis
- Error resolution and fix suggestions
- Pipeline optimization recommendations
- Code analysis and quality insights

**API Endpoints** (proxied through API Gateway):
- `POST /api/v1/ai/generate-tests` (60s timeout)
- `POST /api/v1/ai/analyze-failures` (30s timeout)
- `POST /api/v1/ai/optimize-pipeline` (45s timeout)

**Integration**:
- Service registration in `backend/api-gateway/src/config/services.ts:59-67`
- Proxy methods in `backend/api-gateway/src/services/serviceProxy.ts:192-218`
- Health monitoring via `/api/health/services/ai-services`

**Technology**:
- FastAPI for async request handling
- SQLAlchemy for database ORM
- Celery + Redis for background job processing
- Prometheus metrics for monitoring
- Docker containerized with GPU acceleration support

### Testing Framework

**Architecture**: Three specialized testing services running independently

**Services**:
- **API Testing** - REST/GraphQL testing with Supertest and Jest
- **E2E Testing** - Browser automation with Playwright and Selenium
- **Load Testing** - Performance testing with Artillery

**Key Dependencies**:
- Playwright 1.40.1 for cross-browser E2E testing
- Selenium WebDriver 4.15.0 for legacy browser support
- Artillery 2.0.3 for distributed load testing
- OpenAI 4.20.1 for AI-powered test generation

**Running Tests**:
```bash
cd testing-framework
npm run test:api     # API integration tests
npm run test:e2e     # E2E browser tests
npm run test:load    # Load and performance tests
```

## Docker Infrastructure

**Services** (from `docker-compose.yml`):
- API Gateway (3000), Pipeline Service (3001), Testing Service (3002)
- AI Service (8001), Frontend (3030)
- PostgreSQL (5432), Redis (6379)
- Elasticsearch (9200), Kibana (5601)
- Prometheus (9090), Grafana (3001)

**Network**: All services run on `comet-network` bridge network

**Volumes**: Persistent data for postgres, redis, elasticsearch, prometheus, grafana

## Development Workflow

### Adding New Features

1. **Backend Service**:
   - Create service file in `backend/services/`
   - Register service in `backend/api-gateway/src/config/services.ts`
   - Add proxy method in `backend/api-gateway/src/services/serviceProxy.ts` if needed
   - Add routes in API Gateway router
   - Update Prisma schema if database changes required
   - Run `npx prisma migrate dev` to create migrations

2. **Frontend Component**:
   - Add types to `frontend/src/types/index.ts`
   - Create component in `frontend/src/components/`
   - Use `useMetrics` hook or create custom hook for data fetching
   - Add route in `frontend/src/app/` if new page needed
   - Import utilities from `@/lib/utils` for common operations

3. **AI Feature**:
   - Add endpoint in `ai-services/main.py` or create new module
   - Register in API Gateway services config
   - Add proxy method with appropriate timeout
   - Update AI service types in backend

### Database Changes

1. Update `backend/api-gateway/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <migration-name>`
3. Generate Prisma client: `npx prisma generate`
4. Update TypeScript types and service layer
5. Test migration in development before deploying

### Environment Variables

**Backend** (`.env` in `backend/api-gateway/`):
```
DATABASE_URL=postgresql://user:pass@localhost:5432/comet_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRATION=7d
NODE_ENV=development
PORT=8000
```

**Frontend** (`.env.local` in `frontend/`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8001
```

**AI Services** (`.env` in `ai-services/`):
```
OPENAI_API_KEY=your-openai-key
DATABASE_URL=postgresql://user:pass@localhost:5432/comet_dev
REDIS_URL=redis://localhost:6379
```

## Key Implementation Details

### Service Communication

All inter-service communication goes through the `ServiceProxy` class:

```typescript
// backend/api-gateway/src/services/serviceProxy.ts
const response = await ServiceProxy.makeRequest<ResponseType>(
  'SERVICE_NAME',
  {
    method: 'POST',
    endpoint: '/api/endpoint',
    data: requestBody,
    timeout: 30000
  }
);
```

### Error Handling

Use custom error classes for consistent error responses:

```typescript
throw new ValidationAppError('Invalid input', { field: 'email' });
throw new AuthenticationAppError('Invalid credentials');
throw new NotFoundAppError('Resource not found');
```

All errors are caught by the global error handler and formatted consistently.

### Authentication Middleware

```typescript
// Require valid JWT
app.get('/api/protected', authenticateToken, handler);

// Require specific role
app.post('/api/admin', requireRole('ADMIN'), handler);

// Shortcuts
app.delete('/api/user', requireAdmin, handler);
```

### WebSocket Real-time Updates

Frontend automatically connects to WebSocket for real-time updates:

```typescript
// Message types: 'kpis', 'pipelines', 'activities'
// Handled in useMetrics hook
// Automatic reconnection on disconnect
```

### Logging

Winston logger available in all backend services:

```typescript
logger.info('Operation completed', { userId, requestId });
logger.error('Operation failed', { error, context });
```

Structured logging with metadata for easy searching in Elasticsearch.

### Monitoring

- **Health checks**: `GET /api/health` (basic), `GET /api/health/detailed` (full system)
- **Service health**: `GET /api/health/services/{serviceName}`
- **Metrics**: Prometheus scrapes metrics from all services
- **Dashboards**: Grafana pre-configured dashboards in `infrastructure/monitoring/grafana/`

## Testing Strategy

- **Unit Tests**: Jest with ts-jest for backend, Jest with jsdom for frontend
- **Integration Tests**: Supertest for API endpoints in `testing-framework/`
- **E2E Tests**: Playwright for critical user journeys
- **Load Tests**: Artillery for performance benchmarks
- **Type Safety**: TypeScript strict mode enabled, run `npm run typecheck` regularly

## Important Notes

- The sidebar width is managed via CSS custom properties (`--sidebar-width`, `--sidebar-collapsed-width`)
- All timestamps use ISO 8601 format
- Database uses UUID for primary keys
- Rate limiting is configured per service (default: 100 requests per 15 min window)
- Password hashing uses bcrypt with 12 salt rounds
- All API responses follow standardized `ApiResponse<T>` format
- WebSocket messages include type discriminator for type-safe handling
- Prisma client must be regenerated after schema changes
- Services are independently deployable but share common types via `backend/shared/`
