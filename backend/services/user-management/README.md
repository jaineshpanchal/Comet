# User Management Service

A comprehensive microservice for user authentication, authorization, and team management in the GoLive DevOps platform.

## Features

### Authentication & Authorization
- **JWT-based Authentication**: Secure token-based authentication with access and refresh tokens
- **Role-based Access Control**: Multiple user roles with granular permissions
- **Password Security**: bcrypt hashing with configurable salt rounds
- **Session Management**: Refresh token rotation and invalidation
- **Rate Limiting**: Protection against brute force attacks

### User Management
- **User CRUD Operations**: Complete user lifecycle management
- **User Profiles**: Extended user information and preferences
- **User Search & Filtering**: Advanced search capabilities with pagination
- **Account Management**: User activation/deactivation and email verification
- **Profile Customization**: Skills, preferences, and personal information

### Team Management
- **Team Creation & Management**: Create and manage development teams
- **Team Membership**: Add/remove members with role-based permissions
- **Team Roles**: Owner, Admin, Maintainer, Member, Viewer roles
- **Team Settings**: Configurable team visibility and permissions
- **Member Search**: Find and manage team members efficiently

## API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `POST /logout` - User logout
- `POST /verify-email` - Verify email address
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password

### Users (`/api/v1/users`)
- `GET /` - Get all users (paginated)
- `GET /me` - Get current user profile
- `GET /:id` - Get user by ID
- `POST /` - Create new user
- `PUT /:id` - Update user
- `DELETE /:id` - Deactivate user

### Teams (`/api/v1/teams`)
- `GET /` - Get all teams (paginated)
- `GET /:idOrSlug` - Get team by ID or slug
- `POST /` - Create new team
- `PUT /:idOrSlug` - Update team
- `DELETE /:idOrSlug` - Delete team
- `POST /:idOrSlug/members` - Add team member
- `PUT /:idOrSlug/members/:userId` - Update member role
- `DELETE /:idOrSlug/members/:userId` - Remove team member

### Health (`/api/v1/health`)
- `GET /` - Basic health check
- `GET /detailed` - Detailed health status

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Validation**: Joi schema validation
- **Logging**: Winston structured logging
- **Security**: Helmet, CORS, rate limiting
- **Monitoring**: Health checks and metrics

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Required Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `JWT_REFRESH_SECRET` - Secret for refresh token signing
- `PORT` - Service port (default: 3001)
- `NODE_ENV` - Environment (development/production)

### Optional Configuration

- `REDIS_URL` - Redis for caching and sessions
- `SMTP_*` - Email configuration for notifications
- `CORS_ORIGIN` - Allowed CORS origins
- `LOG_LEVEL` - Logging level (debug/info/warn/error)

## Database Setup

1. **Install PostgreSQL** and create database:
   ```sql
   CREATE DATABASE golive_dev;
   CREATE USER golive_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE golive_dev TO golive_user;
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Run Migrations**:
   ```bash
   npx prisma migrate dev
   ```

4. **Seed Database** (optional):
   ```bash
   npx prisma db seed
   ```

## Installation & Development

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis (optional, for caching)

### Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup Database**:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## API Usage Examples

### User Registration
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "john.doe@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "password": "SecurePassword123!"
  }'
```

### User Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePassword123!"
  }'
```

### Get Current User (Authenticated)
```bash
curl -X GET http://localhost:3001/api/v1/users/me \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Team
```bash
curl -X POST http://localhost:3001/api/v1/teams \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Frontend Team",
    "slug": "frontend-team",
    "description": "Responsible for UI/UX development"
  }'
```

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- Special characters recommended

### JWT Token Security
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Automatic token rotation
- Secure HTTP-only cookies (production)

### Rate Limiting
- 100 requests per 15-minute window
- Configurable per endpoint
- IP-based throttling

### Input Validation
- Joi schema validation
- XSS protection
- SQL injection prevention
- File upload restrictions

## Monitoring & Logging

### Health Checks
- Basic health: `/api/v1/health`
- Detailed status: `/api/v1/health/detailed`
- Database connectivity
- External service dependencies

### Logging
- Structured JSON logging
- Multiple log levels (error, warn, info, debug)
- Request/response logging
- Error tracking and alerts

### Metrics
- API response times
- Error rates
- Authentication attempts
- User activity patterns

## Error Handling

All API responses follow a consistent format:

```json
{
  "success": true|false,
  "data": {}, // Present on success
  "error": "Error type", // Present on failure
  "message": "Human readable message",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint",
  "statusCode": 200
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables (Production)
- Use strong, unique secrets for JWT
- Configure proper CORS origins
- Set up proper logging aggregation
- Configure monitoring and alerting
- Use connection pooling for database
- Set up Redis for caching

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is part of the GoLive DevOps Platform and is proprietary software.