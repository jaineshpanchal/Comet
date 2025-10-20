# Comet DevOps Platform - Development Guide

## Service Management

### Quick Start (Recommended)
```bash
# Start all services with proper directory handling
npm run dev:dashboard
```

### Individual Services

#### Metrics Service
```bash
# Option 1: Use the dedicated script (Recommended)
./start-metrics.sh

# Option 2: Use npm script from root
npm run dev:metrics

# Option 3: Manual (if needed)
cd backend/services && npm run dev:metrics
```

#### Frontend
```bash
# From root directory
npm run dev:frontend

# Or manually
cd frontend && npm run dev
```

### Service URLs
- **Dashboard**: http://localhost:3030
- **Metrics API**: http://localhost:9090/api/metrics/kpis
- **API Endpoints**:
  - GET /api/metrics/kpis
  - GET /api/metrics/pipelines  
  - GET /api/metrics/activities

### Troubleshooting

#### "Missing script: dev:metrics" Error
This happens when running from wrong directory. Solutions:
1. **Always use**: `npm run dev:metrics` from root directory
2. **Or use**: `./start-metrics.sh` script
3. **Never run**: `npm run dev:metrics` from root Comet directory directly

#### Port Already in Use
```bash
# Kill metrics service
lsof -ti:9090 | xargs kill -9

# Kill frontend
lsof -ti:3030 | xargs kill -9
```

#### Directory Issues
- All scripts automatically handle directory navigation
- Use provided scripts instead of manual `cd` commands
- Scripts validate correct files exist before starting

### Available Scripts (from root directory)
- `npm run dev:metrics` - Start metrics service only
- `npm run dev:frontend` - Start frontend only  
- `npm run dev:dashboard` - Start both metrics + frontend
- `./start-metrics.sh` - Dedicated metrics startup script
- `./start-services.sh` - Full service startup with monitoring