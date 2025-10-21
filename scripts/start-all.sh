#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🚀 GOLIVE DEVOPS PLATFORM - STARTING SERVICES        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Create logs directory if it doesn't exist
mkdir -p logs

# Start Backend Services
echo -e "${YELLOW}📦 Starting Backend Services...${NC}"
npm run dev:backend > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > logs/backend.pid
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
sleep 8

# Start Frontend
echo -e "${YELLOW}🎨 Starting Frontend...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
sleep 3

# Start AI Services (optional)
if [ -d "ai-services" ]; then
    echo -e "${YELLOW}🤖 Starting AI Services...${NC}"
    cd ai-services
    python -m uvicorn main:app --reload --port 9000 > ../logs/ai-services.log 2>&1 &
    AI_PID=$!
    echo $AI_PID > ../logs/ai-services.pid
    cd ..
    echo -e "${GREEN}✓ AI Services started (PID: $AI_PID)${NC}"
fi

# Start Prisma Studio (optional)
echo -e "${YELLOW}📊 Starting Prisma Studio...${NC}"
cd backend/api-gateway
npx prisma studio --port 5555 > ../../logs/prisma.log 2>&1 &
PRISMA_PID=$!
echo $PRISMA_PID > ../../logs/prisma.pid
cd ../..
echo -e "${GREEN}✓ Prisma Studio started (PID: $PRISMA_PID)${NC}"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║               ✅ ALL SERVICES STARTED                     ║${NC}"
echo -e "${BLUE}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║                                                          ║${NC}"
echo -e "${BLUE}║  🌐 Frontend:        http://localhost:3030               ║${NC}"
echo -e "${BLUE}║  🔧 API Gateway:     http://localhost:8000               ║${NC}"
echo -e "${BLUE}║  📚 API Docs:        http://localhost:8000/api/docs      ║${NC}"
echo -e "${BLUE}║  🤖 AI Services:     http://localhost:9000               ║${NC}"
echo -e "${BLUE}║  📊 Prisma Studio:   http://localhost:5555               ║${NC}"
echo -e "${BLUE}║                                                          ║${NC}"
echo -e "${BLUE}║  📋 Logs:            ./logs/                             ║${NC}"
echo -e "${BLUE}║  🛑 Stop services:   ./scripts/stop-all.sh               ║${NC}"
echo -e "${BLUE}║  🔄 Restart:         ./scripts/restart-all.sh            ║${NC}"
echo -e "${BLUE}║                                                          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✨ All services are running! Check logs in ./logs/ directory${NC}"
