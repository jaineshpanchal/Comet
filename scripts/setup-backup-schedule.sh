#!/bin/bash

###############################################################################
# Backup Schedule Setup Script for GoLive Platform
###############################################################################
#
# This script sets up automated database backups using either:
# - Cron jobs (traditional Unix scheduling)
# - Systemd timers (modern Linux scheduling)
#
# Usage:
#   sudo ./setup-backup-schedule.sh [method] [environment]
#
# Examples:
#   sudo ./setup-backup-schedule.sh cron production
#   sudo ./setup-backup-schedule.sh systemd production
#
###############################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
METHOD="${1:-cron}"
ENVIRONMENT="${2:-production}"
BACKUP_SCHEDULE="${BACKUP_SCHEDULE:-0 2 * * *}"  # 2 AM daily by default

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Setup cron job
setup_cron() {
    log_step "Setting up cron job for automated backups..."

    local cron_job="$BACKUP_SCHEDULE $SCRIPT_DIR/backup-database.sh $ENVIRONMENT >> /var/log/golive-backup.log 2>&1"
    local cron_user="${SUDO_USER:-$USER}"

    # Check if cron job already exists
    if crontab -u "$cron_user" -l 2>/dev/null | grep -q "backup-database.sh"; then
        log_warn "Cron job already exists, removing old entry..."
        crontab -u "$cron_user" -l 2>/dev/null | grep -v "backup-database.sh" | crontab -u "$cron_user" -
    fi

    # Add new cron job
    (crontab -u "$cron_user" -l 2>/dev/null; echo "$cron_job") | crontab -u "$cron_user" -

    log_info "Cron job added successfully"
    log_info "Schedule: $BACKUP_SCHEDULE"
    log_info "User: $cron_user"
    log_info "Log file: /var/log/golive-backup.log"

    # Create log file with proper permissions
    touch /var/log/golive-backup.log
    chown "$cron_user:$cron_user" /var/log/golive-backup.log

    # Show current crontab
    echo ""
    log_info "Current crontab for $cron_user:"
    crontab -u "$cron_user" -l | grep "backup-database.sh"
}

# Setup systemd timer
setup_systemd() {
    log_step "Setting up systemd timer for automated backups..."

    # Create systemd service file
    local service_file="/etc/systemd/system/golive-backup.service"
    cat > "$service_file" << EOF
[Unit]
Description=GoLive Database Backup Service
After=network.target postgresql.service

[Service]
Type=oneshot
User=${SUDO_USER:-$USER}
WorkingDirectory=$SCRIPT_DIR
ExecStart=$SCRIPT_DIR/backup-database.sh $ENVIRONMENT
StandardOutput=journal
StandardError=journal
SyslogIdentifier=golive-backup

[Install]
WantedBy=multi-user.target
EOF

    log_info "Created service file: $service_file"

    # Create systemd timer file
    local timer_file="/etc/systemd/system/golive-backup.timer"
    cat > "$timer_file" << EOF
[Unit]
Description=GoLive Database Backup Timer
Requires=golive-backup.service

[Timer]
# Run daily at 2 AM
OnCalendar=daily
OnCalendar=02:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
EOF

    log_info "Created timer file: $timer_file"

    # Reload systemd
    systemctl daemon-reload

    # Enable and start timer
    systemctl enable golive-backup.timer
    systemctl start golive-backup.timer

    log_info "Systemd timer enabled and started"

    # Show timer status
    echo ""
    log_info "Timer status:"
    systemctl status golive-backup.timer --no-pager || true

    echo ""
    log_info "Next scheduled run:"
    systemctl list-timers golive-backup.timer --no-pager || true
}

# Verify backup script exists
verify_backup_script() {
    local backup_script="$SCRIPT_DIR/backup-database.sh"

    if [[ ! -f "$backup_script" ]]; then
        log_error "Backup script not found: $backup_script"
        exit 1
    fi

    if [[ ! -x "$backup_script" ]]; then
        log_warn "Backup script is not executable, fixing..."
        chmod +x "$backup_script"
    fi

    log_info "Backup script verified: $backup_script"
}

# Create log rotation
setup_log_rotation() {
    log_step "Setting up log rotation..."

    local logrotate_file="/etc/logrotate.d/golive-backup"
    cat > "$logrotate_file" << EOF
/var/log/golive-backup.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 ${SUDO_USER:-$USER} ${SUDO_USER:-$USER}
    sharedscripts
    postrotate
        # Optional: Send notification after rotation
    endscript
}
EOF

    log_info "Log rotation configured: $logrotate_file"
}

# Test backup
test_backup() {
    log_step "Running test backup..."

    local backup_script="$SCRIPT_DIR/backup-database.sh"

    if sudo -u "${SUDO_USER:-$USER}" "$backup_script" "$ENVIRONMENT"; then
        log_info "Test backup completed successfully"
    else
        log_error "Test backup failed"
        exit 1
    fi
}

# Show instructions
show_instructions() {
    echo ""
    log_info "=========================================="
    log_info "Backup Schedule Setup Complete!"
    log_info "=========================================="
    echo ""

    if [[ "$METHOD" == "cron" ]]; then
        log_info "Cron Job Commands:"
        echo "  # View crontab"
        echo "  crontab -l"
        echo ""
        echo "  # Edit crontab"
        echo "  crontab -e"
        echo ""
        echo "  # View logs"
        echo "  tail -f /var/log/golive-backup.log"
    else
        log_info "Systemd Timer Commands:"
        echo "  # View timer status"
        echo "  systemctl status golive-backup.timer"
        echo ""
        echo "  # View next scheduled run"
        echo "  systemctl list-timers golive-backup.timer"
        echo ""
        echo "  # View logs"
        echo "  journalctl -u golive-backup.service -f"
        echo ""
        echo "  # Manually trigger backup"
        echo "  systemctl start golive-backup.service"
        echo ""
        echo "  # Stop/disable timer"
        echo "  systemctl stop golive-backup.timer"
        echo "  systemctl disable golive-backup.timer"
    fi

    echo ""
    log_info "Backup Configuration:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Schedule: Daily at 2:00 AM"
    echo "  Retention: 30 days"
    echo "  Backup script: $SCRIPT_DIR/backup-database.sh"
    echo ""
}

# Main execution
main() {
    log_info "=========================================="
    log_info "GoLive Backup Schedule Setup"
    log_info "Method: $METHOD"
    log_info "Environment: $ENVIRONMENT"
    log_info "=========================================="
    echo ""

    # Checks
    check_root
    verify_backup_script

    # Setup based on method
    case "$METHOD" in
        cron)
            setup_cron
            ;;
        systemd)
            setup_systemd
            ;;
        *)
            log_error "Invalid method: $METHOD (use 'cron' or 'systemd')"
            exit 1
            ;;
    esac

    # Additional setup
    setup_log_rotation

    # Test backup
    echo ""
    read -p "Would you like to run a test backup now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_backup
    fi

    # Show instructions
    show_instructions
}

# Run main
main "$@"
