-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "deployments_projectId_idx" ON "deployments"("projectId");

-- CreateIndex
CREATE INDEX "deployments_environment_status_idx" ON "deployments"("environment", "status");

-- CreateIndex
CREATE INDEX "deployments_deployedAt_idx" ON "deployments"("deployedAt");

-- CreateIndex
CREATE INDEX "deployments_deployedBy_idx" ON "deployments"("deployedBy");

-- CreateIndex
CREATE INDEX "pipeline_runs_pipelineId_idx" ON "pipeline_runs"("pipelineId");

-- CreateIndex
CREATE INDEX "pipeline_runs_status_idx" ON "pipeline_runs"("status");

-- CreateIndex
CREATE INDEX "pipeline_runs_startedAt_idx" ON "pipeline_runs"("startedAt");

-- CreateIndex
CREATE INDEX "pipeline_runs_triggeredBy_idx" ON "pipeline_runs"("triggeredBy");

-- CreateIndex
CREATE INDEX "pipelines_projectId_idx" ON "pipelines"("projectId");

-- CreateIndex
CREATE INDEX "pipelines_status_isActive_idx" ON "pipelines"("status", "isActive");

-- CreateIndex
CREATE INDEX "pipelines_lastRunAt_idx" ON "pipelines"("lastRunAt");

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
CREATE INDEX "test_runs_testSuiteId_idx" ON "test_runs"("testSuiteId");

-- CreateIndex
CREATE INDEX "test_runs_status_idx" ON "test_runs"("status");

-- CreateIndex
CREATE INDEX "test_runs_startedAt_idx" ON "test_runs"("startedAt");

-- CreateIndex
CREATE INDEX "test_runs_triggeredBy_idx" ON "test_runs"("triggeredBy");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");
