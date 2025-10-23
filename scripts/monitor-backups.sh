#!/bin/bash

###############################################################################
# Backup Monitoring Script for GoLive Platform
###############################################################################
#
# This script monitors backup health and sends alerts for:
# - Missing backups (no backup in last 24 hours)
# - Failed backups (check logs for errors)
# - Storage capacity issues
# - Old backups exceeding retention policy
# - Backup size anomalies
#
# Usage:
#   ./monitor-backups.sh [environment]
#
# Example:
#   ./monitor-backups.sh production
#
# Can be scheduled to run periodically (e.g., every 6 hours)
#
###############################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups/database}"
LOG_DIR="${LOG_DIR:-$PROJECT_ROOT/logs}"
ENVIRONMENT="${1:-production}"
ALERT_THRESHOLD_HOURS="${ALERT_THRESHOLD_HOURS:-24}"
STORAGE_WARNING_PERCENT="${STORAGE_WARNING_PERCENT:-80}"
MIN_BACKUP_SIZE_KB="${MIN_BACKUP_SIZE_KB:-100}"

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
MONITOR_LOG="$LOG_DIR/monitor_${TIMESTAMP}.log"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Alert status
ALERT_TRIGGERED=0
ALERT_MESSAGES=()

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$MONITOR_LOG"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$MONITOR_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$MONITOR_LOG"
}

log_alert() {
    echo -e "${RED}[ALERT]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$MONITOR_LOG"
    ALERT_MESSAGES+=("$1")
    ALERT_TRIGGERED=1
}

# Create directories
create_directories() {
    mkdir -p "$LOG_DIR"
}

# Check if backup directory exists
check_backup_directory() {
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_alert "Backup directory does not exist: $BACKUP_DIR"
        return 1
    fi

    log_info "Backup directory: $BACKUP_DIR"
}

# Check for recent backups
check_recent_backup() {
    log_info "Checking for recent backups (last $ALERT_THRESHOLD_HOURS hours)..."

    local cutoff_time=$(($(date +%s) - (ALERT_THRESHOLD_HOURS * 3600)))
    local recent_backup_found=0

    while IFS= read -r backup; do
        local backup_time
        backup_time=$(stat -f%m "$backup" 2>/dev/null || stat -c%Y "$backup" 2>/dev/null)

        if [[ $backup_time -gt $cutoff_time ]]; then
            recent_backup_found=1
            local backup_name=$(basename "$backup")
            local backup_age=$((( $(date +%s) - backup_time ) / 3600))
            log_info "Recent backup found: $backup_name (${backup_age}h ago)"
            break
        fi
    done < <(find "$BACKUP_DIR" -name "golive_${ENVIRONMENT}_*.sql.gz" -type f | grep -v "pre_restore" | sort -r)

    if [[ $recent_backup_found -eq 0 ]]; then
        log_alert "No backup found in the last $ALERT_THRESHOLD_HOURS hours for environment: $ENVIRONMENT"
        return 1
    fi

    log_info "Recent backup check: PASSED"
}

# Check backup integrity
check_backup_integrity() {
    log_info "Checking backup file integrity..."

    local latest_backup
    latest_backup=$(find "$BACKUP_DIR" -name "golive_${ENVIRONMENT}_*.sql.gz" -type f | grep -v "pre_restore" | sort -r | head -1)

    if [[ -z "$latest_backup" ]]; then
        log_alert "No backups found for environment: $ENVIRONMENT"
        return 1
    fi

    local backup_name=$(basename "$latest_backup")
    local file_size_kb
    file_size_kb=$(($(stat -f%z "$latest_backup" 2>/dev/null || stat -c%s "$latest_backup" 2>/dev/null) / 1024))

    # Check minimum size
    if [[ $file_size_kb -lt $MIN_BACKUP_SIZE_KB ]]; then
        log_alert "Backup file too small: $backup_name (${file_size_kb}KB) - possible corruption"
        return 1
    fi

    # Check gzip integrity
    if gzip -t "$latest_backup" 2>/dev/null; then
        log_info "Backup integrity check: PASSED ($backup_name, ${file_size_kb}KB)"
    else
        log_alert "Backup file corrupted: $backup_name"
        return 1
    fi
}

# Check backup count
check_backup_count() {
    log_info "Checking backup count..."

    local backup_count
    backup_count=$(find "$BACKUP_DIR" -name "golive_${ENVIRONMENT}_*.sql.gz" -type f | grep -v "pre_restore" | wc -l | xargs)

    log_info "Total backups for $ENVIRONMENT: $backup_count"

    if [[ $backup_count -eq 0 ]]; then
        log_alert "No backups exist for environment: $ENVIRONMENT"
        return 1
    fi

    if [[ $backup_count -lt 3 ]]; then
        log_warn "Low backup count ($backup_count) - consider keeping more backups"
    fi
}

# Check storage capacity
check_storage_capacity() {
    log_info "Checking storage capacity..."

    local backup_dir_mount
    backup_dir_mount=$(df -P "$BACKUP_DIR" | tail -1)

    local usage_percent
    usage_percent=$(echo "$backup_dir_mount" | awk '{print $5}' | sed 's/%//')

    local available
    available=$(echo "$backup_dir_mount" | awk '{print $4}')

    log_info "Storage usage: ${usage_percent}% (${available}KB available)"

    if [[ $usage_percent -gt $STORAGE_WARNING_PERCENT ]]; then
        log_alert "Storage usage is high: ${usage_percent}% (threshold: ${STORAGE_WARNING_PERCENT}%)"
        return 1
    fi

    log_info "Storage capacity check: PASSED"
}

# Check for failed backup logs
check_backup_logs() {
    log_info "Checking backup logs for errors..."

    local error_count=0

    # Check recent backup logs for errors
    if [[ -d "$LOG_DIR" ]]; then
        while IFS= read -r log_file; do
            if grep -qi "error\|failed" "$log_file" 2>/dev/null; then
                local log_name=$(basename "$log_file")
                log_warn "Errors found in log: $log_name"
                ((error_count++))
            fi
        done < <(find "$LOG_DIR" -name "backup_*.log" -type f -mtime -1)
    fi

    if [[ $error_count -gt 0 ]]; then
        log_alert "Found $error_count backup log(s) with errors in the last 24 hours"
        return 1
    fi

    log_info "Backup log check: PASSED (no errors found)"
}

# Check backup size trends
check_backup_size_trends() {
    log_info "Checking backup size trends..."

    local -a backup_sizes=()
    local backup_count=0

    # Get last 7 backup sizes
    while IFS= read -r backup && [[ $backup_count -lt 7 ]]; do
        local size_kb
        size_kb=$(($(stat -f%z "$backup" 2>/dev/null || stat -c%s "$backup" 2>/dev/null) / 1024))
        backup_sizes+=($size_kb)
        ((backup_count++))
    done < <(find "$BACKUP_DIR" -name "golive_${ENVIRONMENT}_*.sql.gz" -type f | grep -v "pre_restore" | sort -r)

    if [[ ${#backup_sizes[@]} -lt 2 ]]; then
        log_info "Not enough backups to analyze trends"
        return 0
    fi

    # Calculate average
    local sum=0
    for size in "${backup_sizes[@]}"; do
        sum=$((sum + size))
    done
    local avg=$((sum / ${#backup_sizes[@]}))

    # Check if latest backup is significantly smaller (50% deviation)
    local latest_size=${backup_sizes[0]}
    local deviation=$((100 * (avg - latest_size) / avg))

    if [[ $deviation -gt 50 ]]; then
        log_alert "Latest backup size (${latest_size}KB) is significantly smaller than average (${avg}KB) - ${deviation}% deviation"
        return 1
    fi

    log_info "Backup size trend check: PASSED (latest: ${latest_size}KB, avg: ${avg}KB)"
}

# Generate backup report
generate_report() {
    log_info "=========================================="
    log_info "Backup Monitoring Report"
    log_info "Environment: $ENVIRONMENT"
    log_info "=========================================="

    # List backups
    log_info "Recent backups:"
    local count=0
    while IFS= read -r backup && [[ $count -lt 5 ]]; do
        local backup_name=$(basename "$backup")
        local backup_size=$(du -h "$backup" | cut -f1)
        local backup_date=$(date -r "$backup" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -d "@$(stat -c%Y "$backup")" '+%Y-%m-%d %H:%M:%S')
        echo "  - $backup_name ($backup_size) - $backup_date" | tee -a "$MONITOR_LOG"
        ((count++))
    done < <(find "$BACKUP_DIR" -name "golive_${ENVIRONMENT}_*.sql.gz" -type f | grep -v "pre_restore" | sort -r)

    # Storage summary
    log_info "Storage summary:"
    du -sh "$BACKUP_DIR" 2>/dev/null | awk '{print "  Total backup size: " $1}' | tee -a "$MONITOR_LOG"

    log_info "=========================================="
}

# Send alert notification
send_alert() {
    if [[ $ALERT_TRIGGERED -eq 0 ]]; then
        log_info "All checks passed - no alerts"
        return 0
    fi

    log_error "ALERTS TRIGGERED: ${#ALERT_MESSAGES[@]} issue(s) found"

    local alert_text="Database Backup Alert - $ENVIRONMENT\n\nIssues detected:\n"
    for message in "${ALERT_MESSAGES[@]}"; do
        alert_text+="- $message\n"
    done

    # Slack notification
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        log_info "Sending Slack notification..."
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"danger\",
                    \"title\": \"⚠️ Database Backup Alert - $ENVIRONMENT\",
                    \"text\": \"$alert_text\",
                    \"ts\": $(date +%s)
                }]
            }" 2>> "$MONITOR_LOG" || log_warn "Failed to send Slack notification"
    fi

    # Email notification (if configured)
    if [[ -n "${ALERT_EMAIL:-}" ]]; then
        log_info "Sending email alert to: $ALERT_EMAIL"
        echo -e "$alert_text" | mail -s "Database Backup Alert - $ENVIRONMENT" "$ALERT_EMAIL" 2>> "$MONITOR_LOG" || log_warn "Failed to send email"
    fi

    # PagerDuty notification (if configured)
    if [[ -n "${PAGERDUTY_INTEGRATION_KEY:-}" ]]; then
        log_info "Sending PagerDuty alert..."
        curl -X POST "https://events.pagerduty.com/v2/enqueue" \
            -H 'Content-Type: application/json' \
            -d "{
                \"routing_key\": \"$PAGERDUTY_INTEGRATION_KEY\",
                \"event_action\": \"trigger\",
                \"payload\": {
                    \"summary\": \"Database Backup Alert - $ENVIRONMENT\",
                    \"severity\": \"error\",
                    \"source\": \"golive-backup-monitor\",
                    \"custom_details\": {
                        \"environment\": \"$ENVIRONMENT\",
                        \"issues\": \"${#ALERT_MESSAGES[@]}\"
                    }
                }
            }" 2>> "$MONITOR_LOG" || log_warn "Failed to send PagerDuty alert"
    fi
}

# Main execution
main() {
    log_info "=========================================="
    log_info "GoLive Backup Monitoring"
    log_info "Environment: $ENVIRONMENT"
    log_info "=========================================="

    # Setup
    create_directories

    # Run checks
    check_backup_directory || true
    check_recent_backup || true
    check_backup_integrity || true
    check_backup_count || true
    check_storage_capacity || true
    check_backup_logs || true
    check_backup_size_trends || true

    # Generate report
    generate_report

    # Send alerts if needed
    send_alert

    # Exit status
    log_info "Monitoring complete"
    log_info "Log file: $MONITOR_LOG"

    if [[ $ALERT_TRIGGERED -eq 1 ]]; then
        exit 1
    fi
}

# Run main
main "$@"
