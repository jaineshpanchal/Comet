#!/bin/bash

###############################################################################
# Database Restore Script for GoLive Platform
###############################################################################
#
# This script restores PostgreSQL backups with:
# - Interactive backup selection
# - Pre-restore database backup
# - Connection validation
# - Restore verification
# - Rollback support
#
# Usage:
#   ./restore-database.sh [backup_file] [environment]
#
# Example:
#   ./restore-database.sh golive_production_20250123_143000.sql.gz production
#   ./restore-database.sh  # Interactive mode
#
###############################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups/database}"
LOG_DIR="${LOG_DIR:-$PROJECT_ROOT/logs}"
ENVIRONMENT="${2:-development}"
BACKUP_FILE="${1:-}"

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/restore_${TIMESTAMP}.log"
PRE_RESTORE_BACKUP="golive_${ENVIRONMENT}_pre_restore_${TIMESTAMP}.sql.gz"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Create necessary directories
create_directories() {
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
}

# Load environment variables
load_env() {
    local env_file="$PROJECT_ROOT/backend/api-gateway/.env"

    if [[ -f "$env_file" ]]; then
        log_info "Loading environment from $env_file"
        export $(grep -v '^#' "$env_file" | xargs)
    else
        log_error "Environment file not found: $env_file"
        exit 1
    fi
}

# Parse DATABASE_URL
parse_database_url() {
    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_error "DATABASE_URL not set"
        exit 1
    fi

    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        export PGUSER="${BASH_REMATCH[1]}"
        export PGPASSWORD="${BASH_REMATCH[2]}"
        export PGHOST="${BASH_REMATCH[3]}"
        export PGPORT="${BASH_REMATCH[4]}"
        export PGDATABASE="${BASH_REMATCH[5]}"

        log_info "Database: $PGDATABASE"
        log_info "Host: $PGHOST:$PGPORT"
    else
        log_error "Invalid DATABASE_URL format"
        exit 1
    fi
}

# List available backups
list_available_backups() {
    echo ""
    log_info "Available backups for $ENVIRONMENT:"
    echo ""

    local backups=()
    local index=1

    while IFS= read -r backup; do
        local backup_name=$(basename "$backup")
        local backup_size=$(du -h "$backup" | cut -f1)
        local backup_date=$(date -r "$backup" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -d "@$(stat -c%Y "$backup")" '+%Y-%m-%d %H:%M:%S')

        backups+=("$backup")
        echo "  [$index] $backup_name"
        echo "      Size: $backup_size | Date: $backup_date"
        echo ""
        ((index++))
    done < <(find "$BACKUP_DIR" -name "golive_${ENVIRONMENT}_*.sql.gz" -type f | grep -v "pre_restore" | sort -r)

    if [[ ${#backups[@]} -eq 0 ]]; then
        log_error "No backups found for environment: $ENVIRONMENT"
        exit 1
    fi

    # Interactive selection
    echo -n "Select backup number to restore (1-${#backups[@]}) or 'q' to quit: "
    read -r selection

    if [[ "$selection" == "q" ]]; then
        log_info "Restore cancelled by user"
        exit 0
    fi

    if [[ ! "$selection" =~ ^[0-9]+$ ]] || [[ $selection -lt 1 ]] || [[ $selection -gt ${#backups[@]} ]]; then
        log_error "Invalid selection"
        exit 1
    fi

    BACKUP_FILE=$(basename "${backups[$((selection-1))]}")
    log_info "Selected backup: $BACKUP_FILE"
}

# Confirm restore
confirm_restore() {
    echo ""
    log_warn "⚠️  WARNING: This will REPLACE the current database!"
    log_warn "   Database: $PGDATABASE"
    log_warn "   Environment: $ENVIRONMENT"
    log_warn "   Backup: $BACKUP_FILE"
    echo ""
    log_info "A pre-restore backup will be created automatically"
    echo ""
    echo -n "Type 'YES' to confirm restore: "
    read -r confirmation

    if [[ "$confirmation" != "YES" ]]; then
        log_info "Restore cancelled by user"
        exit 0
    fi
}

# Check database connection
check_database_connection() {
    log_step "Checking database connectivity..."

    if pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" > /dev/null 2>&1; then
        log_info "Database is accessible"
    else
        log_error "Cannot connect to database"
        exit 1
    fi
}

# Create pre-restore backup
create_pre_restore_backup() {
    log_step "Creating pre-restore backup..."

    local backup_path="$BACKUP_DIR/$PRE_RESTORE_BACKUP"

    if pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
        --format=plain \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        2>> "$LOG_FILE" | gzip > "$backup_path"; then

        local backup_size=$(du -h "$backup_path" | cut -f1)
        log_info "Pre-restore backup created: $PRE_RESTORE_BACKUP ($backup_size)"
    else
        log_error "Pre-restore backup failed"
        exit 1
    fi
}

# Terminate active connections
terminate_connections() {
    log_step "Terminating active database connections..."

    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$PGDATABASE' AND pid <> pg_backend_pid();" \
        >> "$LOG_FILE" 2>&1 || true

    log_info "Active connections terminated"
}

# Restore database
restore_database() {
    log_step "Restoring database from backup..."

    local backup_path="$BACKUP_DIR/$BACKUP_FILE"

    if [[ ! -f "$backup_path" ]]; then
        log_error "Backup file not found: $backup_path"
        exit 1
    fi

    # Restore from backup
    if gunzip -c "$backup_path" | psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
        2>> "$LOG_FILE" 1>> "$LOG_FILE"; then
        log_info "Database restored successfully"
    else
        log_error "Restore failed - check log file: $LOG_FILE"
        log_warn "You can rollback using: $PRE_RESTORE_BACKUP"
        exit 1
    fi
}

# Verify restore
verify_restore() {
    log_step "Verifying restore..."

    # Check if database is accessible
    if ! psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1" > /dev/null 2>&1; then
        log_error "Database verification failed - database not accessible"
        exit 1
    fi

    # Count tables
    local table_count
    table_count=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null | xargs)

    log_info "Database has $table_count tables"

    if [[ $table_count -eq 0 ]]; then
        log_warn "No tables found in database - this may indicate an issue"
    fi

    # Sample data check
    log_info "Checking sample data..."
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c \
        "SELECT 'users: ' || COUNT(*)::text FROM users UNION ALL
         SELECT 'projects: ' || COUNT(*)::text FROM projects UNION ALL
         SELECT 'pipelines: ' || COUNT(*)::text FROM pipelines" \
        2>> "$LOG_FILE" | tee -a "$LOG_FILE"

    log_info "Restore verification complete"
}

# Run Prisma migrations (if needed)
run_migrations() {
    log_step "Checking if migrations are needed..."

    local prisma_dir="$PROJECT_ROOT/backend/api-gateway"

    if [[ -d "$prisma_dir/prisma" ]]; then
        log_info "Running Prisma migrations..."
        cd "$prisma_dir"

        if npx prisma migrate deploy >> "$LOG_FILE" 2>&1; then
            log_info "Migrations applied successfully"
        else
            log_warn "Migration failed - you may need to run manually"
        fi

        cd "$PROJECT_ROOT"
    else
        log_warn "Prisma directory not found, skipping migrations"
    fi
}

# Send notification
send_notification() {
    local status=$1
    local message=$2

    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local color
        if [[ "$status" == "success" ]]; then
            color="good"
        else
            color="danger"
        fi

        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"Database Restore - $ENVIRONMENT\",
                    \"text\": \"$message\",
                    \"ts\": $(date +%s)
                }]
            }" 2>> "$LOG_FILE" || true
    fi
}

# Main execution
main() {
    log_info "=========================================="
    log_info "GoLive Database Restore Script"
    log_info "Environment: $ENVIRONMENT"
    log_info "=========================================="

    # Setup
    create_directories
    load_env
    parse_database_url

    # Select backup if not provided
    if [[ -z "$BACKUP_FILE" ]]; then
        list_available_backups
    fi

    # Confirm restore
    confirm_restore

    # Pre-restore checks
    check_database_connection

    # Create safety backup
    create_pre_restore_backup

    # Perform restore
    terminate_connections
    restore_database
    verify_restore
    run_migrations

    # Success
    log_info "=========================================="
    log_info "Database restored successfully!"
    log_info "Backup used: $BACKUP_FILE"
    log_info "Pre-restore backup: $PRE_RESTORE_BACKUP"
    log_info "=========================================="

    send_notification "success" "Database restored successfully from: $BACKUP_FILE"
}

# Error handler
trap 'log_error "Restore failed - pre-restore backup available: $PRE_RESTORE_BACKUP"; send_notification "failure" "Database restore failed - check logs"; exit 1' ERR

# Run main function
main "$@"
