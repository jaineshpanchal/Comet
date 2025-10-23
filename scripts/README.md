# GoLive Scripts

Quick reference for all platform scripts.

## Database Backup Scripts

### backup-database.sh
Create automated PostgreSQL backups with compression and verification.

```bash
./scripts/backup-database.sh [environment]

# Examples
./scripts/backup-database.sh production
./scripts/backup-database.sh staging
./scripts/backup-database.sh development
```

**Features**:
- Timestamped backups with gzip compression
- 30-day retention with automatic cleanup
- Integrity verification
- Optional S3 upload
- Slack notifications

**Output**: `backups/database/golive_{env}_{timestamp}.sql.gz`

---

### restore-database.sh
Restore database from backup with safety checks.

```bash
./scripts/restore-database.sh [backup_file] [environment]

# Interactive mode (recommended)
./scripts/restore-database.sh

# Direct restore
./scripts/restore-database.sh golive_production_20250123_143000.sql.gz production
```

**Features**:
- Interactive backup selection
- Pre-restore safety backup
- Connection termination
- Restore verification
- Automatic migrations

**Safety**: Creates pre-restore backup for rollback

---

### setup-backup-schedule.sh
Configure automated backup scheduling.

```bash
sudo ./scripts/setup-backup-schedule.sh [method] [environment]

# Cron setup
sudo ./scripts/setup-backup-schedule.sh cron production

# Systemd setup
sudo ./scripts/setup-backup-schedule.sh systemd production

# Custom schedule
BACKUP_SCHEDULE="0 */6 * * *" sudo ./scripts/setup-backup-schedule.sh cron production
```

**Methods**:
- **cron**: Traditional Unix scheduling
- **systemd**: Modern Linux timers

**Default**: Daily at 2:00 AM

---

### monitor-backups.sh
Monitor backup health and send alerts.

```bash
./scripts/monitor-backups.sh [environment]

# Check production backups
./scripts/monitor-backups.sh production

# View logs
cat logs/monitor_*.log
```

**Checks**:
- Recent backup exists (< 24h)
- Backup integrity (gzip test)
- Storage capacity (< 80%)
- Log errors
- Size trends

**Alerts**: Slack, Email, PagerDuty

---

## Service Management Scripts

### start-all.sh
Start all GoLive services.

```bash
./scripts/start-all.sh
```

Starts: Backend API Gateway + Frontend

---

### stop-all.sh
Stop all GoLive services.

```bash
./scripts/stop-all.sh
```

Stops all running services gracefully.

---

### restart-all.sh
Restart all GoLive services.

```bash
./scripts/restart-all.sh
```

Stops and restarts all services.

---

### status.sh
Check status of all services.

```bash
./scripts/status.sh
```

Shows running status and port information.

---

## Quick Commands

### Backup Operations

```bash
# Create backup
./scripts/backup-database.sh production

# List backups
ls -lh backups/database/

# Test backup integrity
gzip -t backups/database/golive_production_*.sql.gz

# Restore latest
./scripts/restore-database.sh

# Monitor health
./scripts/monitor-backups.sh production
```

### Service Operations

```bash
# Start services
./scripts/start-all.sh

# Check status
./scripts/status.sh

# Restart all
./scripts/restart-all.sh

# Stop all
./scripts/stop-all.sh
```

### Scheduling

```bash
# Setup automated backups
sudo ./scripts/setup-backup-schedule.sh cron production

# View cron jobs
crontab -l

# View systemd timers
systemctl list-timers golive-backup.timer
```

---

## Configuration

### Environment Variables

Required in `backend/api-gateway/.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Optional - Cloud Storage
AWS_S3_BACKUP_BUCKET=golive-backups-prod

# Optional - Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_EMAIL=ops@example.com
PAGERDUTY_INTEGRATION_KEY=your_key

# Optional - Custom Paths
BACKUP_DIR=/path/to/backups
LOG_DIR=/path/to/logs
RETENTION_DAYS=30
```

---

## Documentation

- **[DATABASE_BACKUP_GUIDE.md](../DATABASE_BACKUP_GUIDE.md)** - Complete backup system guide
- **[BACKUP_SYSTEM_COMPLETE.md](../BACKUP_SYSTEM_COMPLETE.md)** - Implementation summary
- **[CI_CD_SETUP_COMPLETE.md](../CI_CD_SETUP_COMPLETE.md)** - CI/CD pipeline guide

---

## Support

**Scripts Location**: `/scripts/`
**Logs Location**: `/logs/`
**Backups Location**: `/backups/database/`

For detailed help, see the documentation links above.
