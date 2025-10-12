#!/bin/bash

# Metrics Service Startup Script
# This ensures the metrics service always starts from the correct directory

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICES_DIR="$SCRIPT_DIR/backend/services"

echo "📊 Starting Comet Metrics Service..."
echo "🔧 Working directory: $SERVICES_DIR"

# Kill existing metrics service
if lsof -ti:9090 >/dev/null 2>&1; then
    echo "⚠️  Stopping existing metrics service on port 9090..."
    lsof -ti:9090 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Navigate to services directory and start
cd "$SERVICES_DIR"

# Verify we're in the right place
if [ ! -f "metrics-service.ts" ]; then
    echo "❌ Error: metrics-service.ts not found in $SERVICES_DIR"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in $SERVICES_DIR"
    exit 1
fi

echo "✅ Found required files in $SERVICES_DIR"
echo "🚀 Starting metrics service..."

npm run dev:metrics