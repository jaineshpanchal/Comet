# GoLive DevOps Platform - Service Management Scripts

Simple scripts to manage all services with single commands.

## Quick Start

### Start All Services
```bash
npm start
# or
./scripts/start-all.sh
```

### Stop All Services
```bash
npm stop
# or
./scripts/stop-all.sh
```

### Restart All Services
```bash
npm run restart
# or
./scripts/restart-all.sh
```

### Check Service Status
```bash
npm run status
# or
./scripts/status.sh
```

## What Gets Started?

The `start-all.sh` script starts:

1. **Backend Services** (Port 8000)
   - API Gateway
   - Pipeline Service (8001)
   - Project Service (8002)
   - Testing Service
   - Quality Service (8005)
   - User Service
   - Metrics Service

2. **Frontend** (Port 3030)
   - Next.js development server

3. **AI Services** (Port 9000)
   - FastAPI with Uvicorn

4. **Prisma Studio** (Port 5555)
   - Database management interface

## Logs

All logs are saved to the `logs/` directory in the project root:

- `logs/backend.log` - Backend services output
- `logs/frontend.log` - Frontend output
- `logs/ai-services.log` - AI services output
- `logs/prisma.log` - Prisma Studio output

### View Logs

```bash
# View backend logs
tail -f logs/backend.log

# View frontend logs
tail -f logs/frontend.log

# View AI services logs
tail -f logs/ai-services.log

# View all logs
tail -f logs/*.log
```

## Port Management

The scripts automatically manage these ports:

- **3030** - Frontend (Next.js)
- **8000** - API Gateway
- **8001** - Pipeline Service
- **8002** - Project Service
- **8005** - Quality Service
- **9000** - AI Services
- **9090** - Metrics Service
- **5555** - Prisma Studio

## Troubleshooting

### Services Won't Start

If services fail to start, try:

```bash
# Stop all services
npm stop

# Wait a few seconds
sleep 3

# Start again
npm start
```

### Port Already in Use

The stop script automatically cleans up all ports, but if you still have issues:

```bash
# Kill specific port (e.g., 8000)
lsof -ti:8000 | xargs kill -9

# Or use the stop script which cleans all ports
npm stop
```

### Check What's Running

```bash
# Check service status
npm run status

# Check specific port
lsof -ti:8000
```

## Scripts Overview

| Script | Description | Command |
|--------|-------------|---------|
| `start-all.sh` | Start all services | `npm start` |
| `stop-all.sh` | Stop all services | `npm stop` |
| `restart-all.sh` | Restart all services | `npm run restart` |
| `status.sh` | Check service status | `npm run status` |

## Features

- ✅ **One-command** start/stop/restart
- 📋 **Centralized logging** in `logs/` directory
- 🔄 **Automatic port cleanup** on stop
- 📊 **Service health checks** with status command
- 🎯 **PID tracking** for clean process management
- 🎨 **Colorful output** for better readability

## URLs

After starting services, access them at:

- **Dashboard**: http://localhost:3030/dashboard
- **API Gateway**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs
- **Health Check**: http://localhost:8000/api/health
- **AI Services**: http://localhost:9000
- **Prisma Studio**: http://localhost:5555

## Development Workflow

```bash
# Morning - Start everything
npm start

# During development - Check status
npm run status

# View logs while working
tail -f logs/backend.log

# Evening - Stop everything
npm stop
```

## Tips

1. **Always use `npm stop` before `npm start`** to ensure clean startup
2. **Check logs** if services aren't behaving as expected
3. **Use `npm run status`** to verify all services are running
4. **Logs directory** is automatically created if it doesn't exist

## Architecture

The scripts use:
- **PID files** (`.pid`) to track running processes
- **Background processes** (`&`) for non-blocking execution
- **Port checking** (`lsof`) to verify service availability
- **Health endpoints** to confirm service readiness
