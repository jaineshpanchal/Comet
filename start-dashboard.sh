#!/bin/bash

# Kill any existing processes
pkill -f "ts-node.*metrics-service" || true
pkill -f "next dev" || true
sleep 2

echo "🚀 Starting Comet DevOps Dashboard..."

# Start metrics service in background
cd /Users/jaineshpanchal/Documents/GitHub/Comet/backend/services
npx ts-node metrics-service.ts &
METRICS_PID=$!

# Wait for metrics service to start
sleep 3

# Start frontend
cd /Users/jaineshpanchal/Documents/GitHub/Comet/frontend
npm run dev &
FRONTEND_PID=$!

echo "📊 Metrics Service PID: $METRICS_PID"
echo "🌐 Frontend Service PID: $FRONTEND_PID"
echo ""
echo "✅ Dashboard available at: http://localhost:3030/dashboard"
echo "✅ Metrics API available at: http://localhost:9090/api/metrics/kpis"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for services and handle interruption
trap 'echo "🛑 Stopping services..."; kill $METRICS_PID $FRONTEND_PID 2>/dev/null; exit' INT

# Keep script running
wait