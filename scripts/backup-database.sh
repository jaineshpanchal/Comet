#!/bin/bash

###############################################################################
# Database Backup Script for GoLive Platform
###############################################################################
#
# This script creates automated PostgreSQL backups with:
# - Timestamped backup files
# - Compression to save space
# - Retention policy (keeps last 30 days)
# - Error handling and logging
# - Backup verification
# - S3 upload support (optional)
#
# Usage:
#   ./backup-database.sh [environment]
#
# Example:
#   ./backup-database.sh production
#   ./backup-database.sh development
#
###############################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups/database}"
LOG_DIR="${LOG_DIR:-$PROJECT_ROOT/logs}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
ENVIRONMENT="${1:-development}"

# Timestamp for backup file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="golive_${ENVIRONMENT}_${TIMESTAMP}.sql.gz"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
LOG_FILE="$LOG_DIR/backup_${TIMESTAMP}.log"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

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

# Create necessary directories
create_directories() {
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    log_info "Backup directory: $BACKUP_DIR"
    log_info "Log directory: $LOG_DIR"
}

# Parse DATABASE_URL to extract connection details
parse_database_url() {
    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_error "DATABASE_URL not set"
        exit 1
    fi

    # Extract components from postgresql://user:pass@host:port/dbname
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        export PGUSER="${BASH_REMATCH[1]}"
        export PGPASSWORD="${BASH_REMATCH[2]}"
        export PGHOST="${BASH_REMATCH[3]}"
        export PGPORT="${BASH_REMATCH[4]}"
        export PGDATABASE="${BASH_REMATCH[5]}"

        log_info "Database: $PGDATABASE"
        log_info "Host: $PGHOST:$PGPORT"
        log_info "User: $PGUSER"
    else
        log_error "Invalid DATABASE_URL format"
        exit 1
    fi
}

# Check database connectivity
check_database_connection() {
    log_info "Checking database connectivity..."

    if pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" > /dev/null 2>&1; then
        log_info "Database is accessible"
    else
        log_error "Cannot connect to database"
        exit 1
    fi
}

# Get database size
get_database_size() {
    local size
    size=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c \
        "SELECT pg_size_pretty(pg_database_size('$PGDATABASE'))" 2>/dev/null | xargs)

    log_info "Database size: $size"
}

# Create backup
create_backup() {
    log_info "Starting backup: $BACKUP_FILE"

    # Use pg_dump with compression
    if pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
        --format=plain \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        2>> "$LOG_FILE" | gzip > "$BACKUP_PATH"; then

        local backup_size
        backup_size=$(du -h "$BACKUP_PATH" | cut -f1)
        log_info "Backup created successfully: $BACKUP_PATH ($backup_size)"
    else
        log_error "Backup failed"
        exit 1
    fi
}

# Verify backup
verify_backup() {
    log_info "Verifying backup integrity..."

    # Check if file exists and has content
    if [[ ! -f "$BACKUP_PATH" ]]; then
        log_error "Backup file not found"
        exit 1
    fi

    local file_size
    file_size=$(stat -f%z "$BACKUP_PATH" 2>/dev/null || stat -c%s "$BACKUP_PATH" 2>/dev/null)

    if [[ $file_size -lt 1024 ]]; then
        log_error "Backup file too small (${file_size} bytes) - possible corruption"
        exit 1
    fi

    # Test gzip integrity
    if gzip -t "$BACKUP_PATH" 2>> "$LOG_FILE"; then
        log_info "Backup integrity verified"
    else
        log_error "Backup file is corrupted"
        exit 1
    fi
}

# Clean old backups
clean_old_backups() {
    log_info "Cleaning backups older than $RETENTION_DAYS days..."

    local deleted_count=0

    # Find and delete old backups
    while IFS= read -r old_backup; do
        rm -f "$old_backup"
        ((deleted_count++))
        log_info "Deleted old backup: $(basename "$old_backup")"
    done < <(find "$BACKUP_DIR" -name "golive_${ENVIRONMENT}_*.sql.gz" -type f -mtime +${RETENTION_DAYS})

    if [[ $deleted_count -gt 0 ]]; then
        log_info "Deleted $deleted_count old backup(s)"
    else
        log_info "No old backups to clean"
    fi
}

# Upload to S3 (optional)
upload_to_s3() {
    if [[ -z "${AWS_S3_BACKUP_BUCKET:-}" ]]; then
        log_warn "AWS_S3_BACKUP_BUCKET not set, skipping S3 upload"
        return 0
    fi

    log_info "Uploading backup to S3: s3://$AWS_S3_BACKUP_BUCKET/$BACKUP_FILE"

    if command -v aws &> /dev/null; then
        if aws s3 cp "$BACKUP_PATH" "s3://$AWS_S3_BACKUP_BUCKET/$BACKUP_FILE" 2>> "$LOG_FILE"; then
            log_info "Backup uploaded to S3 successfully"
        else
            log_warn "S3 upload failed (backup is still stored locally)"
        fi
    else
        log_warn "AWS CLI not installed, skipping S3 upload"
    fi
}

# List available backups
list_backups() {
    log_info "Available backups:"

    local backup_count=0
    local total_size=0

    while IFS= read -r backup; do
        local backup_name=$(basename "$backup")
        local backup_size=$(du -h "$backup" | cut -f1)
        local backup_date=$(date -r "$backup" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -d "@$(stat -c%Y "$backup")" '+%Y-%m-%d %H:%M:%S')

        echo "  - $backup_name ($backup_size) - $backup_date" | tee -a "$LOG_FILE"
        ((backup_count++))
    done < <(find "$BACKUP_DIR" -name "golive_${ENVIRONMENT}_*.sql.gz" -type f | sort -r)

    log_info "Total backups: $backup_count"
}

# Send notification (optional)
send_notification() {
    local status=$1
    local message=$2

    # Slack webhook notification
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
                    \"title\": \"Database Backup - $ENVIRONMENT\",
                    \"text\": \"$message\",
                    \"ts\": $(date +%s)
                }]
            }" 2>> "$LOG_FILE" || true
    fi
}

# Main execution
main() {
    log_info "=========================================="
    log_info "GoLive Database Backup Script"
    log_info "Environment: $ENVIRONMENT"
    log_info "=========================================="

    # Setup
    create_directories
    load_env
    parse_database_url

    # Pre-backup checks
    check_database_connection
    get_database_size

    # Create and verify backup
    create_backup
    verify_backup

    # Post-backup tasks
    clean_old_backups
    upload_to_s3
    list_backups

    # Success notification
    log_info "=========================================="
    log_info "Backup completed successfully!"
    log_info "Backup file: $BACKUP_FILE"
    log_info "=========================================="

    send_notification "success" "Database backup completed successfully: $BACKUP_FILE"
}

# Error handler
trap 'log_error "Backup failed with error"; send_notification "failure" "Database backup failed - check logs"; exit 1' ERR

# Run main function
main "$@"
