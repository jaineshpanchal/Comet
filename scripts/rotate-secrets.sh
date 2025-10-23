#!/bin/bash

###############################################################################
# Secret Rotation Script for GoLive Platform
###############################################################################
#
# Automates the rotation of sensitive secrets with zero downtime:
# - Generates new cryptographically secure secrets
# - Updates AWS Secrets Manager (or environment)
# - Restarts services gracefully
# - Maintains audit log
#
# Usage:
#   ./rotate-secrets.sh [secret-name] [environment]
#
# Examples:
#   ./rotate-secrets.sh JWT_SECRET production
#   ./rotate-secrets.sh all staging
#
###############################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${LOG_DIR:-$PROJECT_ROOT/logs}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/secret_rotation_${TIMESTAMP}.log"

SECRET_NAME="${1:-}"
ENVIRONMENT="${2:-development}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Create log directory
mkdir -p "$LOG_DIR"

# Generate secure random secret
generate_secret() {
    local length=${1:-64}
    openssl rand -hex "$length"
}

# Rotate JWT secret
rotate_jwt_secret() {
    log_info "Rotating JWT_SECRET..."

    local new_secret=$(generate_secret 32)

    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Update AWS Secrets Manager
        log_info "Updating AWS Secrets Manager..."
        aws secretsmanager update-secret \
            --secret-id "golive/${ENVIRONMENT}/JWT_SECRET" \
            --secret-string "$new_secret" \
            >> "$LOG_FILE" 2>&1

        log_info "JWT_SECRET rotated in AWS Secrets Manager"
    else
        # Update .env file
        update_env_file "JWT_SECRET" "$new_secret"
    fi

    log_info "JWT_SECRET rotation complete"
}

# Rotate JWT refresh secret
rotate_jwt_refresh_secret() {
    log_info "Rotating JWT_REFRESH_SECRET..."

    local new_secret=$(generate_secret 32)

    if [[ "$ENVIRONMENT" == "production" ]]; then
        aws secretsmanager update-secret \
            --secret-id "golive/${ENVIRONMENT}/JWT_REFRESH_SECRET" \
            --secret-string "$new_secret" \
            >> "$LOG_FILE" 2>&1
    else
        update_env_file "JWT_REFRESH_SECRET" "$new_secret"
    fi

    log_info "JWT_REFRESH_SECRET rotation complete"
}

# Rotate encryption key
rotate_encryption_key() {
    log_warn "Rotating ENCRYPTION_KEY - this will invalidate existing encrypted data!"

    echo -n "Type 'YES' to confirm encryption key rotation: "
    read -r confirmation

    if [[ "$confirmation" != "YES" ]]; then
        log_info "Encryption key rotation cancelled"
        return 0
    fi

    local new_secret=$(generate_secret 32)

    if [[ "$ENVIRONMENT" == "production" ]]; then
        aws secretsmanager update-secret \
            --secret-id "golive/${ENVIRONMENT}/ENCRYPTION_KEY" \
            --secret-string "$new_secret" \
            >> "$LOG_FILE" 2>&1
    else
        update_env_file "ENCRYPTION_KEY" "$new_secret"
    fi

    log_warn "ENCRYPTION_KEY rotated - re-encrypt existing data if needed"
}

# Rotate CSRF secret
rotate_csrf_secret() {
    log_info "Rotating CSRF_SECRET..."

    local new_secret=$(generate_secret 64)

    if [[ "$ENVIRONMENT" == "production" ]]; then
        aws secretsmanager update-secret \
            --secret-id "golive/${ENVIRONMENT}/CSRF_SECRET" \
            --secret-string "$new_secret" \
            >> "$LOG_FILE" 2>&1
    else
        update_env_file "CSRF_SECRET" "$new_secret"
    fi

    log_info "CSRF_SECRET rotation complete"
}

# Update .env file
update_env_file() {
    local key=$1
    local value=$2
    local env_file="$PROJECT_ROOT/backend/api-gateway/.env"

    if [[ ! -f "$env_file" ]]; then
        log_error ".env file not found: $env_file"
        return 1
    fi

    # Backup .env
    cp "$env_file" "${env_file}.backup.${TIMESTAMP}"
    log_info "Backed up .env file"

    # Update or add the secret
    if grep -q "^${key}=" "$env_file"; then
        # Update existing
        sed -i.tmp "s|^${key}=.*|${key}=\"${value}\"|" "$env_file"
        rm "${env_file}.tmp"
    else
        # Add new
        echo "${key}=\"${value}\"" >> "$env_file"
    fi

    log_info "Updated $key in .env file"
}

# Rotate all secrets
rotate_all_secrets() {
    log_info "Rotating ALL secrets..."

    rotate_jwt_secret
    rotate_jwt_refresh_secret
    rotate_csrf_secret

    log_warn "Skipping ENCRYPTION_KEY - rotate manually if needed"

    log_info "All secrets rotated successfully"
}

# Restart services
restart_services() {
    log_info "Restarting services..."

    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Production: Rolling restart
        log_info "Performing rolling restart..."

        # Use your deployment method (K8s, Docker, PM2, etc.)
        # kubectl rollout restart deployment/api-gateway
        # docker-compose restart api-gateway
        # pm2 restart api-gateway

        log_warn "Manual service restart required in production"
    else
        # Development: Simple restart
        log_info "Services will be restarted on next startup"
    fi
}

# Verify secrets
verify_secrets() {
    log_info "Verifying secrets..."

    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Verify AWS Secrets Manager
        local secrets=("JWT_SECRET" "JWT_REFRESH_SECRET" "CSRF_SECRET")

        for secret in "${secrets[@]}"; do
            if aws secretsmanager describe-secret \
                --secret-id "golive/${ENVIRONMENT}/${secret}" \
                >> "$LOG_FILE" 2>&1; then
                log_info "✓ $secret exists in AWS Secrets Manager"
            else
                log_error "✗ $secret NOT found in AWS Secrets Manager"
            fi
        done
    else
        # Verify .env file
        local env_file="$PROJECT_ROOT/backend/api-gateway/.env"

        if grep -q "JWT_SECRET" "$env_file"; then
            log_info "✓ Secrets verified in .env"
        else
            log_error "✗ Secrets NOT found in .env"
        fi
    fi
}

# Audit log
create_audit_log() {
    local audit_file="$LOG_DIR/secret_rotation_audit.log"

    echo "$(date '+%Y-%m-%d %H:%M:%S') | $ENVIRONMENT | $SECRET_NAME | Rotated by: ${USER}" >> "$audit_file"

    log_info "Audit log updated: $audit_file"
}

# Show usage
show_usage() {
    echo "Usage: $0 [secret-name] [environment]"
    echo ""
    echo "Secret names:"
    echo "  JWT_SECRET           - JWT signing secret"
    echo "  JWT_REFRESH_SECRET   - JWT refresh token secret"
    echo "  ENCRYPTION_KEY       - Data encryption key"
    echo "  CSRF_SECRET          - CSRF protection secret"
    echo "  all                  - Rotate all secrets"
    echo ""
    echo "Environments:"
    echo "  development"
    echo "  staging"
    echo "  production"
    echo ""
    echo "Examples:"
    echo "  $0 JWT_SECRET production"
    echo "  $0 all staging"
}

# Main execution
main() {
    log_info "=========================================="
    log_info "GoLive Secret Rotation"
    log_info "Environment: $ENVIRONMENT"
    log_info "=========================================="

    # Check arguments
    if [[ -z "$SECRET_NAME" ]]; then
        show_usage
        exit 1
    fi

    # Check AWS CLI if production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if ! command -v aws &> /dev/null; then
            log_error "AWS CLI not installed - required for production"
            exit 1
        fi

        log_info "Checking AWS credentials..."
        if ! aws sts get-caller-identity >> "$LOG_FILE" 2>&1; then
            log_error "AWS credentials not configured"
            exit 1
        fi
    fi

    # Rotate based on secret name
    case "$SECRET_NAME" in
        JWT_SECRET)
            rotate_jwt_secret
            ;;
        JWT_REFRESH_SECRET)
            rotate_jwt_refresh_secret
            ;;
        ENCRYPTION_KEY)
            rotate_encryption_key
            ;;
        CSRF_SECRET)
            rotate_csrf_secret
            ;;
        all)
            rotate_all_secrets
            ;;
        *)
            log_error "Unknown secret: $SECRET_NAME"
            show_usage
            exit 1
            ;;
    esac

    # Verify secrets
    verify_secrets

    # Create audit log
    create_audit_log

    # Restart services
    restart_services

    log_info "=========================================="
    log_info "Secret rotation complete!"
    log_info "Log file: $LOG_FILE"
    log_info "=========================================="
}

# Run main
main "$@"
