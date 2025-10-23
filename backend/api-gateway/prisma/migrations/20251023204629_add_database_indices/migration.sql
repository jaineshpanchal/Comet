-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "deployments_projectId_idx" ON "deployments"("projectId");

-- CreateIndex
CREATE INDEX "deployments_environment_idx" ON "deployments"("environment");

-- CreateIndex
CREATE INDEX "deployments_status_idx" ON "deployments"("status");

-- CreateIndex
CREATE INDEX "deployments_deployedAt_idx" ON "deployments"("deployedAt");

-- CreateIndex
CREATE INDEX "deployments_projectId_environment_idx" ON "deployments"("projectId", "environment");

-- CreateIndex
CREATE INDEX "integration_notifications_integrationId_idx" ON "integration_notifications"("integrationId");

-- CreateIndex
CREATE INDEX "integration_notifications_isActive_idx" ON "integration_notifications"("isActive");

-- CreateIndex
CREATE INDEX "integrations_userId_idx" ON "integrations"("userId");

-- CreateIndex
CREATE INDEX "integrations_teamId_idx" ON "integrations"("teamId");

-- CreateIndex
CREATE INDEX "integrations_projectId_idx" ON "integrations"("projectId");

-- CreateIndex
CREATE INDEX "integrations_type_idx" ON "integrations"("type");

-- CreateIndex
CREATE INDEX "integrations_status_idx" ON "integrations"("status");

-- CreateIndex
CREATE INDEX "integrations_isActive_idx" ON "integrations"("isActive");

-- CreateIndex
CREATE INDEX "pipeline_runs_pipelineId_idx" ON "pipeline_runs"("pipelineId");

-- CreateIndex
CREATE INDEX "pipeline_runs_status_idx" ON "pipeline_runs"("status");

-- CreateIndex
CREATE INDEX "pipeline_runs_triggeredBy_idx" ON "pipeline_runs"("triggeredBy");

-- CreateIndex
CREATE INDEX "pipeline_runs_startedAt_idx" ON "pipeline_runs"("startedAt");

-- CreateIndex
CREATE INDEX "pipeline_runs_pipelineId_status_idx" ON "pipeline_runs"("pipelineId", "status");

-- CreateIndex
CREATE INDEX "pipelines_projectId_idx" ON "pipelines"("projectId");

-- CreateIndex
CREATE INDEX "pipelines_status_idx" ON "pipelines"("status");

-- CreateIndex
CREATE INDEX "pipelines_isActive_idx" ON "pipelines"("isActive");

-- CreateIndex
CREATE INDEX "pipelines_lastRunAt_idx" ON "pipelines"("lastRunAt");

-- CreateIndex
CREATE INDEX "project_secrets_projectId_idx" ON "project_secrets"("projectId");

-- CreateIndex
CREATE INDEX "project_secrets_environment_idx" ON "project_secrets"("environment");

-- CreateIndex
CREATE INDEX "projects_ownerId_idx" ON "projects"("ownerId");

-- CreateIndex
CREATE INDEX "projects_teamId_idx" ON "projects"("teamId");

-- CreateIndex
CREATE INDEX "projects_isActive_idx" ON "projects"("isActive");

-- CreateIndex
CREATE INDEX "projects_createdAt_idx" ON "projects"("createdAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "security_scans_projectId_idx" ON "security_scans"("projectId");

-- CreateIndex
CREATE INDEX "security_scans_status_idx" ON "security_scans"("status");

-- CreateIndex
CREATE INDEX "security_scans_scanType_idx" ON "security_scans"("scanType");

-- CreateIndex
CREATE INDEX "security_scans_startedAt_idx" ON "security_scans"("startedAt");

-- CreateIndex
CREATE INDEX "stage_runs_pipelineRunId_idx" ON "stage_runs"("pipelineRunId");

-- CreateIndex
CREATE INDEX "stage_runs_status_idx" ON "stage_runs"("status");

-- CreateIndex
CREATE INDEX "stage_runs_stageType_idx" ON "stage_runs"("stageType");

-- CreateIndex
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");

-- CreateIndex
CREATE INDEX "team_members_teamId_idx" ON "team_members"("teamId");

-- CreateIndex
CREATE INDEX "teams_isActive_idx" ON "teams"("isActive");

-- CreateIndex
CREATE INDEX "teams_createdAt_idx" ON "teams"("createdAt");

-- CreateIndex
CREATE INDEX "test_runs_testSuiteId_idx" ON "test_runs"("testSuiteId");

-- CreateIndex
CREATE INDEX "test_runs_status_idx" ON "test_runs"("status");

-- CreateIndex
CREATE INDEX "test_runs_environment_idx" ON "test_runs"("environment");

-- CreateIndex
CREATE INDEX "test_runs_startedAt_idx" ON "test_runs"("startedAt");

-- CreateIndex
CREATE INDEX "test_runs_testSuiteId_status_idx" ON "test_runs"("testSuiteId", "status");

-- CreateIndex
CREATE INDEX "test_suites_projectId_idx" ON "test_suites"("projectId");

-- CreateIndex
CREATE INDEX "test_suites_type_idx" ON "test_suites"("type");

-- CreateIndex
CREATE INDEX "test_suites_isActive_idx" ON "test_suites"("isActive");

-- CreateIndex
CREATE INDEX "user_permissions_userId_idx" ON "user_permissions"("userId");

-- CreateIndex
CREATE INDEX "user_permissions_permission_idx" ON "user_permissions"("permission");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_lastLoginAt_idx" ON "users"("lastLoginAt");

-- CreateIndex
CREATE INDEX "webhook_deliveries_webhookId_idx" ON "webhook_deliveries"("webhookId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_idx" ON "webhook_deliveries"("status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_deliveredAt_idx" ON "webhook_deliveries"("deliveredAt");

-- CreateIndex
CREATE INDEX "webhooks_integrationId_idx" ON "webhooks"("integrationId");

-- CreateIndex
CREATE INDEX "webhooks_projectId_idx" ON "webhooks"("projectId");

-- CreateIndex
CREATE INDEX "webhooks_isActive_idx" ON "webhooks"("isActive");
