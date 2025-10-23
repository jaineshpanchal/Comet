# Docker Production Deployment Guide

## Overview

Production-optimized Docker containers for the GoLive DevOps Platform with multi-stage builds, security hardening, and resource management.

## Features

✅ **Multi-stage builds** - Minimal image sizes
✅ **Non-root users** - Security hardened
✅ **Health checks** - Automatic recovery
✅ **Resource limits** - CPU/memory control
✅ **Alpine Linux** - Small attack surface
✅ **Layer caching** - Fast builds

## Quick Start

### 1. Configure Environment

```bash
# Copy production environment template
cp .env.prod.example .env.prod

# Generate secrets
openssl rand -hex 32  # JWT_SECRET
openssl rand -hex 32  # JWT_REFRESH_SECRET
openssl rand -hex 32  # ENCRYPTION_KEY
openssl rand -hex 64  # CSRF_SECRET

# Edit .env.prod with real values
vi .env.prod
```

### 2. Build Images

```bash
# Build all images
docker-compose -f docker-compose.prod.yml build

# Or build individually
docker build -t golive-api-gateway:latest ./backend/api-gateway
docker build -t golive-frontend:latest ./frontend
```

### 3. Start Production Stack

```bash
# Start all services
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Image Specifications

### Backend Image

**Base**: `node:20-alpine`
**Size**: ~150MB (vs ~1GB without multi-stage)
**Stages**: deps → builder → runner
**User**: non-root (`golive` uid 1001)
**Port**: 8000
**Health**: HTTP GET `/api/health`

### Frontend Image

**Base**: `node:20-alpine`
**Size**: ~120MB
**Build**: Next.js standalone output
**User**: non-root (`nextjs` uid 1001)
**Port**: 3030
**Health**: HTTP GET to homepage

## Security Features

### 1. Non-Root User

```dockerfile
# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 golive

# Switch to non-root
USER golive
```

### 2. Minimal Base Image

```dockerfile
# Alpine Linux - smallest footprint
FROM node:20-alpine
```

### 3. No Secrets in Image

```dockerfile
# Secrets via environment variables
ENV JWT_SECRET=${JWT_SECRET}
```

### 4. Read-Only Filesystem (optional)

```yaml
services:
  api-gateway:
    read_only: true
    tmpfs:
      - /tmp
```

## Health Checks

### Backend Health Check

```yaml
healthcheck:
  test: ["CMD", "node", "-e", "..."]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Frontend Health Check

```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "http://localhost:3030"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Resource Limits

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

## Production Checklist

### Pre-Deployment

- [ ] All secrets generated and configured
- [ ] `.env.prod` file created (not committed!)
- [ ] Database backup taken
- [ ] SSL certificates ready
- [ ] Domain DNS configured
- [ ] Firewall rules configured

### Build

- [ ] Docker images built successfully
- [ ] Images scanned for vulnerabilities
- [ ] Image sizes optimized
- [ ] Health checks tested

### Deploy

- [ ] Database migrations run
- [ ] Containers started
- [ ] Health checks passing
- [ ] Logs monitored
- [ ] Smoke tests passed

## Commands Reference

### Build

```bash
# Build specific service
docker-compose -f docker-compose.prod.yml build api-gateway
docker-compose -f docker-compose.prod.yml build frontend

# Build with no cache
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Run

```bash
# Start in background
docker-compose -f docker-compose.prod.yml up -d

# Start specific service
docker-compose -f docker-compose.prod.yml up -d api-gateway

# Scale service
docker-compose -f docker-compose.prod.yml up -d --scale api-gateway=3
```

### Monitor

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# View logs for specific service
docker-compose -f docker-compose.prod.yml logs -f api-gateway

# Check health
docker-compose -f docker-compose.prod.yml ps
```

### Stop

```bash
# Stop all
docker-compose -f docker-compose.prod.yml down

# Stop and remove volumes
docker-compose -f docker-compose.prod.yml down -v
```

## Database Migrations

```bash
# Run migrations before starting
docker-compose -f docker-compose.prod.yml run --rm api-gateway npx prisma migrate deploy

# Or exec into running container
docker-compose -f docker-compose.prod.yml exec api-gateway npx prisma migrate deploy
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs api-gateway

# Inspect container
docker inspect golive-api-gateway-prod
```

### Health Check Failing

```bash
# Manual health check
docker-compose -f docker-compose.prod.yml exec api-gateway curl http://localhost:8000/api/health

# Check process
docker-compose -f docker-compose.prod.yml exec api-gateway ps aux
```

### Build Failures

```bash
# Clean build cache
docker builder prune

# Remove all images and rebuild
docker-compose -f docker-compose.prod.yml down --rmi all
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Out of Memory

```bash
# Check container stats
docker stats

# Increase memory limits in docker-compose.prod.yml
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build Docker Images
  run: |
    docker-compose -f docker-compose.prod.yml build

- name: Push to Registry
  run: |
    docker tag golive-api-gateway:latest registry.example.com/golive-api-gateway:${{ github.sha }}
    docker push registry.example.com/golive-api-gateway:${{ github.sha }}
```

## Kubernetes Deployment

Convert to Kubernetes manifests:

```bash
# Using kompose
kompose convert -f docker-compose.prod.yml

# Or manually create deployments
kubectl create deployment api-gateway --image=golive-api-gateway:latest
```

## Files

- **Backend Dockerfile**: [backend/api-gateway/Dockerfile](backend/api-gateway/Dockerfile)
- **Frontend Dockerfile**: [frontend/Dockerfile](frontend/Dockerfile)
- **Production Compose**: [docker-compose.prod.yml](docker-compose.prod.yml)
- **Environment Template**: [.env.prod.example](.env.prod.example)

---

**Status**: ✅ Docker Deployment Ready
**Image Sizes**: Backend ~150MB, Frontend ~120MB
**Security**: Non-root users, Alpine base, No secrets in images
**Production**: Resource limits, Health checks, Monitoring ready
