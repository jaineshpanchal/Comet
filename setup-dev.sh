#!/bin/bash

# 🚀 Comet DevOps Platform - Development Environment Setup
# This script sets up the complete development environment for Comet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Node.js
    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js version 18 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check npm
    if ! command_exists npm; then
        log_error "npm is not installed."
        exit 1
    fi
    
    # Check Python
    if ! command_exists python3; then
        log_error "Python 3 is not installed. Please install Python 3.9 or higher."
        exit 1
    fi
    
    python_version=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)
    if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 9) else 1)"; then
        log_error "Python 3.9 or higher is required. Current version: $(python3 --version)"
        exit 1
    fi
    
    # Check pip
    if ! command_exists pip3; then
        log_error "pip3 is not installed."
        exit 1
    fi
    
    # Check Docker
    if ! command_exists docker; then
        log_warning "Docker is not installed. Some features may not work."
    fi
    
    # Check Docker Compose
    if ! command_exists docker-compose; then
        log_warning "Docker Compose is not installed. Some features may not work."
    fi
    
    log_success "System requirements check completed"
}

# Install backend dependencies
setup_backend() {
    log_info "Setting up backend services..."
    
    # Install root backend dependencies
    if [ -f "backend/package.json" ]; then
        cd backend
        log_info "Installing backend dependencies..."
        npm install
        cd ..
        log_success "Backend dependencies installed"
    fi
    
    # Install API Gateway dependencies
    if [ -f "backend/api-gateway/package.json" ]; then
        cd backend/api-gateway
        log_info "Installing API Gateway dependencies..."
        npm install
        cd ../..
        log_success "API Gateway dependencies installed"
    fi
}

# Install frontend dependencies
setup_frontend() {
    log_info "Setting up frontend application..."
    
    if [ -f "frontend/package.json" ]; then
        cd frontend
        log_info "Installing frontend dependencies..."
        npm install
        cd ..
        log_success "Frontend dependencies installed"
    fi
}

# Install AI services dependencies
setup_ai_services() {
    log_info "Setting up AI services..."
    
    if [ -f "ai-services/requirements.txt" ]; then
        cd ai-services
        
        # Create virtual environment if it doesn't exist
        if [ ! -d "venv" ]; then
            log_info "Creating Python virtual environment..."
            python3 -m venv venv
        fi
        
        # Activate virtual environment
        log_info "Activating virtual environment..."
        source venv/bin/activate
        
        # Upgrade pip
        log_info "Upgrading pip..."
        pip install --upgrade pip
        
        # Install dependencies
        log_info "Installing AI services dependencies..."
        pip install -r requirements.txt
        
        deactivate
        cd ..
        log_success "AI services dependencies installed"
    fi
}

# Setup databases
setup_databases() {
    log_info "Setting up databases..."
    
    if command_exists docker && command_exists docker-compose; then
        # Create directories for database data
        mkdir -p data/postgres
        mkdir -p data/redis
        mkdir -p data/elasticsearch
        mkdir -p logs
        
        # Start databases with Docker Compose
        log_info "Starting database services with Docker..."
        docker-compose up -d postgres redis elasticsearch
        
        # Wait for databases to be ready
        log_info "Waiting for databases to be ready..."
        sleep 10
        
        # Check if PostgreSQL is ready
        max_attempts=30
        attempt=1
        while [ $attempt -le $max_attempts ]; do
            if docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
                log_success "PostgreSQL is ready"
                break
            fi
            log_info "Waiting for PostgreSQL... (attempt $attempt/$max_attempts)"
            sleep 2
            attempt=$((attempt + 1))
        done
        
        if [ $attempt -gt $max_attempts ]; then
            log_error "PostgreSQL failed to start within the expected time"
            exit 1
        fi
        
        log_success "Database services started"
    else
        log_warning "Docker not available. Please set up databases manually."
        log_info "Required databases: PostgreSQL, Redis, ElasticSearch"
    fi
}

# Create environment files
create_env_files() {
    log_info "Creating environment configuration files..."
    
    # Backend API Gateway .env
    if [ ! -f "backend/api-gateway/.env" ]; then
        cat > backend/api-gateway/.env << EOF
# Environment
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/comet_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this
REFRESH_TOKEN_EXPIRES_IN=7d

# Services URLs
PIPELINE_SERVICE_URL=http://localhost:3001
TESTING_SERVICE_URL=http://localhost:3002
INTEGRATION_SERVICE_URL=http://localhost:3003
ANALYSIS_SERVICE_URL=http://localhost:3004
MONITORING_SERVICE_URL=http://localhost:3005
AI_SERVICE_URL=http://localhost:8001

# Frontend
FRONTEND_URL=http://localhost:3030

# Logging
LOG_LEVEL=info
EOF
        log_success "Backend API Gateway .env created"
    fi
    
    # Frontend .env
    if [ ! -f "frontend/.env.local" ]; then
        cat > frontend/.env.local << EOF
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8001

# Environment
NODE_ENV=development

# Authentication
NEXTAUTH_URL=http://localhost:3030
NEXTAUTH_SECRET=your-nextauth-secret-change-this-in-production
EOF
        log_success "Frontend .env.local created"
    fi
    
    # AI Services .env
    if [ ! -f "ai-services/.env" ]; then
        cat > ai-services/.env << EOF
# Environment
PYTHONPATH=/app
ENVIRONMENT=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/comet_dev

# Redis
REDIS_URL=redis://localhost:6379

# OpenAI
OPENAI_API_KEY=your-openai-api-key-here

# Model Configuration
MODEL_CACHE_DIR=./models
MAX_WORKERS=4

# Logging
LOG_LEVEL=INFO
EOF
        log_success "AI Services .env created"
    fi
    
    # Root .env
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# Comet DevOps Platform - Development Environment

# Database Configuration
POSTGRES_DB=comet_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Redis Configuration
REDIS_PASSWORD=

# ElasticSearch Configuration
ELASTIC_PASSWORD=changeme

# Development Ports
API_GATEWAY_PORT=3000
FRONTEND_PORT=3030
AI_SERVICES_PORT=8001

# Docker Configuration
DOCKER_REGISTRY=localhost:5000
COMPOSE_PROJECT_NAME=comet
EOF
        log_success "Root .env created"
    fi
}

# Setup Git hooks
setup_git_hooks() {
    log_info "Setting up Git hooks..."
    
    if [ -d ".git" ]; then
        # Pre-commit hook
        cat > .git/hooks/pre-commit << EOF
#!/bin/sh
# Comet DevOps Platform - Pre-commit hook

echo "Running pre-commit checks..."

# Check for secrets
if git diff --cached --name-only | xargs grep -l "api[_-]key\|secret\|password\|token" 2>/dev/null; then
    echo "⚠️  Warning: Potential secrets detected in staged files"
    echo "Please review your changes before committing"
fi

# Run linting for staged files
if git diff --cached --name-only | grep -E "\.(js|jsx|ts|tsx)$" > /dev/null; then
    echo "Running ESLint on staged files..."
    npm run lint:staged
fi

# Run Python linting for staged files
if git diff --cached --name-only | grep -E "\.py$" > /dev/null; then
    echo "Running Python linting on staged files..."
    if [ -f "ai-services/venv/bin/activate" ]; then
        cd ai-services
        source venv/bin/activate
        black --check .
        isort --check-only .
        deactivate
        cd ..
    fi
fi

echo "Pre-commit checks completed ✅"
EOF
        
        chmod +x .git/hooks/pre-commit
        log_success "Git pre-commit hook installed"
        
        # Pre-push hook
        cat > .git/hooks/pre-push << EOF
#!/bin/sh
# Comet DevOps Platform - Pre-push hook

echo "Running pre-push checks..."

# Run tests before pushing
echo "Running backend tests..."
if [ -f "backend/package.json" ]; then
    cd backend
    npm test
    cd ..
fi

echo "Running frontend tests..."
if [ -f "frontend/package.json" ]; then
    cd frontend
    npm test -- --watchAll=false
    cd ..
fi

echo "Pre-push checks completed ✅"
EOF
        
        chmod +x .git/hooks/pre-push
        log_success "Git pre-push hook installed"
    fi
}

# Create development scripts
create_dev_scripts() {
    log_info "Creating development scripts..."
    
    # Start script
    cat > start-dev.sh << EOF
#!/bin/bash
# Start Comet DevOps Platform in development mode

echo "🚀 Starting Comet DevOps Platform..."

# Start databases
echo "Starting databases..."
docker-compose up -d postgres redis elasticsearch

# Wait for databases
sleep 5

# Start AI services
echo "Starting AI services..."
cd ai-services
source venv/bin/activate
uvicorn main:app --reload --port 8001 &
AI_PID=\$!
deactivate
cd ..

# Start backend services
echo "Starting backend services..."
cd backend
npm run dev &
BACKEND_PID=\$!
cd ..

# Start frontend
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=\$!
cd ..

echo "✅ All services started!"
echo "Frontend: http://localhost:3030"
echo "API Gateway: http://localhost:3000"
echo "AI Services: http://localhost:8001"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "Stopping services..."; kill \$AI_PID \$BACKEND_PID \$FRONTEND_PID; docker-compose stop; exit' INT
wait
EOF
    
    chmod +x start-dev.sh
    log_success "Development start script created"
    
    # Stop script
    cat > stop-dev.sh << EOF
#!/bin/bash
# Stop Comet DevOps Platform development environment

echo "🛑 Stopping Comet DevOps Platform..."

# Stop Node.js processes
pkill -f "node.*comet" || true
pkill -f "next.*dev" || true

# Stop Python processes
pkill -f "uvicorn.*main:app" || true

# Stop Docker services
docker-compose stop

echo "✅ All services stopped!"
EOF
    
    chmod +x stop-dev.sh
    log_success "Development stop script created"
    
    # Reset script
    cat > reset-dev.sh << EOF
#!/bin/bash
# Reset Comet DevOps Platform development environment

echo "🔄 Resetting development environment..."

# Stop all services
./stop-dev.sh

# Clean Docker volumes
docker-compose down -v

# Clean node_modules
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

# Clean Python cache
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true

# Clean build artifacts
rm -rf backend/dist
rm -rf frontend/.next
rm -rf ai-services/venv

echo "✅ Development environment reset completed!"
echo "Run './setup-dev.sh' to reinstall dependencies"
EOF
    
    chmod +x reset-dev.sh
    log_success "Development reset script created"
}

# Create VS Code workspace
create_vscode_workspace() {
    log_info "Creating VS Code workspace configuration..."
    
    cat > comet.code-workspace << EOF
{
    "folders": [
        {
            "name": "🚀 Comet DevOps Platform",
            "path": "."
        },
        {
            "name": "🔧 Backend Services",
            "path": "./backend"
        },
        {
            "name": "🎨 Frontend App",
            "path": "./frontend"
        },
        {
            "name": "🤖 AI Services",
            "path": "./ai-services"
        },
        {
            "name": "📚 Documentation",
            "path": "./docs"
        }
    ],
    "settings": {
        "typescript.preferences.useAliasesForRenames": false,
        "typescript.updateImportsOnFileMove.enabled": "always",
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
            "source.fixAll.eslint": true,
            "source.organizeImports": true
        },
        "python.defaultInterpreterPath": "./ai-services/venv/bin/python",
        "python.formatting.provider": "black",
        "python.linting.enabled": true,
        "python.linting.pylintEnabled": true,
        "files.exclude": {
            "**/node_modules": true,
            "**/__pycache__": true,
            "**/venv": false
        },
        "search.exclude": {
            "**/node_modules": true,
            "**/dist": true,
            "**/.next": true,
            "**/venv": true
        }
    },
    "extensions": {
        "recommendations": [
            "ms-vscode.vscode-typescript-next",
            "bradlc.vscode-tailwindcss",
            "ms-python.python",
            "ms-python.black-formatter",
            "esbenp.prettier-vscode",
            "ms-vscode.vscode-eslint",
            "formulahendry.auto-rename-tag",
            "christian-kohler.path-intellisense",
            "ms-vscode.vscode-json",
            "redhat.vscode-yaml",
            "ms-azuretools.vscode-docker",
            "rangav.vscode-thunder-client"
        ]
    },
    "tasks": {
        "version": "2.0.0",
        "tasks": [
            {
                "label": "Start Development",
                "type": "shell",
                "command": "./start-dev.sh",
                "group": "build",
                "presentation": {
                    "echo": true,
                    "reveal": "always",
                    "focus": false,
                    "panel": "new"
                },
                "problemMatcher": []
            },
            {
                "label": "Stop Development",
                "type": "shell",
                "command": "./stop-dev.sh",
                "group": "build",
                "presentation": {
                    "echo": true,
                    "reveal": "always",
                    "focus": false,
                    "panel": "new"
                },
                "problemMatcher": []
            },
            {
                "label": "Reset Environment",
                "type": "shell",
                "command": "./reset-dev.sh",
                "group": "build",
                "presentation": {
                    "echo": true,
                    "reveal": "always",
                    "focus": false,
                    "panel": "new"
                },
                "problemMatcher": []
            }
        ]
    }
}
EOF
    
    log_success "VS Code workspace configuration created"
}

# Main setup function
main() {
    echo "🚀 Comet DevOps Platform - Development Environment Setup"
    echo "======================================================="
    echo ""
    
    check_requirements
    echo ""
    
    setup_backend
    echo ""
    
    setup_frontend
    echo ""
    
    setup_ai_services
    echo ""
    
    setup_databases
    echo ""
    
    create_env_files
    echo ""
    
    setup_git_hooks
    echo ""
    
    create_dev_scripts
    echo ""
    
    create_vscode_workspace
    echo ""
    
    log_success "🎉 Development environment setup completed!"
    echo ""
    echo "Next steps:"
    echo "1. Review and update the .env files with your API keys"
    echo "2. Run './start-dev.sh' to start all services"
    echo "3. Open http://localhost:3030 to access the frontend"
    echo "4. Open the VS Code workspace: code comet.code-workspace"
    echo ""
    echo "Useful commands:"
    echo "  ./start-dev.sh  - Start all development services"
    echo "  ./stop-dev.sh   - Stop all development services"
    echo "  ./reset-dev.sh  - Reset the development environment"
    echo ""
    echo "Happy coding! 🚀"
}

# Run main function
main "$@"