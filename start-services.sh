#!/bin/bash

# Comet DevOps Platform - Service Startup Script
# This script ensures all services start in the correct directories

echo "🚀 Starting Comet DevOps Platform Services..."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Function to check if a port is in use
check_port() {
    local port=$1

    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:$port >/dev/null 2>&1
    elif command -v nc >/dev/null 2>&1; then
        nc -z -w1 localhost "$port" >/dev/null 2>&1
    else
        return 1
    fi
}

# Function to wait for a service to become available on a port
wait_for_port() {
    local port=$1
    local service_name=$2
    local timeout=${3:-30}
    local interval=${4:-1}
    local elapsed=0

    while ! check_port "$port"; do
        if [ "$elapsed" -ge "$timeout" ]; then
            echo ""
            echo "❌ $service_name failed to start within ${timeout}s"
            return 1
        fi

        if [ "$elapsed" -eq 0 ]; then
            echo "   ⏳ waiting for $service_name to respond..."
        elif [ $((elapsed % 5)) -eq 0 ]; then
            echo "   ⏳ still waiting for $service_name... (${elapsed}s elapsed)"
        fi

        sleep "$interval"
        elapsed=$((elapsed + interval))
    done

    echo "✅ $service_name running on port $port"
    return 0
}

# Function to kill process on port
kill_port() {
    local port=$1

    if check_port "$port"; then
        echo "⚠️  Killing existing process on port $port"
        if command -v lsof >/dev/null 2>&1; then
            lsof -ti:$port | xargs kill -9 2>/dev/null
        elif command -v fuser >/dev/null 2>&1; then
            fuser -k ${port}/tcp 2>/dev/null
        else
            case "$port" in
                9090)
                    pkill -f "metrics-service.ts" 2>/dev/null ;;
                3030)
                    pkill -f "next dev" 2>/dev/null
                    pkill -f "npm run dev" 2>/dev/null ;;
            esac
        fi
        sleep 2
    fi
}

# Kill existing services
echo "🧹 Cleaning up existing services..."
kill_port 3030  # Frontend
kill_port 9090  # Metrics service

# Start metrics service
echo "📊 Starting Metrics Service on port 9090..."
cd "$SCRIPT_DIR/backend/services" || exit 1
npm run dev:metrics &
METRICS_PID=$!
register_service "$METRICS_PID" "Metrics Service"

# Wait for metrics service to start
METRICS_TIMEOUT=${METRICS_TIMEOUT:-60}
echo "⏳ Waiting for metrics service to initialize (timeout: ${METRICS_TIMEOUT}s)..."
if ! wait_for_port 9090 "Metrics Service" "$METRICS_TIMEOUT"; then
    kill $METRICS_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo "🌐 Starting Frontend on port 3030..."
cd "$SCRIPT_DIR/frontend" || exit 1
npm run dev &
FRONTEND_PID=$!
register_service "$FRONTEND_PID" "Frontend"

# Wait for frontend to start
FRONTEND_TIMEOUT=${FRONTEND_TIMEOUT:-90}
echo "⏳ Waiting for frontend to initialize (timeout: ${FRONTEND_TIMEOUT}s)..."
if ! wait_for_port 3030 "Frontend" "$FRONTEND_TIMEOUT"; then
    kill $METRICS_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 All services started successfully!"
echo "📊 Metrics API: http://localhost:9090/api/metrics/kpis"
echo "🌐 Dashboard: http://localhost:3030"
echo ""
echo "Press Ctrl+C to stop all services"

if [ ${#SERVICE_PIDS[@]} -gt 0 ]; then
    if supports_wait_n; then
        wait -n "${SERVICE_PIDS[@]}"
        SERVICE_EXIT_CODE=$?
    else
        wait "${SERVICE_PIDS[@]}"
        SERVICE_EXIT_CODE=$?
    fi

    if [ "$CLEANUP_PERFORMED" -eq 0 ]; then
        echo ""
        echo "⚠️  A service exited unexpectedly (code: $SERVICE_EXIT_CODE). Cleaning up..."
        cleanup_services
        exit "$SERVICE_EXIT_CODE"
    fi
fi

# Keep script running
wait
