# GitHub Actions CI/CD Pipelines

This directory contains GitHub Actions workflows for automated testing, building, and deployment of the GoLive DevOps Platform.

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers**: Push and Pull Requests to `master`, `main`, `develop` branches

**Jobs**:
- **backend-lint**: ESLint + TypeScript type checking for backend
- **backend-test**: Unit tests with PostgreSQL + Redis services
- **frontend-lint**: ESLint + TypeScript type checking for frontend
- **frontend-test**: Frontend unit tests with coverage
- **frontend-build**: Production build verification
- **ai-services-test**: Python tests for AI services
- **security-scan**: npm audit + Trivy vulnerability scanning

**Duration**: ~8-12 minutes

### 2. Deployment Pipeline (`deploy.yml`)

**Triggers**:
- Push to `master`/`main` → Staging deployment
- Git tags `v*.*.*` → Production deployment
- Manual workflow dispatch

**Jobs**:
- **build-images**: Docker image builds for all services
- **deploy-staging**: Staging environment deployment
- **deploy-production**: Production deployment (with approvals)
- **run-migrations**: Database migrations

**Duration**: ~15-20 minutes

## Required Secrets

Configure these in GitHub Repository Settings → Secrets and variables → Actions:

### Database
```
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Authentication
```
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRATION=7d
```

### Redis
```
REDIS_URL=redis://host:6379
```

### AI Services
```
OPENAI_API_KEY=sk-...
```

### Deployment (Optional)
```
DEPLOY_SSH_KEY=<your-ssh-private-key>
DEPLOY_HOST=your-server.com
DEPLOY_USER=deploy
```

### Notifications (Optional)
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://api.golive.dev
NEXT_PUBLIC_WS_URL=wss://api.golive.dev
NEXT_PUBLIC_AI_SERVICE_URL=https://ai.golive.dev
```

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/golive
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=<generate-random-secret>
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRATION=7d

# Services
PORT=8000
NODE_ENV=production

# CSRF
CSRF_SECRET=<generate-random-secret>

# Encryption
ENCRYPTION_KEY=<generate-random-key-32-bytes>
```

### AI Services (.env)
```env
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://user:password@localhost:5432/golive
REDIS_URL=redis://localhost:6379
```

## Setup Instructions

### 1. Enable GitHub Actions

1. Go to repository Settings → Actions → General
2. Under "Actions permissions", select "Allow all actions and reusable workflows"
3. Under "Workflow permissions", select "Read and write permissions"
4. Click "Save"

### 2. Add Repository Secrets

1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret from the list above

### 3. Configure Branch Protection

1. Go to Settings → Branches
2. Add branch protection rule for `main`/`master`:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Select status checks: `CI Success`
   - ✅ Require linear history
   - ✅ Include administrators

### 4. Set Up Environments

1. Go to Settings → Environments
2. Create `staging` environment:
   - No required reviewers
   - Deployment branch: `develop`
3. Create `production` environment:
   - Required reviewers: Add team members
   - Deployment branch: `main`, tags matching `v*.*.*`

## Testing the Pipeline Locally

### Run Backend Tests
```bash
cd backend
npm test
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

### Run Linting
```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```

### Type Checking
```bash
# Backend
cd backend/api-gateway && npm run typecheck

# Frontend
cd frontend && npm run typecheck
```

## CI/CD Best Practices

### 1. Fast Feedback
- Linting runs first (fastest)
- Tests run in parallel
- Build runs last (slowest)

### 2. Security
- npm audit on every PR
- Trivy scans for vulnerabilities
- SARIF results uploaded to GitHub Security

### 3. Coverage
- Code coverage tracked via Codecov
- Coverage reports on PRs
- Minimum coverage enforced

### 4. Caching
- npm dependencies cached
- Docker layers cached
- Faster subsequent runs

### 5. Notifications
- Status checks on PRs
- Deployment notifications
- Failure alerts

## Troubleshooting

### Tests Failing in CI but Passing Locally

**Cause**: Environment differences
**Solution**:
```bash
# Run with CI environment
CI=true npm test
```

### Docker Build Fails

**Cause**: Missing build context
**Solution**: Check Dockerfile paths and build context

### Migration Failures

**Cause**: Database state mismatch
**Solution**:
- Check migration order
- Verify DATABASE_URL secret
- Review Prisma schema

### Deployment Timeouts

**Cause**: Long-running deployment scripts
**Solution**:
- Add timeout-minutes to job
- Split into smaller jobs
- Use deployment status checks

## Monitoring

### GitHub Actions Dashboard
- View workflow runs: Actions tab
- Check logs: Click on workflow → Job → Step
- Re-run failed jobs: Re-run all jobs button

### Status Badges

Add to README.md:
```markdown
![CI](https://github.com/yourusername/golive/workflows/CI%20Pipeline/badge.svg)
![Deploy](https://github.com/yourusername/golive/workflows/Deploy%20to%20Production/badge.svg)
```

## Performance Metrics

| Job | Duration | Can Run Parallel |
|-----|----------|-----------------|
| Backend Lint | ~30s | ✅ Yes |
| Backend Test | ~2min | ✅ Yes |
| Frontend Lint | ~30s | ✅ Yes |
| Frontend Test | ~1min | ✅ Yes |
| Frontend Build | ~3min | ✅ Yes |
| AI Services Test | ~1min | ✅ Yes |
| Security Scan | ~2min | ✅ Yes |
| **Total (Parallel)** | **~3-4min** | - |

## Cost Optimization

### Free Tier
- 2,000 minutes/month for free (public repos)
- 3,000 minutes/month for private repos (Pro)

### Tips
- Cache dependencies
- Use matrix builds efficiently
- Skip CI for docs-only changes:
  ```yaml
  paths-ignore:
    - '**.md'
    - 'docs/**'
  ```

## Next Steps

1. **Add E2E Tests**: Playwright/Cypress in CI
2. **Performance Testing**: Lighthouse CI for frontend
3. **Load Testing**: Artillery in staging
4. **Automated Rollback**: On deployment failures
5. **Canary Deployments**: Gradual rollouts

---

**Need Help?**
- 📖 [GitHub Actions Docs](https://docs.github.com/en/actions)
- 💬 Team: #devops Slack channel
- 🐛 Issues: Create GitHub issue with `ci/cd` label
