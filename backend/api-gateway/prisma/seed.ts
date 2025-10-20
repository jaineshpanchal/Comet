/**
 * Database Seed Script
 * Populates the database with realistic sample data for development
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.stageRun.deleteMany();
  await prisma.pipelineRun.deleteMany();
  await prisma.testRun.deleteMany();
  await prisma.deployment.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.testSuite.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Existing data cleared\n');

  // Create Users
  console.log('👥 Creating users...');
  const hashedPassword = bcrypt.hashSync('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@golive.dev',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      role: 'ADMIN',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  });

  const john = await prisma.user.create({
    data: {
      email: 'john.doe@golive.dev',
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      password: hashedPassword,
      role: 'DEVELOPER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    },
  });

  const jane = await prisma.user.create({
    data: {
      email: 'jane.smith@golive.dev',
      username: 'janesmith',
      firstName: 'Jane',
      lastName: 'Smith',
      password: hashedPassword,
      role: 'DEVELOPER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: 'alice.wilson@golive.dev',
      username: 'alicewilson',
      firstName: 'Alice',
      lastName: 'Wilson',
      password: hashedPassword,
      role: 'TESTER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    },
  });

  console.log(`✅ Created ${4} users\n`);

  // Create Teams
  console.log('🏢 Creating teams...');
  const frontendTeam = await prisma.team.create({
    data: {
      name: 'Frontend Team',
      description: 'Responsible for user-facing applications',
      members: {
        create: [
          { userId: john.id },
          { userId: jane.id },
        ],
      },
    },
  });

  const backendTeam = await prisma.team.create({
    data: {
      name: 'Backend Team',
      description: 'API and microservices development',
      members: {
        create: [
          { userId: john.id },
          { userId: alice.id },
        ],
      },
    },
  });

  console.log(`✅ Created ${2} teams\n`);

  // Create Projects
  console.log('📦 Creating projects...');
  const webApp = await prisma.project.create({
    data: {
      name: 'E-Commerce Web App',
      description: 'Next.js-based e-commerce platform with real-time inventory',
      repositoryUrl: 'https://github.com/golive-dev/ecommerce-web',
      branch: 'main',
      framework: 'Next.js',
      language: 'TypeScript',
      ownerId: john.id,
      teamId: frontendTeam.id,
    },
  });

  const apiGateway = await prisma.project.create({
    data: {
      name: 'API Gateway Service',
      description: 'GraphQL API gateway with authentication and rate limiting',
      repositoryUrl: 'https://github.com/golive-dev/api-gateway',
      branch: 'develop',
      framework: 'Express',
      language: 'TypeScript',
      ownerId: jane.id,
      teamId: backendTeam.id,
    },
  });

  const mobileApp = await prisma.project.create({
    data: {
      name: 'Mobile App (React Native)',
      description: 'Cross-platform mobile application for iOS and Android',
      repositoryUrl: 'https://github.com/golive-dev/mobile-app',
      branch: 'main',
      framework: 'React Native',
      language: 'TypeScript',
      ownerId: john.id,
      teamId: frontendTeam.id,
    },
  });

  const dataService = await prisma.project.create({
    data: {
      name: 'Data Analytics Service',
      description: 'Real-time data processing and analytics microservice',
      repositoryUrl: 'https://github.com/golive-dev/data-analytics',
      branch: 'main',
      framework: 'FastAPI',
      language: 'Python',
      ownerId: alice.id,
      teamId: backendTeam.id,
    },
  });

  console.log(`✅ Created ${4} projects\n`);

  // Create Pipelines
  console.log('🚀 Creating pipelines...');
  const webAppPipeline = await prisma.pipeline.create({
    data: {
      projectId: webApp.id,
      name: 'CI/CD Pipeline',
      trigger: 'GIT_PUSH',
      status: 'SUCCESS',
      stages: JSON.stringify([
        { name: 'Build', type: 'BUILD' },
        { name: 'Test', type: 'TEST' },
        { name: 'Security Scan', type: 'SECURITY_SCAN' },
        { name: 'Deploy', type: 'DEPLOY' },
      ]),
      lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  });

  const apiPipeline = await prisma.pipeline.create({
    data: {
      projectId: apiGateway.id,
      name: 'Build & Deploy Pipeline',
      trigger: 'GIT_PR',
      status: 'RUNNING',
      stages: JSON.stringify([
        { name: 'Build', type: 'BUILD' },
        { name: 'Unit Tests', type: 'TEST' },
        { name: 'Integration Tests', type: 'TEST' },
        { name: 'Deploy to Staging', type: 'DEPLOY' },
      ]),
      lastRunAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    },
  });

  const mobilePipeline = await prisma.pipeline.create({
    data: {
      projectId: mobileApp.id,
      name: 'Mobile Build Pipeline',
      trigger: 'MANUAL',
      status: 'SUCCESS',
      stages: JSON.stringify([
        { name: 'Build iOS', type: 'BUILD' },
        { name: 'Build Android', type: 'BUILD' },
        { name: 'E2E Tests', type: 'TEST' },
      ]),
      lastRunAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
  });

  const dataPipeline = await prisma.pipeline.create({
    data: {
      projectId: dataService.id,
      name: 'Data Pipeline',
      trigger: 'SCHEDULE',
      status: 'FAILED',
      stages: JSON.stringify([
        { name: 'Build', type: 'BUILD' },
        { name: 'Test', type: 'TEST' },
      ]),
      lastRunAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
  });

  console.log(`✅ Created ${4} pipelines\n`);

  // Create Pipeline Runs
  console.log('📊 Creating pipeline runs...');
  const now = new Date();
  const pipelineRuns = [];

  // Web App Pipeline Runs (mostly successful)
  for (let i = 0; i < 20; i++) {
    const startedAt = new Date(now.getTime() - i * 3 * 60 * 60 * 1000); // Every 3 hours
    const duration = Math.floor(Math.random() * 300) + 180; // 3-8 minutes
    const status = i < 3 ? 'FAILED' : 'SUCCESS'; // 3 failures, rest success

    const run = await prisma.pipelineRun.create({
      data: {
        pipelineId: webAppPipeline.id,
        status: status as any,
        triggeredBy: john.id,
        startedAt,
        finishedAt: new Date(startedAt.getTime() + duration * 1000),
        duration,
        logs: `Pipeline execution log for run #${i + 1}`,
      },
    });
    pipelineRuns.push(run);
  }

  // API Gateway Pipeline Runs (mixed results)
  for (let i = 0; i < 15; i++) {
    const startedAt = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 240) + 120;
    const status = i % 4 === 0 ? 'FAILED' : 'SUCCESS'; // 25% failure rate

    await prisma.pipelineRun.create({
      data: {
        pipelineId: apiPipeline.id,
        status: status as any,
        triggeredBy: jane.id,
        startedAt,
        finishedAt: new Date(startedAt.getTime() + duration * 1000),
        duration,
      },
    });
  }

  // Mobile App Pipeline Runs (high success rate)
  for (let i = 0; i < 10; i++) {
    const startedAt = new Date(now.getTime() - i * 6 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 600) + 300; // 5-15 minutes
    const status = i === 0 ? 'FAILED' : 'SUCCESS'; // Only 1 failure

    await prisma.pipelineRun.create({
      data: {
        pipelineId: mobilePipeline.id,
        status: status as any,
        triggeredBy: john.id,
        startedAt,
        finishedAt: new Date(startedAt.getTime() + duration * 1000),
        duration,
      },
    });
  }

  // Data Service Pipeline Runs (some failures)
  for (let i = 0; i < 12; i++) {
    const startedAt = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 180) + 60;
    const status = i % 3 === 0 ? 'FAILED' : 'SUCCESS'; // 33% failure rate

    await prisma.pipelineRun.create({
      data: {
        pipelineId: dataPipeline.id,
        status: status as any,
        triggeredBy: alice.id,
        startedAt,
        finishedAt: new Date(startedAt.getTime() + duration * 1000),
        duration,
      },
    });
  }

  console.log(`✅ Created 57 pipeline runs\n`);

  // Create Test Suites
  console.log('🧪 Creating test suites...');
  const webAppUnitTests = await prisma.testSuite.create({
    data: {
      projectId: webApp.id,
      name: 'Unit Tests',
      description: 'Component and utility function tests',
      type: 'UNIT',
      framework: 'Jest',
    },
  });

  const webAppE2ETests = await prisma.testSuite.create({
    data: {
      projectId: webApp.id,
      name: 'E2E Tests',
      description: 'End-to-end user journey tests',
      type: 'E2E',
      framework: 'Playwright',
    },
  });

  const apiIntegrationTests = await prisma.testSuite.create({
    data: {
      projectId: apiGateway.id,
      name: 'Integration Tests',
      description: 'API endpoint integration tests',
      type: 'INTEGRATION',
      framework: 'Supertest',
    },
  });

  const mobileE2ETests = await prisma.testSuite.create({
    data: {
      projectId: mobileApp.id,
      name: 'Mobile E2E Tests',
      description: 'Cross-platform E2E tests',
      type: 'E2E',
      framework: 'Detox',
    },
  });

  const dataUnitTests = await prisma.testSuite.create({
    data: {
      projectId: dataService.id,
      name: 'Data Processing Tests',
      description: 'Data transformation and validation tests',
      type: 'UNIT',
      framework: 'Pytest',
    },
  });

  console.log(`✅ Created ${5} test suites\n`);

  // Create Test Runs
  console.log('📈 Creating test runs...');

  // Web App Unit Test Runs
  for (let i = 0; i < 25; i++) {
    const startedAt = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);
    const totalTests = 150 + Math.floor(Math.random() * 20);
    const failedTests = i % 5 === 0 ? Math.floor(Math.random() * 5) : 0;
    const passedTests = totalTests - failedTests;
    const duration = Math.floor(Math.random() * 60) + 30;

    await prisma.testRun.create({
      data: {
        testSuiteId: webAppUnitTests.id,
        status: failedTests > 0 ? 'FAILED' : 'PASSED',
        triggeredBy: john.id,
        startedAt,
        finishedAt: new Date(startedAt.getTime() + duration * 1000),
        duration,
        totalTests,
        passedTests,
        failedTests,
        coverage: 85.5 + Math.random() * 10,
      },
    });
  }

  // Web App E2E Test Runs
  for (let i = 0; i < 15; i++) {
    const startedAt = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
    const totalTests = 25 + Math.floor(Math.random() * 5);
    const failedTests = i % 6 === 0 ? Math.floor(Math.random() * 3) : 0;
    const passedTests = totalTests - failedTests;
    const duration = Math.floor(Math.random() * 180) + 120;

    await prisma.testRun.create({
      data: {
        testSuiteId: webAppE2ETests.id,
        status: failedTests > 0 ? 'FAILED' : 'PASSED',
        triggeredBy: alice.id,
        startedAt,
        finishedAt: new Date(startedAt.getTime() + duration * 1000),
        duration,
        totalTests,
        passedTests,
        failedTests,
      },
    });
  }

  // API Integration Test Runs
  for (let i = 0; i < 20; i++) {
    const startedAt = new Date(now.getTime() - i * 3 * 60 * 60 * 1000);
    const totalTests = 80 + Math.floor(Math.random() * 10);
    const failedTests = i % 7 === 0 ? Math.floor(Math.random() * 4) : 0;
    const passedTests = totalTests - failedTests;
    const duration = Math.floor(Math.random() * 90) + 45;

    await prisma.testRun.create({
      data: {
        testSuiteId: apiIntegrationTests.id,
        status: failedTests > 0 ? 'FAILED' : 'PASSED',
        triggeredBy: jane.id,
        startedAt,
        finishedAt: new Date(startedAt.getTime() + duration * 1000),
        duration,
        totalTests,
        passedTests,
        failedTests,
        coverage: 78.0 + Math.random() * 12,
      },
    });
  }

  console.log(`✅ Created 60 test runs\n`);

  // Create Deployments
  console.log('🚢 Creating deployments...');
  const environments = ['development', 'staging', 'production'];

  // Web App Deployments
  for (let i = 0; i < 30; i++) {
    const env = environments[i % 3];
    const deployedAt = new Date(now.getTime() - i * 6 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 120) + 60;
    const status = i % 10 === 0 ? 'FAILED' : 'DEPLOYED'; // 10% failure rate

    await prisma.deployment.create({
      data: {
        projectId: webApp.id,
        environment: env,
        version: `v1.${Math.floor(i / 3)}.${i % 3}`,
        branch: env === 'production' ? 'main' : 'develop',
        commitHash: Math.random().toString(36).substring(7),
        status: status as any,
        deployedBy: john.id,
        deployedAt,
        finishedAt: new Date(deployedAt.getTime() + duration * 1000),
        duration,
      },
    });
  }

  // API Gateway Deployments
  for (let i = 0; i < 25; i++) {
    const env = environments[i % 3];
    const deployedAt = new Date(now.getTime() - i * 5 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 90) + 45;
    const status = i % 12 === 0 ? 'FAILED' : 'DEPLOYED'; // ~8% failure rate

    await prisma.deployment.create({
      data: {
        projectId: apiGateway.id,
        environment: env,
        version: `v2.${Math.floor(i / 3)}.${i % 3}`,
        branch: 'develop',
        commitHash: Math.random().toString(36).substring(7),
        status: status as any,
        deployedBy: jane.id,
        deployedAt,
        finishedAt: new Date(deployedAt.getTime() + duration * 1000),
        duration,
      },
    });
  }

  // Mobile App Deployments (less frequent)
  for (let i = 0; i < 12; i++) {
    const env = i % 2 === 0 ? 'staging' : 'production';
    const deployedAt = new Date(now.getTime() - i * 12 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 300) + 180;
    const status = i === 0 ? 'FAILED' : 'DEPLOYED'; // Only 1 failure

    await prisma.deployment.create({
      data: {
        projectId: mobileApp.id,
        environment: env,
        version: `v1.${i}.0`,
        branch: 'main',
        commitHash: Math.random().toString(36).substring(7),
        status: status as any,
        deployedBy: john.id,
        deployedAt,
        finishedAt: new Date(deployedAt.getTime() + duration * 1000),
        duration,
      },
    });
  }

  console.log(`✅ Created 67 deployments\n`);

  console.log('✨ Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - 4 Users (admin, john, jane, alice)`);
  console.log(`   - 2 Teams (Frontend, Backend)`);
  console.log(`   - 4 Projects (Web App, API Gateway, Mobile App, Data Service)`);
  console.log(`   - 4 Pipelines`);
  console.log(`   - 57 Pipeline Runs`);
  console.log(`   - 5 Test Suites`);
  console.log(`   - 60 Test Runs`);
  console.log(`   - 67 Deployments`);
  console.log('\n🎉 Your dashboard is now populated with realistic data!\n');
  console.log('🔐 Login credentials:');
  console.log('   Email: admin@golive.dev');
  console.log('   Password: password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
