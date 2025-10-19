#!/bin/bash

# Comet DevOps Platform - Production Deployment Script
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Comet DevOps Platform Deployment${NC}"
echo -e "${BLUE}  Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo -e "${YELLOW}Please copy .env.example to .env and configure it:${NC}"
    echo -e "  cp .env.example .env"
    echo -e "  nano .env"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo -e "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo -e "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${BLUE}[1/6]${NC} Pulling latest changes..."
git pull origin master || echo -e "${YELLOW}Warning: Could not pull latest changes${NC}"

echo -e "${BLUE}[2/6]${NC} Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down || true

echo -e "${BLUE}[3/6]${NC} Building Docker images..."
docker-compose -f $COMPOSE_FILE build --no-cache

echo -e "${BLUE}[4/6]${NC} Running database migrations..."
docker-compose -f $COMPOSE_FILE run --rm api-gateway npx prisma migrate deploy

echo -e "${BLUE}[5/6]${NC} Starting services..."
docker-compose -f $COMPOSE_FILE up -d

echo -e "${BLUE}[6/6]${NC} Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo -e "${BLUE}Checking service health...${NC}"

services=("api-gateway" "frontend" "postgres" "redis")
all_healthy=true

for service in "${services[@]}"; do
    if docker-compose -f $COMPOSE_FILE ps | grep -q "$service.*Up"; then
        echo -e "${GREEN}✓${NC} $service is running"
    else
        echo -e "${RED}✗${NC} $service is not running"
        all_healthy=false
    fi
done

echo ""
if [ "$all_healthy" = true ]; then
    echo -e "${GREEN}=====================================${NC}"
    echo -e "${GREEN}  Deployment Successful! 🚀${NC}"
    echo -e "${GREEN}=====================================${NC}"
    echo ""
    echo -e "${BLUE}Services:${NC}"
    echo -e "  Frontend:     http://localhost:3030"
    echo -e "  API Gateway:  http://localhost:8000"
    echo -e "  AI Services:  http://localhost:8001"
    echo ""
    echo -e "${YELLOW}View logs:${NC}"
    echo -e "  docker-compose -f $COMPOSE_FILE logs -f"
    echo ""
    echo -e "${YELLOW}View service status:${NC}"
    echo -e "  docker-compose -f $COMPOSE_FILE ps"
else
    echo -e "${RED}=====================================${NC}"
    echo -e "${RED}  Deployment Failed!${NC}"
    echo -e "${RED}=====================================${NC}"
    echo ""
    echo -e "${YELLOW}Check logs for errors:${NC}"
    echo -e "  docker-compose -f $COMPOSE_FILE logs"
    exit 1
fi
