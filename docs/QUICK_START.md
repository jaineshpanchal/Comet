# GoLive DevOps Platform - Quick Start Guide

## 🚀 Super Easy Startup

### Start Everything (Recommended)
```bash
npm start
# or
npm run dev
# or
./dev.sh start
```

This single command will:
- ✅ Start all database services (if Docker available)
- ✅ Start backend API Gateway (port 8000)
- ✅ Start frontend application (port 3030)
- ✅ Wait for services to be ready
- ✅ Automatically open your browser
- ✅ Show you the status

### Other Commands

```bash
npm stop              # Stop all services
npm restart           # Restart all services
npm run status        # Check service status
```

Or use the dev.sh script directly:

```bash
./dev.sh start        # Start all services
./dev.sh stop         # Stop all services
./dev.sh restart      # Restart all services
./dev.sh status       # Show status
./dev.sh help         # Show all commands
```

## 🌐 Access Your Platform

After starting, access these URLs:

- **Frontend**: http://localhost:3030
- **Backend API**: http://localhost:8000
- **API Health**: http://localhost:8000/api/health

## 📝 View Logs

```bash
# Real-time logs
tail -f logs/api-gateway.log
tail -f logs/frontend.log

# Or use the startup log
tail -f logs/startup.log
```

## 🛠️ Individual Services

If you need to start services individually:

```bash
./dev.sh backend      # Backend only
./dev.sh frontend     # Frontend only
./dev.sh db:start     # Databases only
```

## 📦 First Time Setup

If you haven't installed dependencies:

```bash
npm run setup         # Install all dependencies
```

## 🔍 Troubleshooting

### Port Already in Use

```bash
# Kill existing processes
npm stop

# Or manually kill
lsof -ti:8000,3030 | xargs kill -9
```

### Check What's Running

```bash
npm run status
# or
./dev.sh status
```

## 🎯 Common Workflows

### Development
```bash
npm start                    # Start everything
# Make your changes...
npm restart                  # Restart to apply changes
```

### Testing
```bash
npm test                     # Run all tests
npm run test:backend         # Backend tests only
npm run test:frontend        # Frontend tests only
```

### Building
```bash
npm run build                # Build everything
npm run build:backend        # Backend only
npm run build:frontend       # Frontend only
```

---

**That's it!** Just run `npm start` and you're ready to go! 🎉
