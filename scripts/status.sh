#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        📊 GOLIVE DEVOPS PLATFORM - SERVICE STATUS        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if a service is running on a specific port
check_port() {
    local port=$1
    local service_name=$2

    if lsof -ti:$port > /dev/null 2>&1; then
        local pid=$(lsof -ti:$port)
        echo -e "${GREEN}✓ $service_name${NC} - Running on port $port (PID: $pid)"
        return 0
    else
        echo -e "${RED}✗ $service_name${NC} - Not running on port $port"
        return 1
    fi
}

# Check health endpoint
check_health() {
    local url=$1
    local service_name=$2

    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "   ${GREEN}Health check passed${NC} ($url)"
        return 0
    else
        echo -e "   ${YELLOW}Health check failed${NC} ($url)"
        return 1
    fi
}

echo -e "${BLUE}Service Status:${NC}"
echo ""

# Check Frontend (Next.js)
check_port 3030 "Frontend (Next.js)       "
if [ $? -eq 0 ]; then
    check_health "http://localhost:3030" "Frontend"
fi
echo ""

# Check API Gateway
check_port 8000 "API Gateway             "
if [ $? -eq 0 ]; then
    check_health "http://localhost:8000/api/health" "API Gateway"
fi
echo ""

# Check Microservices
check_port 8001 "Pipeline Service        "
echo ""
check_port 8002 "Project Service         "
echo ""
check_port 8005 "Quality Service         "
echo ""

# Check AI Services
check_port 9000 "AI Services             "
echo ""

# Check Prisma Studio
check_port 5555 "Prisma Studio           "
echo ""

# Show log locations
echo -e "${BLUE}Log Files:${NC}"
if [ -d "logs" ]; then
    echo -e "  📁 Location: ${YELLOW}./logs/${NC}"
    ls -lh logs/*.log 2>/dev/null | awk '{print "     "$9" ("$5")"}'
else
    echo -e "  ${YELLOW}No logs directory found${NC}"
fi
echo ""

# Show useful commands
echo -e "${BLUE}Management Commands:${NC}"
echo -e "  🚀 Start all:   ${GREEN}./scripts/start-all.sh${NC}"
echo -e "  🛑 Stop all:    ${RED}./scripts/stop-all.sh${NC}"
echo -e "  🔄 Restart all: ${YELLOW}./scripts/restart-all.sh${NC}"
echo -e "  📊 Status:      ${BLUE}./scripts/status.sh${NC}"
echo -e "  📋 View logs:   ${YELLOW}tail -f logs/backend.log${NC}"
echo ""
