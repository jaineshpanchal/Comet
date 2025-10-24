-- Add composite indices for common query patterns

-- User queries: frequently filter by role AND status together
CREATE INDEX IF NOT EXISTS "users_role_isActive_email_idx" ON "users"("role", "isActive", "email");

-- Pipeline queries: filter by project and status together
CREATE INDEX IF NOT EXISTS "pipelines_projectId_status_lastRunAt_idx" ON "pipelines"("projectId", "status", "lastRunAt");

-- PipelineRun queries: get recent runs for a specific pipeline
CREATE INDEX IF NOT EXISTS "pipeline_runs_pipelineId_startedAt_idx" ON "pipeline_runs"("pipelineId", "startedAt" DESC);

-- TestRun queries: get test runs by suite and environment
CREATE INDEX IF NOT EXISTS "test_runs_testSuiteId_environment_startedAt_idx" ON "test_runs"("testSuiteId", "environment", "startedAt" DESC);

-- Deployment queries: get recent deployments for project/environment
CREATE INDEX IF NOT EXISTS "deployments_projectId_environment_deployedAt_idx" ON "deployments"("projectId", "environment", "deployedAt" DESC);

-- AuditLog queries: filter by resource type and date range
CREATE INDEX IF NOT EXISTS "audit_logs_resource_timestamp_idx" ON "audit_logs"("resource", "timestamp" DESC);

-- RefreshToken queries: find valid tokens for cleanup
CREATE INDEX IF NOT EXISTS "refresh_tokens_expiresAt_userId_idx" ON "refresh_tokens"("expiresAt", "userId");

-- Project queries: active projects by owner
CREATE INDEX IF NOT EXISTS "projects_ownerId_isActive_createdAt_idx" ON "projects"("ownerId", "isActive", "createdAt" DESC);

-- Integration queries: active integrations by type
CREATE INDEX IF NOT EXISTS "integrations_type_isActive_userId_idx" ON "integrations"("type", "isActive", "userId");

-- SecurityScan queries: recent scans by project and type
CREATE INDEX IF NOT EXISTS "security_scans_projectId_scanType_startedAt_idx" ON "security_scans"("projectId", "scanType", "startedAt" DESC);
