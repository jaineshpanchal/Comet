#!/bin/bash

# ===========================================
# COMET DEVOPS PLATFORM - DEVELOPMENT MANAGER
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker to run database services."
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker."
        return 1
    fi
    
    return 0
}

# Start database services
start_databases() {
    print_status "Starting database services..."
    if check_docker; then
        docker-compose -f docker-compose.dev.yml up -d
        print_success "Database services started successfully!"
        echo ""
        echo "Services available:"
        echo "  - PostgreSQL: localhost:5432"
        echo "  - Redis: localhost:6379"
        echo "  - InfluxDB: localhost:8086"
        echo "  - Elasticsearch: localhost:9200"
        echo "  - Kibana: localhost:5601"
        echo "  - RabbitMQ: localhost:5672 (Management: localhost:15672)"
    else
        print_warning "Skipping database services (Docker not available)"
    fi
}

# Stop database services
stop_databases() {
    print_status "Stopping database services..."
    if check_docker; then
        docker-compose -f docker-compose.dev.yml down
        print_success "Database services stopped!"
    fi
}

# Start backend services
start_backend() {
    print_status "Starting backend services..."
    cd backend
    
    # Start API Gateway
    print_status "Starting API Gateway..."
    cd api-gateway
    npm run dev &
    API_GATEWAY_PID=$!
    cd ..
    
    # Start other services (placeholder - will be implemented)
    print_warning "Other backend services will be started as they are implemented"
    
    cd ..
    print_success "Backend services started!"
}

# Start frontend
start_frontend() {
    print_status "Starting frontend application..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    print_success "Frontend started at http://localhost:3000"
}

# Start AI services
start_ai_services() {
    print_status "Starting AI services..."
    cd ai-services
    source venv/bin/activate
    # Will start FastAPI server once implemented
    print_warning "AI services will be started as they are implemented"
    deactivate
    cd ..
}

# Show status
show_status() {
    echo ""
    echo "=== COMET DEVOPS PLATFORM STATUS ==="
    echo ""
    
    # Check backend dependencies
    if [ -d "backend/node_modules" ]; then
        print_success "Backend dependencies: Installed ✅"
    else
        print_error "Backend dependencies: Not installed ❌"
    fi
    
    # Check frontend dependencies
    if [ -d "frontend/node_modules" ]; then
        print_success "Frontend dependencies: Installed ✅"
    else
        print_error "Frontend dependencies: Not installed ❌"
    fi
    
    # Check AI services dependencies
    if [ -d "ai-services/venv" ]; then
        print_success "AI services dependencies: Installed ✅"
    else
        print_error "AI services dependencies: Not installed ❌"
    fi
    
    # Check Docker services
    if check_docker; then
        if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
            print_success "Database services: Running ✅"
        else
            print_warning "Database services: Not running ⚠️"
        fi
    else
        print_warning "Docker: Not available ⚠️"
    fi
    
    echo ""
}

# Show help
show_help() {
    echo "Comet DevOps Platform - Development Manager"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup      - Run initial setup (install dependencies)"
    echo "  start      - Start all services"
    echo "  stop       - Stop all services"
    echo "  restart    - Restart all services"
    echo "  db:start   - Start database services only"
    echo "  db:stop    - Stop database services only"
    echo "  backend    - Start backend services only"
    echo "  frontend   - Start frontend only"
    echo "  ai         - Start AI services only"
    echo "  status     - Show status of all components"
    echo "  logs       - Show logs"
    echo "  help       - Show this help message"
    echo ""
}

# Main command handler
case "$1" in
    "setup")
        print_status "Running Comet DevOps Platform setup..."
        ./setup-dev.sh
        ;;
    "start")
        print_status "Starting Comet DevOps Platform..."
        start_databases
        sleep 5
        start_backend
        start_frontend
        start_ai_services
        show_status
        ;;
    "stop")
        print_status "Stopping Comet DevOps Platform..."
        stop_databases
        # Kill background processes
        pkill -f "npm run dev" 2>/dev/null || true
        print_success "All services stopped!"
        ;;
    "restart")
        $0 stop
        sleep 3
        $0 start
        ;;
    "db:start")
        start_databases
        ;;
    "db:stop")
        stop_databases
        ;;
    "backend")
        start_backend
        ;;
    "frontend")
        start_frontend
        ;;
    "ai")
        start_ai_services
        ;;
    "status")
        show_status
        ;;
    "logs")
        if check_docker; then
            docker-compose -f docker-compose.dev.yml logs -f
        else
            print_error "Docker not available for logs"
        fi
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        if [ -z "$1" ]; then
            show_help
        else
            print_error "Unknown command: $1"
            show_help
        fi
        ;;
esac