#!/bin/bash

# Comet DevOps Platform - Service Startup Script
# This script ensures all services start in the correct directories

echo "🚀 Starting Comet DevOps Platform Services..."

SERVICE_PIDS=()
SERVICE_NAMES=()
CLEANUP_PERFORMED=0

register_service() {
    SERVICE_PIDS+=("$1")
    SERVICE_NAMES+=("$2")
}

cleanup_services() {
    if [ "$CLEANUP_PERFORMED" -eq 1 ]; then
        return
    fi

    CLEANUP_PERFORMED=1

    if [ ${#SERVICE_PIDS[@]} -eq 0 ]; then
        return
    fi

    echo ""
    echo "🛑 Stopping services..."

    for index in "${!SERVICE_PIDS[@]}"; do
        pid="${SERVICE_PIDS[$index]}"
        name="${SERVICE_NAMES[$index]}"

        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            echo "   ⏹️  $name (pid: $pid)"
            kill "$pid" 2>/dev/null || true

            for _ in 1 2 3 4 5; do
                if ! kill -0 "$pid" 2>/dev/null; then
                    break
                fi
                sleep 1
            done

            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi

            wait "$pid" 2>/dev/null
        fi
    done
}

handle_signal() {
    echo ""
    echo "🛑 Received termination signal. Cleaning up..."
    cleanup_services
    exit 0
}

trap handle_signal INT TERM

supports_wait_n() {
    if [ -z "${BASH_VERSINFO[0]:-}" ]; then
        return 1
    fi

    if [ "${BASH_VERSINFO[0]}" -gt 4 ]; then
        return 0
    fi

    if [ "${BASH_VERSINFO[0]}" -eq 4 ] && [ "${BASH_VERSINFO[1]}" -ge 3 ]; then
        return 0
    fi

    return 1
}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

MODE="dev"
while [ $# -gt 0 ]; do
    case "$1" in
        --mode)
            if [ -n "${2:-}" ]; then
                MODE="$2"
                shift 2
                continue
            else
                echo "❌ --mode flag requires a value (dev or prod)"
                exit 1
            fi
            ;;
        --mode=*)
            MODE="${1#*=}"
            ;;
        -m)
            if [ -n "${2:-}" ]; then
                MODE="$2"
                shift 2
                continue
            else
                echo "❌ -m flag requires a value (dev or prod)"
                exit 1
            fi
            ;;
        *)
            echo "❌ Unknown option: $1"
            exit 1
            ;;
    esac
    shift
done

MODE="$(echo "$MODE" | tr '[:upper:]' '[:lower:]')"
if [ "$MODE" != "dev" ] && [ "$MODE" != "prod" ]; then
    echo "❌ Unsupported mode '$MODE'. Use 'dev' or 'prod'."
    exit 1
fi

echo "🔧 Running in ${MODE^^} mode"

# Function to check if a port is in use
check_port() {
    local port=$1

    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:$port >/dev/null 2>&1
    elif command -v nc >/dev/null 2>&1; then
        nc -z -w1 localhost "$port" >/dev/null 2>&1
    elif command -v ss >/dev/null 2>&1; then
        ss -ltn 2>/dev/null | awk '{print $4}' | grep -E "(:|\.)$port$" >/dev/null 2>&1
    elif command -v netstat >/dev/null 2>&1; then
        netstat -ltn 2>/dev/null | awk '{print $4}' | grep -E "(:|\.)$port$" >/dev/null 2>&1
    else
        if bash -c "echo >/dev/tcp/127.0.0.1/$port" >/dev/null 2>&1; then
            return 0
        elif bash -c "echo >/dev/tcp/::1/$port" >/dev/null 2>&1; then
            return 0
        else
            return 1
        fi
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
                    pkill -f "metrics-service.ts" 2>/dev/null
                    pkill -f "metrics-service.js" 2>/dev/null ;;
                3030)
                    pkill -f "next dev" 2>/dev/null
                    pkill -f "next start" 2>/dev/null
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

if [ "$MODE" = "prod" ]; then
    echo "⚙️  Building metrics service..."
    if ! npm run build; then
        echo "❌ Metrics service build failed"
        exit 1
    fi
    NODE_ENV=production npm run start:metrics:prod &
else
    npm run dev:metrics &
fi
METRICS_PID=$!
register_service "$METRICS_PID" "Metrics Service"

# Wait for metrics service to start
if [ "$MODE" = "prod" ]; then
    DEFAULT_METRICS_TIMEOUT=90
else
    DEFAULT_METRICS_TIMEOUT=60
fi
METRICS_TIMEOUT=${METRICS_TIMEOUT:-$DEFAULT_METRICS_TIMEOUT}
echo "⏳ Waiting for metrics service to initialize (timeout: ${METRICS_TIMEOUT}s)..."
if ! wait_for_port 9090 "Metrics Service" "$METRICS_TIMEOUT"; then
    cleanup_services
    exit 1
fi

# Start frontend
echo "🌐 Starting Frontend on port 3030..."
cd "$SCRIPT_DIR/frontend" || exit 1

if [ "$MODE" = "prod" ]; then
    echo "⚙️  Building frontend..."
    if ! npm run build; then
        echo "❌ Frontend build failed"
        cleanup_services
        exit 1
    fi
    NODE_ENV=production npm run start &
else
    npm run dev &
fi
FRONTEND_PID=$!
register_service "$FRONTEND_PID" "Frontend"

# Wait for frontend to start
if [ "$MODE" = "prod" ]; then
    DEFAULT_FRONTEND_TIMEOUT=120
else
    DEFAULT_FRONTEND_TIMEOUT=90
fi
FRONTEND_TIMEOUT=${FRONTEND_TIMEOUT:-$DEFAULT_FRONTEND_TIMEOUT}
echo "⏳ Waiting for frontend to initialize (timeout: ${FRONTEND_TIMEOUT}s)..."
if ! wait_for_port 3030 "Frontend" "$FRONTEND_TIMEOUT"; then
    cleanup_services
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

cleanup_services
exit 0
