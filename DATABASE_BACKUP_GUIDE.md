# Database Backup & Restore Guide

Complete guide for automated database backups in the GoLive DevOps Platform.

## Overview

The GoLive platform includes a comprehensive database backup system with:
- **Automated daily backups** via cron or systemd timers
- **30-day retention policy** with automatic cleanup
- **Backup verification** and integrity checks
- **Point-in-time restore** capabilities
- **Multi-environment support** (development, staging, production)
- **Cloud storage integration** (optional S3 upload)
- **Monitoring and alerting** for backup health
- **Slack/PagerDuty notifications** for failures

## Quick Start

### 1. Initial Setup

```bash
# Make scripts executable (if not already)
chmod +x scripts/*.sh

# Set up automated backups (requires sudo)
sudo ./scripts/setup-backup-schedule.sh cron production

# Test backup manually
./scripts/backup-database.sh production
```

### 2. Restore a Backup

```bash
# Interactive mode (shows list of available backups)
./scripts/restore-database.sh

# Direct restore
./scripts/restore-database.sh golive_production_20250123_143000.sql.gz production
```

### 3. Monitor Backup Health

```bash
# Run monitoring check
./scripts/monitor-backups.sh production

# View monitoring logs
tail -f logs/monitor_*.log
```

---

## Backup Script

### Location
`scripts/backup-database.sh`

### Features
- **Timestamped backups**: `golive_{environment}_{timestamp}.sql.gz`
- **Compression**: gzip compression to save disk space
- **Integrity verification**: Validates backup after creation
- **Retention management**: Automatically removes backups older than 30 days
- **S3 upload**: Optional upload to AWS S3
- **Error handling**: Comprehensive error checking and logging
- **Notifications**: Slack webhook integration

### Usage

```bash
# Basic usage
./scripts/backup-database.sh [environment]

# Examples
./scripts/backup-database.sh development
./scripts/backup-database.sh staging
./scripts/backup-database.sh production
```

### Environment Variables

The script reads from `backend/api-gateway/.env`:

```bash
# Required
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Optional - S3 Upload
AWS_S3_BACKUP_BUCKET=my-backup-bucket

# Optional - Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Optional - Custom Paths
BACKUP_DIR=/path/to/backups
LOG_DIR=/path/to/logs
RETENTION_DAYS=30
```

### Output

**Backup File**: `backups/database/golive_production_20250123_143000.sql.gz`

**Log File**: `logs/backup_20250123_143000.log`

**Example Log**:
```
[INFO] 2025-01-23 14:30:00 - Backup directory: /path/to/backups/database
[INFO] 2025-01-23 14:30:01 - Database: golive_prod
[INFO] 2025-01-23 14:30:01 - Database size: 2.5 GB
[INFO] 2025-01-23 14:30:05 - Backup created successfully (450 MB)
[INFO] 2025-01-23 14:30:06 - Backup integrity verified
[INFO] 2025-01-23 14:30:07 - Deleted 2 old backup(s)
[INFO] 2025-01-23 14:30:10 - Backup uploaded to S3 successfully
```

---

## Restore Script

### Location
`scripts/restore-database.sh`

### Features
- **Interactive mode**: Lists available backups with details
- **Pre-restore backup**: Automatically backs up current DB before restore
- **Connection validation**: Checks database connectivity
- **Active connection termination**: Safely closes DB connections
- **Restore verification**: Validates restored data
- **Prisma migrations**: Runs migrations after restore
- **Rollback support**: Pre-restore backup available for rollback

### Usage

```bash
# Interactive mode
./scripts/restore-database.sh

# Direct restore
./scripts/restore-database.sh [backup_file] [environment]

# Examples
./scripts/restore-database.sh golive_production_20250123_143000.sql.gz production
./scripts/restore-database.sh golive_staging_20250123_120000.sql.gz staging
```

### Interactive Example

```
[INFO] Available backups for production:

  [1] golive_production_20250123_143000.sql.gz
      Size: 450M | Date: 2025-01-23 14:30:00

  [2] golive_production_20250122_020000.sql.gz
      Size: 445M | Date: 2025-01-22 02:00:00

  [3] golive_production_20250121_020000.sql.gz
      Size: 442M | Date: 2025-01-21 02:00:00

Select backup number to restore (1-3) or 'q' to quit: 1

⚠️  WARNING: This will REPLACE the current database!
   Database: golive_prod
   Environment: production
   Backup: golive_production_20250123_143000.sql.gz

A pre-restore backup will be created automatically

Type 'YES' to confirm restore: YES

[STEP] Creating pre-restore backup...
[INFO] Pre-restore backup created: golive_production_pre_restore_20250123_150000.sql.gz
[STEP] Restoring database from backup...
[INFO] Database restored successfully
[INFO] Database has 45 tables
```

### Rollback After Failed Restore

If a restore fails, you can rollback using the pre-restore backup:

```bash
./scripts/restore-database.sh golive_production_pre_restore_20250123_150000.sql.gz production
```

---

## Automated Backup Schedule

### Location
`scripts/setup-backup-schedule.sh`

### Features
- **Cron or systemd** scheduling options
- **Daily at 2 AM** default schedule
- **Log rotation** configuration
- **Test backup** option during setup
- **Multi-environment** support

### Setup with Cron

```bash
# Setup (requires sudo)
sudo ./scripts/setup-backup-schedule.sh cron production

# View scheduled jobs
crontab -l

# View logs
tail -f /var/log/golive-backup.log

# Manual trigger
./scripts/backup-database.sh production
```

**Cron Schedule**: `0 2 * * *` (2:00 AM daily)

### Setup with Systemd

```bash
# Setup (requires sudo)
sudo ./scripts/setup-backup-schedule.sh systemd production

# View timer status
systemctl status golive-backup.timer

# View next scheduled run
systemctl list-timers golive-backup.timer

# View logs
journalctl -u golive-backup.service -f

# Manual trigger
systemctl start golive-backup.service

# Stop/disable
systemctl stop golive-backup.timer
systemctl disable golive-backup.timer
```

### Custom Schedule

Edit the schedule by modifying `BACKUP_SCHEDULE` variable:

```bash
# Daily at 3 AM
BACKUP_SCHEDULE="0 3 * * *" sudo ./scripts/setup-backup-schedule.sh cron production

# Every 6 hours
BACKUP_SCHEDULE="0 */6 * * *" sudo ./scripts/setup-backup-schedule.sh cron production

# Twice daily (2 AM and 2 PM)
BACKUP_SCHEDULE="0 2,14 * * *" sudo ./scripts/setup-backup-schedule.sh cron production
```

---

## Backup Monitoring

### Location
`scripts/monitor-backups.sh`

### Features
- **Recent backup check**: Ensures backup within last 24 hours
- **Integrity verification**: Tests gzip compression
- **Storage capacity**: Alerts when disk usage is high
- **Log analysis**: Scans for errors in backup logs
- **Size trend analysis**: Detects anomalous backup sizes
- **Multi-channel alerts**: Slack, Email, PagerDuty

### Usage

```bash
# Run monitoring check
./scripts/monitor-backups.sh production

# View monitoring log
cat logs/monitor_*.log
```

### Health Checks

1. **Recent Backup Check**
   - Verifies backup exists within threshold (default: 24 hours)
   - Alerts if no recent backup found

2. **Integrity Check**
   - Tests gzip compression integrity
   - Verifies minimum file size
   - Detects corrupted backups

3. **Storage Capacity Check**
   - Monitors disk usage percentage
   - Alerts at 80% threshold by default

4. **Log Analysis**
   - Scans recent backup logs for errors
   - Counts failure occurrences

5. **Size Trend Analysis**
   - Compares latest backup to historical average
   - Alerts on 50%+ size deviation

### Alert Configuration

Set environment variables in `.env`:

```bash
# Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX

# Email notifications
ALERT_EMAIL=ops@example.com

# PagerDuty integration
PAGERDUTY_INTEGRATION_KEY=your_integration_key

# Custom thresholds
ALERT_THRESHOLD_HOURS=24
STORAGE_WARNING_PERCENT=80
MIN_BACKUP_SIZE_KB=100
```

### Automated Monitoring

Schedule monitoring checks every 6 hours:

**Cron**:
```bash
0 */6 * * * /path/to/scripts/monitor-backups.sh production >> /var/log/golive-monitor.log 2>&1
```

**Systemd** (create similar timer as backup):
```bash
# Create monitor.service and monitor.timer
sudo systemctl enable golive-monitor.timer
sudo systemctl start golive-monitor.timer
```

---

## Backup Storage

### Local Storage

**Default Location**: `backups/database/`

**Structure**:
```
backups/
└── database/
    ├── golive_production_20250123_143000.sql.gz
    ├── golive_production_20250122_020000.sql.gz
    ├── golive_production_20250121_020000.sql.gz
    ├── golive_staging_20250123_020000.sql.gz
    └── golive_development_20250123_100000.sql.gz
```

**Retention**: 30 days (automatically cleaned by backup script)

**Disk Space Calculation**:
- Typical backup size: 10-20% of database size (with compression)
- 30 days × 450 MB per backup = ~13.5 GB
- Monitor with: `du -sh backups/database/`

### Cloud Storage (S3)

Enable S3 uploads by setting:

```bash
# In .env
AWS_S3_BACKUP_BUCKET=golive-backups-prod

# Ensure AWS CLI is configured
aws configure
```

The backup script will automatically upload to S3 after creating local backup.

**S3 Structure**:
```
s3://golive-backups-prod/
├── golive_production_20250123_143000.sql.gz
├── golive_production_20250122_020000.sql.gz
└── golive_production_20250121_020000.sql.gz
```

**S3 Lifecycle Policy** (recommended):
```json
{
  "Rules": [
    {
      "Id": "Move to Glacier after 30 days",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

---

## Common Operations

### Manual Backup

```bash
# Create backup now
./scripts/backup-database.sh production

# Verify backup
ls -lh backups/database/ | tail -5
```

### List Available Backups

```bash
# All backups
ls -lh backups/database/

# Production only
ls -lh backups/database/ | grep production

# Last 7 days
find backups/database/ -name "*.sql.gz" -mtime -7 -ls
```

### Test Backup Integrity

```bash
# Test gzip compression
gzip -t backups/database/golive_production_20250123_143000.sql.gz

# View backup contents (first 100 lines)
gunzip -c backups/database/golive_production_20250123_143000.sql.gz | head -100
```

### Restore to Different Database

```bash
# Export backup to different database
gunzip -c backups/database/golive_production_20250123_143000.sql.gz | \
  psql -h localhost -U user -d test_database
```

### Copy Backup to Remote Server

```bash
# Using scp
scp backups/database/golive_production_20250123_143000.sql.gz user@remote:/path/

# Using rsync
rsync -avz backups/database/ user@remote:/backups/
```

### Download from S3

```bash
# List S3 backups
aws s3 ls s3://golive-backups-prod/

# Download specific backup
aws s3 cp s3://golive-backups-prod/golive_production_20250123_143000.sql.gz ./
```

---

## Disaster Recovery

### Full Recovery Procedure

**Scenario**: Complete database loss

1. **Stop application services**:
   ```bash
   systemctl stop golive-api-gateway
   systemctl stop golive-frontend
   ```

2. **Recreate database** (if needed):
   ```bash
   psql -U postgres -c "CREATE DATABASE golive_prod;"
   ```

3. **Restore from backup**:
   ```bash
   ./scripts/restore-database.sh
   # Select most recent backup
   ```

4. **Verify restore**:
   ```bash
   psql -h localhost -U user -d golive_prod -c "SELECT COUNT(*) FROM users;"
   ```

5. **Run migrations** (if needed):
   ```bash
   cd backend/api-gateway
   npx prisma migrate deploy
   ```

6. **Restart services**:
   ```bash
   systemctl start golive-api-gateway
   systemctl start golive-frontend
   ```

7. **Verify application**:
   ```bash
   curl http://localhost:8000/api/health
   ```

### Point-in-Time Recovery

**Scenario**: Need to restore to specific time

1. **Find backup closest to desired time**:
   ```bash
   ls -lt backups/database/ | grep production
   ```

2. **Restore that backup**:
   ```bash
   ./scripts/restore-database.sh golive_production_20250123_143000.sql.gz production
   ```

### Cross-Environment Restore

**Scenario**: Copy production data to staging

1. **Backup production**:
   ```bash
   ./scripts/backup-database.sh production
   ```

2. **Copy backup file**:
   ```bash
   cp backups/database/golive_production_20250123_143000.sql.gz \
      backups/database/golive_staging_20250123_143000.sql.gz
   ```

3. **Restore to staging**:
   ```bash
   ./scripts/restore-database.sh golive_staging_20250123_143000.sql.gz staging
   ```

4. **Sanitize sensitive data** (recommended):
   ```sql
   -- Anonymize user emails
   UPDATE users SET email = CONCAT('user_', id, '@example.com');

   -- Reset passwords
   UPDATE users SET password = '$2b$12$...hashed...';
   ```

---

## Troubleshooting

### Backup Fails with "Cannot connect to database"

**Check**:
```bash
# Test database connection
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -c "SELECT 1"

# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:pass@host:port/dbname
```

**Fix**: Verify `.env` file has correct `DATABASE_URL`

### Backup File Too Small

**Check**:
```bash
# View backup size
ls -lh backups/database/golive_production_*.sql.gz | tail -1

# Test integrity
gzip -t backups/database/golive_production_20250123_143000.sql.gz
```

**Possible Causes**:
- Database was empty or mostly empty
- Backup interrupted mid-process
- Insufficient disk space
- Permissions issue

### Restore Fails with "relation already exists"

**Issue**: Database already has tables

**Fix**: Use `--clean` flag (already in restore script) or manually drop database:
```bash
psql -U postgres -c "DROP DATABASE golive_prod;"
psql -U postgres -c "CREATE DATABASE golive_prod;"
./scripts/restore-database.sh
```

### No Space Left on Device

**Check**:
```bash
df -h backups/
du -sh backups/database/
```

**Fix**:
1. Clean old backups manually:
   ```bash
   find backups/database/ -name "*.sql.gz" -mtime +30 -delete
   ```

2. Move backups to larger disk:
   ```bash
   mv backups/database /mnt/larger-disk/backups/
   ln -s /mnt/larger-disk/backups/database backups/database
   ```

### Cron Job Not Running

**Check**:
```bash
# View crontab
crontab -l

# Check cron logs
grep CRON /var/log/syslog

# Check backup logs
tail -f /var/log/golive-backup.log
```

**Fix**:
1. Verify script is executable: `chmod +x scripts/backup-database.sh`
2. Check cron service: `systemctl status cron`
3. Test script manually: `./scripts/backup-database.sh production`

### S3 Upload Fails

**Check**:
```bash
# Test AWS CLI
aws s3 ls s3://$AWS_S3_BACKUP_BUCKET/

# Check credentials
aws configure list
```

**Fix**:
1. Configure AWS CLI: `aws configure`
2. Verify bucket exists: `aws s3 mb s3://golive-backups-prod`
3. Check IAM permissions (needs `s3:PutObject`)

---

## Best Practices

### Security

1. **Encrypt backups at rest**:
   ```bash
   # Use AWS S3 server-side encryption
   aws s3 cp backup.sql.gz s3://bucket/ --sse AES256
   ```

2. **Restrict file permissions**:
   ```bash
   chmod 600 backups/database/*.sql.gz
   ```

3. **Use IAM roles** instead of access keys for S3

4. **Rotate database passwords** and update `.env`

5. **Audit backup access**:
   ```bash
   # Check who accessed backups
   ls -la backups/database/
   ```

### Performance

1. **Run backups during low traffic** (default: 2 AM)

2. **Use compression** (already enabled with gzip)

3. **Incremental backups** for large databases:
   ```bash
   # PostgreSQL WAL archiving
   # Configure in postgresql.conf
   ```

4. **Parallel restore** for faster recovery:
   ```bash
   pg_restore -j 4 backup.dump  # 4 parallel jobs
   ```

### Monitoring

1. **Set up monitoring alerts** (see Alert Configuration)

2. **Test restores regularly** (monthly recommended):
   ```bash
   # Restore to test database
   gunzip -c backup.sql.gz | psql -d test_db
   ```

3. **Document recovery time** (RTO) and recovery point (RPO)

4. **Track backup size trends** over time

### Retention

1. **Keep multiple restore points**:
   - Daily: Last 30 days
   - Weekly: Last 12 weeks
   - Monthly: Last 12 months

2. **Different retention for environments**:
   - Production: 30 days local + 1 year S3 Glacier
   - Staging: 7 days
   - Development: 3 days

3. **Automate cleanup**:
   ```bash
   # Already in backup script
   find backups/ -mtime +30 -delete
   ```

---

## Integration with CI/CD

### GitHub Actions

Add backup verification to your CI/CD pipeline:

```yaml
# .github/workflows/backup-test.yml
name: Test Database Restore

on:
  schedule:
    - cron: '0 12 * * 0'  # Weekly on Sunday

jobs:
  test-restore:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Download latest backup from S3
        run: |
          aws s3 cp s3://golive-backups-prod/ . --recursive --exclude "*" --include "golive_production_*.sql.gz" | tail -1

      - name: Restore backup
        run: |
          gunzip -c golive_production_*.sql.gz | psql -h localhost -U postgres -d test

      - name: Verify restore
        run: |
          psql -h localhost -U postgres -d test -c "SELECT COUNT(*) FROM users;"
```

---

## FAQ

### How long do backups take?

**Typical Times**:
- Small DB (< 1 GB): 30-60 seconds
- Medium DB (1-10 GB): 2-5 minutes
- Large DB (10-100 GB): 10-30 minutes

**Factors**:
- Database size
- Disk I/O speed
- Compression level
- Network speed (for S3 upload)

### Can I run backups more frequently?

Yes! Modify the schedule:

```bash
# Every 6 hours
BACKUP_SCHEDULE="0 */6 * * *" sudo ./scripts/setup-backup-schedule.sh cron production
```

**Note**: More frequent backups = more disk space needed

### What if I accidentally delete a table?

Restore from the most recent backup:

```bash
# 1. Find last good backup (before deletion)
ls -lt backups/database/ | grep production | head -5

# 2. Restore
./scripts/restore-database.sh golive_production_20250123_140000.sql.gz production
```

### Can I automate backups before deployments?

Yes! Add to your deployment script:

```bash
#!/bin/bash
# deploy.sh

# Pre-deployment backup
./scripts/backup-database.sh production

# Deploy
docker-compose up -d

# Run migrations
cd backend/api-gateway && npx prisma migrate deploy
```

### How do I test my backup restore procedure?

```bash
# 1. Create test database
psql -U postgres -c "CREATE DATABASE golive_test;"

# 2. Restore to test DB
gunzip -c backups/database/golive_production_20250123_143000.sql.gz | \
  psql -U postgres -d golive_test

# 3. Verify data
psql -U postgres -d golive_test -c "SELECT COUNT(*) FROM users;"

# 4. Cleanup
psql -U postgres -c "DROP DATABASE golive_test;"
```

---

## Support

**Scripts Location**: `/scripts/`
- `backup-database.sh` - Create backups
- `restore-database.sh` - Restore backups
- `setup-backup-schedule.sh` - Configure automation
- `monitor-backups.sh` - Health monitoring

**Logs Location**: `/logs/`
- `backup_*.log` - Backup execution logs
- `restore_*.log` - Restore execution logs
- `monitor_*.log` - Monitoring check logs

**Need Help?**
- Check logs in `/logs/` directory
- Review troubleshooting section above
- Test scripts manually to identify issues

---

**Status**: ✅ Automated Database Backups Configured
**Implementation Date**: October 23, 2025
**Next Review**: Monthly restore test recommended
