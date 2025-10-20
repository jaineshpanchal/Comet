# Security & Compliance Guide

Complete guide to GoLive's security and compliance features.

## Table of Contents

- [Overview](#overview)
- [Permissions & Access Control](#permissions--access-control)
- [Secrets Management](#secrets-management)
- [Team Management](#team-management)
- [Audit Logging](#audit-logging)
- [Security Scanning](#security-scanning)
- [Security Dashboard](#security-dashboard)
- [Best Practices](#best-practices)

## Overview

GoLive implements enterprise-grade security and compliance features including:

- **Role-Based Access Control (RBAC)** with 40+ granular permissions
- **Encrypted Secrets Management** using AES-256-GCM encryption
- **Comprehensive Audit Logging** with real-time notifications
- **Security Scanning** for vulnerability detection
- **Team Management** for collaborative workflows
- **Security Dashboard** with risk scoring

## Permissions & Access Control

### User Roles

GoLive supports 5 hierarchical roles:

| Role | Description | Default Permissions |
|------|-------------|---------------------|
| **ADMIN** | Full system access | All 40+ permissions |
| **MANAGER** | Team and project management | 30+ permissions |
| **DEVELOPER** | Development and deployment | 20+ permissions |
| **TESTER** | Testing and quality assurance | 15+ permissions |
| **VIEWER** | Read-only access | View-only permissions |

### Permission Categories

**User Management**
- `USER_VIEW` - View user profiles
- `USER_CREATE` - Create new users
- `USER_EDIT` - Edit user information
- `USER_DELETE` - Delete users
- `USER_MANAGE_ROLES` - Change user roles
- `USER_MANAGE_PERMISSIONS` - Assign custom permissions

**Team Management**
- `TEAM_VIEW` - View teams
- `TEAM_CREATE` - Create teams
- `TEAM_EDIT` - Edit team information
- `TEAM_DELETE` - Delete teams
- `TEAM_MANAGE_MEMBERS` - Add/remove team members

**Project Management**
- `PROJECT_VIEW` - View projects
- `PROJECT_CREATE` - Create projects
- `PROJECT_EDIT` - Edit projects
- `PROJECT_DELETE` - Delete projects
- `PROJECT_MANAGE_SETTINGS` - Configure project settings

**Pipeline Management**
- `PIPELINE_VIEW` - View pipelines
- `PIPELINE_CREATE` - Create pipelines
- `PIPELINE_EDIT` - Edit pipeline configurations
- `PIPELINE_DELETE` - Delete pipelines
- `PIPELINE_EXECUTE` - Run pipelines
- `PIPELINE_CANCEL` - Cancel running pipelines

**And more...** (40+ total permissions)

### API Endpoints

```bash
# List all available permissions
GET /api/permissions

# Get user permissions
GET /api/permissions/user/:userId

# Grant custom permission
POST /api/permissions/user/:userId
{
  "permission": "PROJECT_MANAGE_SETTINGS"
}

# Revoke permission
DELETE /api/permissions/user/:userId
{
  "permission": "PROJECT_MANAGE_SETTINGS"
}

# Change user role
PUT /api/permissions/user/:userId/role
{
  "role": "MANAGER"
}
```

## Secrets Management

### Encryption

Secrets are encrypted using **AES-256-GCM** with:
- PBKDF2 key derivation (100,000 iterations)
- Random salt per secret
- Random initialization vector (IV)
- Authentication tags for integrity

### Environment Organization

Secrets are organized by environment:
- `development`
- `staging`
- `production`
- Custom environments

### API Endpoints

```bash
# List project secrets (values masked)
GET /api/projects/:projectId/secrets?environment=production

# Get specific secret (requires PROJECT_MANAGE_SETTINGS)
GET /api/projects/:projectId/secrets/:secretId

# Create secret
POST /api/projects/:projectId/secrets
{
  "key": "DATABASE_PASSWORD",
  "value": "super-secret-password",
  "description": "Production database password",
  "environment": "production"
}

# Update secret
PUT /api/projects/:projectId/secrets/:secretId
{
  "value": "new-password",
  "description": "Updated password"
}

# Delete secret
DELETE /api/projects/:projectId/secrets/:secretId

# Bulk import secrets
POST /api/projects/:projectId/secrets/bulk
{
  "secrets": [
    { "key": "API_KEY", "value": "...", "description": "..." },
    { "key": "SECRET_TOKEN", "value": "...", "description": "..." }
  ],
  "environment": "production",
  "overwrite": false
}
```

### Best Practices

1. **Never commit secrets to version control**
2. **Use different secrets per environment**
3. **Rotate secrets regularly**
4. **Limit access to PROJECT_MANAGE_SETTINGS permission**
5. **Audit secret access regularly**

## Team Management

### Features

- Create and manage teams
- Add/remove team members
- Assign projects to teams
- Track team statistics
- Team-based permissions

### API Endpoints

```bash
# List all teams
GET /api/teams

# Get team details
GET /api/teams/:teamId

# Create team (requires MANAGER+ role)
POST /api/teams
{
  "name": "Frontend Team",
  "description": "Responsible for UI/UX development"
}

# Update team
PUT /api/teams/:teamId
{
  "name": "Updated Team Name",
  "description": "New description"
}

# Delete team (requires ADMIN role)
DELETE /api/teams/:teamId

# Add team member
POST /api/teams/:teamId/members
{
  "userId": "user-uuid-here"
}

# Remove team member
DELETE /api/teams/:teamId/members/:userId
```

## Audit Logging

### What's Logged

Every significant action is automatically logged:
- User authentication (login/logout)
- User management (create/update/delete/role changes)
- Team operations
- Project modifications
- Pipeline executions
- Secret access
- Permission changes
- System configuration changes

### Audit Log Fields

- **Timestamp** - When the action occurred
- **User** - Who performed the action
- **Action** - What was done (e.g., "user.created")
- **Resource** - Type of resource affected
- **Resource ID** - Specific resource identifier
- **IP Address** - Client IP address
- **User Agent** - Client browser/application
- **Metadata** - Additional context (JSON)

### Real-Time Notifications

Audit events are broadcast via WebSocket to:
- **ADMIN users** - All audit logs
- **MANAGER users** - Security-critical events

### Security Events

Critical actions trigger security alerts:
- Login attempts
- Password changes
- User role changes
- User deletions
- Team deletions
- Project deletions
- Permission modifications

### API Endpoints

```bash
# Get audit logs with filtering
GET /api/audit-logs?action=login&resource=user&page=1&limit=20

# Get audit statistics
GET /api/audit-logs/statistics

# Export audit logs (handled client-side)
# - CSV export for spreadsheets
# - JSON export for analysis
```

## Security Scanning

### Supported Scan Types

- **DEPENDENCY** - npm audit for dependency vulnerabilities
- **SAST** - Static Application Security Testing (planned)
- **DAST** - Dynamic Application Security Testing (planned)
- **CONTAINER** - Container image scanning (planned)
- **LICENSE** - License compliance scanning (planned)

### Vulnerability Severity

- **Critical** - Immediate action required
- **High** - High priority fixes
- **Moderate** - Should be addressed
- **Low** - Minor issues

### API Endpoints

```bash
# Run security scan
POST /api/security/scans/projects/:projectId
{
  "projectPath": "/path/to/project"
}

# Get scan results
GET /api/security/scans/:scanId

# Get project scan history
GET /api/security/projects/:projectId/scans?limit=20

# Get security statistics
GET /api/security/statistics
```

### npm Audit Integration

Scans automatically:
1. Parse `package.json` dependencies
2. Run `npm audit --json`
3. Parse vulnerability data
4. Calculate severity summary
5. Store results in database
6. Broadcast WebSocket notification

## Security Dashboard

### Features

**Security Score (0-100)**
- Calculated from vulnerability severity
- Critical: -10 points each
- High: -5 points each
- Moderate: -2 points each
- Low: -0.5 points each

**Vulnerability Statistics**
- Total vulnerabilities by severity
- Recent scan results
- Trend analysis

**Status Indicators**
- Excellent (80-100)
- Good (60-79)
- Fair (40-59)
- Critical (0-39)

### Accessing the Dashboard

Navigate to `/security` in the GoLive web interface.

## Best Practices

### Access Control

1. **Principle of Least Privilege**
   - Grant minimum required permissions
   - Use role-based defaults
   - Add custom permissions only when needed

2. **Regular Permission Audits**
   - Review user permissions quarterly
   - Remove unused permissions
   - Verify role assignments

3. **Team-Based Access**
   - Organize users into teams
   - Grant permissions at team level
   - Use project-team assignments

### Secrets Management

1. **Encryption**
   - All secrets encrypted at rest
   - Never log secret values
   - Mask secrets in UI

2. **Access Control**
   - Require PROJECT_MANAGE_SETTINGS for secret access
   - Audit all secret operations
   - Limit secret access to necessary users

3. **Rotation**
   - Rotate secrets regularly
   - Update dependent services
   - Audit rotation compliance

### Audit Logging

1. **Retention**
   - Define audit log retention policy
   - Archive old logs
   - Comply with regulatory requirements

2. **Monitoring**
   - Set up alerts for security events
   - Review audit logs regularly
   - Investigate anomalies

3. **Export**
   - Export logs for compliance
   - Backup audit data
   - Integrate with SIEM systems

### Security Scanning

1. **Regular Scans**
   - Run dependency scans on every build
   - Schedule weekly full scans
   - Scan on deployment

2. **Remediation**
   - Address critical vulnerabilities immediately
   - Plan fixes for high-severity issues
   - Track moderate/low issues

3. **Monitoring**
   - Track security score trends
   - Set score thresholds
   - Alert on critical vulnerabilities

## WebSocket Events

### Audit Events

```javascript
// Subscribe to audit logs (ADMIN only)
socket.on('audit:log', (log) => {
  console.log('Audit event:', log)
  // { action, user, resource, timestamp, ... }
})

// Subscribe to security events (ADMIN + MANAGER)
socket.on('security:event', (event) => {
  console.log('Security event:', event)
  // { action, severity, user, timestamp, ... }
})
```

### Security Scan Events

```javascript
socket.on('security:event', (event) => {
  if (event.type === 'scan_completed') {
    console.log('Scan completed:', event.summary)
    // { critical, high, moderate, low }
  }
})
```

## Compliance

### GDPR Compliance

- User data encryption
- Audit logging for data access
- User deletion support
- Data export capabilities

### SOC 2 Compliance

- Access control
- Audit trails
- Security monitoring
- Incident response

### HIPAA Considerations

- Encrypted data storage
- Access logging
- Role-based access control
- Secure communication

## Troubleshooting

### Permission Denied Errors

```json
{
  "success": false,
  "error": "Insufficient permissions",
  "required": "PROJECT_MANAGE_SETTINGS"
}
```

**Solution**: Grant the required permission or adjust user role.

### Secret Decryption Errors

If secret decryption fails, check:
1. `ENCRYPTION_KEY` environment variable is set
2. Key matches the one used for encryption
3. Database integrity

### Audit Log Issues

If audit logs aren't being created:
1. Check database connectivity
2. Verify audit middleware is registered
3. Check user authentication

## Support

For security issues or questions:
- Create an issue on GitHub
- Contact: security@golive-devops.com
- Review audit logs for troubleshooting
