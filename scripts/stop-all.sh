#!/bin/bash

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${YELLOW}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║     🛑 GOLIVE DEVOPS PLATFORM - STOPPING SERVICES        ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Function to kill process by PID file
kill_by_pid_file() {
    local pid_file=$1
    local service_name=$2

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping $service_name (PID: $pid)...${NC}"
            kill $pid 2>/dev/null
            sleep 1
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid 2>/dev/null
            fi
            rm -f "$pid_file"
            echo -e "${GREEN}✓ $service_name stopped${NC}"
        else
            echo -e "${RED}✗ $service_name not running${NC}"
            rm -f "$pid_file"
        fi
    fi
}

# Stop services using PID files
if [ -d "logs" ]; then
    kill_by_pid_file "logs/backend.pid" "Backend Services"
    kill_by_pid_file "logs/frontend.pid" "Frontend"
    kill_by_pid_file "logs/ai-services.pid" "AI Services"
    kill_by_pid_file "logs/prisma.pid" "Prisma Studio"
fi

# Kill any remaining processes on specific ports
echo ""
echo -e "${YELLOW}Cleaning up ports...${NC}"

PORTS=(3030 8000 8001 8002 8003 8004 8005 9000 9090 5555)
for port in "${PORTS[@]}"; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null
    fi
done

# Kill any remaining node and python processes related to the project
echo ""
echo -e "${YELLOW}Cleaning up remaining processes...${NC}"
pkill -f "next dev" 2>/dev/null && echo -e "${GREEN}✓ Next.js processes killed${NC}"
pkill -f "ts-node-dev" 2>/dev/null && echo -e "${GREEN}✓ TypeScript dev processes killed${NC}"
pkill -f "uvicorn main:app" 2>/dev/null && echo -e "${GREEN}✓ Uvicorn processes killed${NC}"
pkill -f "prisma studio" 2>/dev/null && echo -e "${GREEN}✓ Prisma Studio killed${NC}"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            ✅ ALL SERVICES STOPPED                        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
