-- DropIndex
DROP INDEX "audit_logs_timestamp_idx";

-- DropIndex
DROP INDEX "audit_logs_resource_resourceId_idx";

-- DropIndex
DROP INDEX "audit_logs_action_idx";

-- DropIndex
DROP INDEX "audit_logs_userId_idx";

-- DropIndex
DROP INDEX "deployments_deployedBy_idx";

-- DropIndex
DROP INDEX "deployments_deployedAt_idx";

-- DropIndex
DROP INDEX "deployments_environment_status_idx";

-- DropIndex
DROP INDEX "deployments_projectId_idx";

-- DropIndex
DROP INDEX "pipeline_runs_triggeredBy_idx";

-- DropIndex
DROP INDEX "pipeline_runs_startedAt_idx";

-- DropIndex
DROP INDEX "pipeline_runs_status_idx";

-- DropIndex
DROP INDEX "pipeline_runs_pipelineId_idx";

-- DropIndex
DROP INDEX "pipelines_lastRunAt_idx";

-- DropIndex
DROP INDEX "pipelines_status_isActive_idx";

-- DropIndex
DROP INDEX "pipelines_projectId_idx";

-- DropIndex
DROP INDEX "projects_createdAt_idx";

-- DropIndex
DROP INDEX "projects_isActive_idx";

-- DropIndex
DROP INDEX "projects_teamId_idx";

-- DropIndex
DROP INDEX "projects_ownerId_idx";

-- DropIndex
DROP INDEX "refresh_tokens_expiresAt_idx";

-- DropIndex
DROP INDEX "refresh_tokens_userId_idx";

-- DropIndex
DROP INDEX "test_runs_triggeredBy_idx";

-- DropIndex
DROP INDEX "test_runs_startedAt_idx";

-- DropIndex
DROP INDEX "test_runs_status_idx";

-- DropIndex
DROP INDEX "test_runs_testSuiteId_idx";

-- DropIndex
DROP INDEX "users_createdAt_idx";

-- DropIndex
DROP INDEX "users_role_isActive_idx";

-- DropIndex
DROP INDEX "users_username_idx";

-- DropIndex
DROP INDEX "users_email_idx";

-- CreateTable
CREATE TABLE "project_secrets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'development',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_secrets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "project_secrets_projectId_key_environment_key" ON "project_secrets"("projectId", "key", "environment");
