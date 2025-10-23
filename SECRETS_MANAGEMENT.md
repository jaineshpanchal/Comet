# Secrets Management - Complete Guide

## Overview

Secure secrets management for the GoLive DevOps Platform with support for AWS Secrets Manager, environment variables, and automatic secret rotation.

## Features

✅ **Multiple Backends**: AWS Secrets Manager (production), Environment Variables (development)
✅ **Automatic Caching**: Reduces API calls with configurable TTL
✅ **Secret Rotation**: Automated rotation with zero downtime
✅ **Type-Safe Access**: Strongly typed secret accessors
✅ **Encryption Utilities**: Built-in encrypt/decrypt functions
✅ **Audit Logging**: Track all secret rotations

## Quick Start

### Development (Environment Variables)

```bash
# Configure .env
SECRETS_PROVIDER="env"
JWT_SECRET="your-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret"
ENCRYPTION_KEY="your-encryption-key"
```

### Production (AWS Secrets Manager)

```bash
# 1. Create secrets in AWS
aws secretsmanager create-secret \
  --name golive/production/JWT_SECRET \
  --secret-string "$(openssl rand -hex 32)"

# 2. Configure .env
SECRETS_PROVIDER="aws"
AWS_REGION="us-east-1"

# 3. Application automatically loads from AWS
```

## Usage

### Load Secrets on Startup

```typescript
import { AppSecrets } from './config/secrets';

// Load all secrets
const secrets = AppSecrets.getInstance();
await secrets.loadSecrets();

// Access secrets
const jwtSecret = secrets.jwtSecret;
const dbUrl = secrets.databaseUrl;
```

### Get Individual Secrets

```typescript
import { getSecret } from './config/secrets';

const apiKey = await getSecret('THIRD_PARTY_API_KEY');
```

### Encrypt/Decrypt Data

```typescript
import { encrypt, decrypt } from './config/secrets';

// Encrypt
const encrypted = encrypt('sensitive-data');
// Returns: "iv:encrypted-text"

// Decrypt
const decrypted = decrypt(encrypted);
// Returns: "sensitive-data"
```

## Secret Rotation

### Rotate Individual Secret

```bash
# Rotate JWT secret
./scripts/rotate-secrets.sh JWT_SECRET production

# Rotate CSRF secret
./scripts/rotate-secrets.sh CSRF_SECRET staging
```

### Rotate All Secrets

```bash
./scripts/rotate-secrets.sh all production
```

### Available Secrets for Rotation

- `JWT_SECRET` - JWT signing key
- `JWT_REFRESH_SECRET` - Refresh token key
- `CSRF_SECRET` - CSRF protection key
- `ENCRYPTION_KEY` - Data encryption key (⚠️ invalidates encrypted data)

## AWS Secrets Manager Setup

### 1. Create IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
        "secretsmanager:UpdateSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:golive/*"
    }
  ]
}
```

### 2. Create Secrets

```bash
# JWT Secret
aws secretsmanager create-secret \
  --name golive/production/JWT_SECRET \
  --description "JWT signing secret" \
  --secret-string "$(openssl rand -hex 32)"

# JWT Refresh Secret
aws secretsmanager create-secret \
  --name golive/production/JWT_REFRESH_SECRET \
  --secret-string "$(openssl rand -hex 32)"

# Database URL
aws secretsmanager create-secret \
  --name golive/production/DATABASE_URL \
  --secret-string "postgresql://user:pass@host:5432/db"

# CSRF Secret
aws secretsmanager create-secret \
  --name golive/production/CSRF_SECRET \
  --secret-string "$(openssl rand -hex 64)"
```

### 3. Configure Application

```bash
# .env
SECRETS_PROVIDER="aws"
AWS_REGION="us-east-1"
# AWS credentials via IAM role (recommended) or environment
```

## Configuration

### Environment Variables

```bash
# Secrets provider
SECRETS_PROVIDER="env"  # or "aws"

# AWS configuration (if using AWS)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"

# Caching
SECRETS_CACHE_ENABLED=true
SECRETS_CACHE_TTL=300000  # 5 minutes
```

## Production Checklist

- [ ] AWS Secrets Manager configured
- [ ] IAM role/policy attached to EC2/ECS/Lambda
- [ ] Secrets created in AWS for all environments
- [ ] `SECRETS_PROVIDER=aws` in production .env
- [ ] Secret rotation schedule configured
- [ ] Audit logging enabled
- [ ] Team trained on secret rotation procedures
- [ ] Backup .env file excluded from version control

## Best Practices

### 1. Never Commit Secrets

```bash
# .gitignore
.env
.env.local
.env.*.local
*.backup.*
```

### 2. Use IAM Roles in Production

```bash
# Don't use access keys in production
# Use EC2 instance profiles or ECS task roles
SECRETS_PROVIDER="aws"
AWS_REGION="us-east-1"
# No AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY needed
```

### 3. Rotate Regularly

```bash
# Setup cron job for quarterly rotation
0 0 1 */3 * /path/to/rotate-secrets.sh all production
```

### 4. Monitor Secret Access

```bash
# CloudWatch Logs for AWS Secrets Manager
# Check audit logs
cat logs/secret_rotation_audit.log
```

## Troubleshooting

### Secrets Not Loading

**Check provider**:
```bash
echo $SECRETS_PROVIDER  # Should be "env" or "aws"
```

**Check AWS credentials**:
```bash
aws sts get-caller-identity
```

### Cache Issues

**Clear cache**:
```typescript
import { clearSecretsCache } from './config/secrets';
clearSecretsCache();  # Clear all
clearSecretsCache('JWT_SECRET');  # Clear specific
```

### Rotation Failed

**Check logs**:
```bash
tail -f logs/secret_rotation_*.log
```

**Rollback**:
```bash
# Restore from backup
cp backend/api-gateway/.env.backup.* backend/api-gateway/.env
```

## Files

- **Secrets Manager**: [backend/api-gateway/src/config/secrets.ts](backend/api-gateway/src/config/secrets.ts)
- **Rotation Script**: [scripts/rotate-secrets.sh](scripts/rotate-secrets.sh)
- **Environment Example**: [backend/api-gateway/.env.example](backend/api-gateway/.env.example)

---

**Status**: ✅ Secrets Management Complete
**Implementation Date**: October 23, 2025
**Backends**: AWS Secrets Manager, Environment Variables
**Features**: Caching, Rotation, Encryption, Audit Logging
