#!/bin/bash

# Health Check Script for GoLive Services

echo "🔍 Checking GoLive DevOps Platform Services..."

# Check metrics service
echo "📊 Checking Metrics Service (port 9090)..."
if curl -s http://localhost:9090/api/metrics/kpis >/dev/null 2>&1; then
    echo "✅ Metrics Service: HEALTHY"
else
    echo "❌ Metrics Service: NOT RUNNING"
fi

# Check frontend
echo "🌐 Checking Frontend (port 3030)..."
if curl -s http://localhost:3030 >/dev/null 2>&1; then
    echo "✅ Frontend: HEALTHY"
else
    echo "❌ Frontend: NOT RUNNING"
fi

# Show running processes
echo ""
echo "🔧 Active Node.js processes:"
ps aux | grep -E "(metrics-service|next.*3030)" | grep -v grep | awk '{print $2, $11, $12, $13, $14}' || echo "No GoLive services running"

echo ""
echo "📋 Service URLs:"
echo "   Dashboard: http://localhost:3030"
echo "   Metrics API: http://localhost:9090/api/metrics/kpis"