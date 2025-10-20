# Database Seeding Guide

## Overview

The GoLive DevOps Platform includes a comprehensive database seed script that populates your development database with realistic sample data.

## What's Included

The seed script creates:

- **4 Users** with different roles (Admin, Developers, Tester)
- **2 Teams** (Frontend Team, Backend Team)
- **4 Projects** (Web App, API Gateway, Mobile App, Data Analytics)
- **4 CI/CD Pipelines** with different triggers and statuses
- **57 Pipeline Runs** with varying success/failure rates
- **5 Test Suites** (Unit, Integration, E2E tests)
- **60 Test Runs** with realistic pass/fail statistics
- **67 Deployments** across different environments

## Running the Seed Script

### First Time Setup

```bash
# Navigate to the API Gateway directory
cd backend/api-gateway

# Run the seed script
npm run seed
```

### Resetting the Database

The seed script automatically clears all existing data before inserting new data, so you can run it multiple times:

```bash
npm run seed
```

## Sample Data Details

### Users

| Email | Username | Role | Password |
|-------|----------|------|----------|
| admin@golive.dev | admin | ADMIN | password123 |
| john.doe@golive.dev | johndoe | DEVELOPER | password123 |
| jane.smith@golive.dev | janesmith | DEVELOPER | password123 |
| alice.wilson@golive.dev | alicewilson | TESTER | password123 |

### Projects

1. **E-Commerce Web App** (Next.js/TypeScript)
   - Owner: John Doe
   - Team: Frontend Team
   - Repository: https://github.com/golive-dev/ecommerce-web

2. **API Gateway Service** (Express/TypeScript)
   - Owner: Jane Smith
   - Team: Backend Team
   - Repository: https://github.com/golive-dev/api-gateway

3. **Mobile App** (React Native/TypeScript)
   - Owner: John Doe
   - Team: Frontend Team
   - Repository: https://github.com/golive-dev/mobile-app

4. **Data Analytics Service** (FastAPI/Python)
   - Owner: Alice Wilson
   - Team: Backend Team
   - Repository: https://github.com/golive-dev/data-analytics

### Metrics Generated

The seed data creates realistic metrics for the dashboard:

- **Pipeline Success Rate**: ~66.7%
- **Test Pass Rate**: ~76.9%
- **Deployment Success Rate**: ~72.7%
- **Average Pipeline Duration**: ~4-5 minutes
- **Deployment Frequency**: ~11 per day

### Timeline

All sample data is distributed across the last 7 days to provide realistic historical trends and charts.

## Viewing the Data

After seeding, refresh your dashboard at `http://localhost:3030/dashboard` to see:

- ✅ **KPI Metrics** - Real statistics from the seeded data
- ✅ **Pipeline Status** - Active and recent pipeline runs
- ✅ **Test Results** - Test suite execution history
- ✅ **Deployment History** - Deployments across environments
- ✅ **Activity Feed** - Recent activities from all projects

## Development Tips

### Quick Re-seed

```bash
# One-liner to reset and seed the database
cd backend/api-gateway && npm run seed
```

### Customizing Sample Data

Edit `backend/api-gateway/prisma/seed.ts` to customize:
- Number of records created
- User names and roles
- Project details
- Success/failure rates
- Time ranges

### Troubleshooting

If the seed script fails:

1. Ensure the database is accessible:
   ```bash
   cd backend/api-gateway
   npx prisma db push
   ```

2. Check your `.env` file has `DATABASE_URL` set

3. Verify Prisma client is generated:
   ```bash
   npx prisma generate
   ```

## Next Steps

With your database seeded, you can:

1. **Test the Dashboard** - Explore all the metrics and visualizations
2. **Test API Endpoints** - Use the sample data to test all endpoints
3. **Develop Features** - Build new features with realistic data
4. **Create Screenshots** - Generate marketing materials with populated UI

---

**Note**: The seed script is for development only. Never run this in production!
