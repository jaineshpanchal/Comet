#!/bin/bash

# Colors for output
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🔄 GOLIVE DEVOPS PLATFORM - RESTARTING SERVICES      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Stop all services
bash "$SCRIPT_DIR/stop-all.sh"

# Wait a moment
echo ""
echo -e "${BLUE}Waiting 3 seconds before restart...${NC}"
sleep 3
echo ""

# Start all services
bash "$SCRIPT_DIR/start-all.sh"
