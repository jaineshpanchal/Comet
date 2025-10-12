#!/bin/bash

# Comet DevOps Platform - Service Startup Script
# This script ensures all services start in the correct directories

echo "🚀 Starting Comet DevOps Platform Services..."

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    if check_port $1; then
        echo "⚠️  Killing existing process on port $1"
        lsof -ti:$1 | xargs kill -9 2>/dev/null
        sleep 2
    fi
}

# Kill existing services
echo "🧹 Cleaning up existing services..."
kill_port 3030  # Frontend
kill_port 9090  # Metrics service

# Start metrics service
echo "📊 Starting Metrics Service on port 9090..."
cd "$(dirname "$0")/backend/services"
npm run dev:metrics &
METRICS_PID=$!

# Wait for metrics service to start
echo "⏳ Waiting for metrics service to initialize..."
sleep 5

# Check if metrics service is running
if check_port 9090; then
    echo "✅ Metrics Service running on port 9090"
else
    echo "❌ Failed to start Metrics Service"
    exit 1
fi

# Start frontend
echo "🌐 Starting Frontend on port 3030..."
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to initialize..."
sleep 5

# Check if frontend is running
if check_port 3030; then
    echo "✅ Frontend running on port 3030"
else
    echo "❌ Failed to start Frontend"
    kill $METRICS_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 All services started successfully!"
echo "📊 Metrics API: http://localhost:9090/api/metrics/kpis"
echo "🌐 Dashboard: http://localhost:3030"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt signal
trap 'echo "🛑 Stopping services..."; kill $METRICS_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# Keep script running
wait