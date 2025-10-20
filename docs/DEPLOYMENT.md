# Comet DevOps Platform - Deployment Guide

This guide provides comprehensive instructions for deploying the Comet DevOps Platform in production.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Deployment Options](#deployment-options)
- [Database Setup](#database-setup)
- [Monitoring & Logs](#monitoring--logs)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+ recommended), macOS, or Windows with WSL2
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Disk Space**: Minimum 20GB free space

### Required Tools
```bash
# Check Docker installation
docker --version
docker-compose --version

# Check available resources
docker system df
```

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/comet.git
cd comet
```

### 2. Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)
- `REDIS_PASSWORD` - Redis password
- `POSTGRES_PASSWORD` - PostgreSQL password
- `OPENAI_API_KEY` - OpenAI API key for AI features

### 3. Deploy with Single Command
```bash
chmod +x deploy.sh
./deploy.sh production
```

The deployment script will:
1. Pull latest changes
2. Stop existing containers
3. Build Docker images
4. Run database migrations
5. Start all services
6. Perform health checks

### 4. Verify Deployment
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

Access the application:
- **Frontend**: http://localhost:3030
- **API Gateway**: http://localhost:8000
- **AI Services**: http://localhost:8001

## Environment Configuration

### Database Configuration
```bash
# PostgreSQL
DATABASE_URL=postgresql://user:password@postgres:5432/comet_production
POSTGRES_DB=comet_production
POSTGRES_USER=comet_user
POSTGRES_PASSWORD=<strong-password>
```

### Redis Configuration
```bash
REDIS_URL=redis://:password@redis:6379
REDIS_PASSWORD=<strong-password>
```

### JWT & Security
```bash
# Generate a strong JWT secret (min 32 characters)
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRATION=7d
```

### Frontend URLs
```bash
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
NEXT_PUBLIC_AI_SERVICE_URL=https://ai.yourdomain.com
```

### Optional Integrations

#### GitHub Integration
```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret
```

#### Slack Integration
```bash
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your_signing_secret
```

#### Email (SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=Comet DevOps <noreply@yourdomain.com>
```

## Deployment Options

### Option 1: Docker Compose (Recommended for Single Server)

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Development deployment
docker-compose -f docker-compose.dev.yml up -d

# Build without cache
docker-compose -f docker-compose.prod.yml build --no-cache

# Stop services
docker-compose -f docker-compose.prod.yml down

# Remove volumes (WARNING: This deletes all data)
docker-compose -f docker-compose.prod.yml down -v
```

### Option 2: Kubernetes (For Multi-Node Clusters)

```bash
# Create namespace
kubectl create namespace comet

# Apply configurations
kubectl apply -f kubernetes/

# Check deployment status
kubectl get pods -n comet
kubectl get services -n comet
```

### Option 3: Cloud Platforms

#### AWS ECS
```bash
# Build and push images to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag comet-api-gateway <account-id>.dkr.ecr.us-east-1.amazonaws.com/comet-api-gateway:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/comet-api-gateway:latest
```

#### Google Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/project-id/comet-api-gateway
gcloud run deploy comet-api-gateway --image gcr.io/project-id/comet-api-gateway --platform managed
```

## Database Setup

### Initial Migration
```bash
# Run Prisma migrations
docker-compose -f docker-compose.prod.yml run --rm api-gateway npx prisma migrate deploy

# Seed initial data (optional)
docker-compose -f docker-compose.prod.yml run --rm api-gateway npx prisma db seed
```

### Database Backup
```bash
# Backup PostgreSQL
docker exec comet-postgres pg_dump -U comet_user comet_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker exec -i comet-postgres psql -U comet_user comet_production < backup.sql
```

### Database Migrations
```bash
# Create new migration
cd backend/api-gateway
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy
```

## Monitoring & Logs

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api-gateway
docker-compose -f docker-compose.prod.yml logs -f frontend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 api-gateway
```

### Health Checks
```bash
# API Gateway health
curl http://localhost:8000/api/health

# Detailed health check
curl http://localhost:8000/api/health/detailed

# Service-specific health
curl http://localhost:8000/api/health/services
```

### Resource Monitoring
```bash
# Docker stats
docker stats

# Service-specific stats
docker stats comet-api-gateway comet-frontend comet-postgres
```

## Scaling

### Horizontal Scaling
```bash
# Scale specific services
docker-compose -f docker-compose.prod.yml up -d --scale api-gateway=3

# Load balancer configuration (using Nginx)
# Edit infrastructure/nginx/nginx.conf
upstream api_backend {
    least_conn;
    server api-gateway-1:8000;
    server api-gateway-2:8000;
    server api-gateway-3:8000;
}
```

### Vertical Scaling
```yaml
# docker-compose.prod.yml
services:
  api-gateway:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>
```

#### 2. Database Connection Failed
```bash
# Check PostgreSQL container
docker logs comet-postgres

# Verify database credentials in .env
# Test connection
docker exec -it comet-postgres psql -U comet_user -d comet_production
```

#### 3. Redis Connection Failed
```bash
# Check Redis container
docker logs comet-redis

# Test Redis connection
docker exec -it comet-redis redis-cli -a <password> ping
```

#### 4. Migration Failures
```bash
# Reset database (WARNING: Deletes all data)
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d postgres
docker-compose -f docker-compose.prod.yml run --rm api-gateway npx prisma migrate deploy
```

#### 5. Out of Disk Space
```bash
# Clean Docker system
docker system prune -a --volumes

# Remove unused images
docker image prune -a
```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=*
docker-compose -f docker-compose.prod.yml up

# Check environment variables
docker-compose -f docker-compose.prod.yml config
```

## Security Best Practices

1. **Use strong passwords** for all services
2. **Enable SSL/TLS** with Let's Encrypt certificates
3. **Configure firewall** to restrict access
4. **Regular updates** of Docker images and dependencies
5. **Enable Docker security scanning**
6. **Use secrets management** (AWS Secrets Manager, HashiCorp Vault)
7. **Implement rate limiting** at the reverse proxy level
8. **Enable audit logging** for compliance

## Backup Strategy

### Automated Backups
```bash
# Add to crontab
0 2 * * * /path/to/comet/scripts/backup.sh

# Backup script location
./scripts/backup.sh
```

### What to Backup
- PostgreSQL database
- Redis data (optional, for cache)
- Environment files (.env)
- SSL certificates
- Application logs

## Performance Tuning

### PostgreSQL
```sql
-- Edit postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 128MB
max_connections = 100
```

### Redis
```conf
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Node.js
```bash
# Set Node.js memory limits
NODE_OPTIONS="--max-old-space-size=2048"
```

## Support

For issues and questions:
- **GitHub Issues**: https://github.com/your-org/comet/issues
- **Documentation**: https://docs.comet.dev
- **Community**: https://discord.gg/comet

## License

Copyright © 2024 Comet DevOps Platform. All rights reserved.
