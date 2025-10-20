import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('<1 Starting pipeline seed...');

  // Get the admin user
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@comet.dev' }
  });

  if (!adminUser) {
    console.error('L Admin user not found.');
    return;
  }

  // Get or create project
  let project = await prisma.project.findFirst({
    where: { name: 'Comet Platform' }
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Comet Platform',
        description: 'Main DevOps platform',
        ownerId: adminUser.id,
        repositoryUrl: 'https://github.com/example/comet',
        branch: 'main',
        language: 'TypeScript',
        framework: 'Next.js',
        isActive: true,
      }
    });
  }

  // Create pipelines
  const pipelines = [
    {
      name: 'Quick Test Pipeline',
      trigger: 'MANUAL',
      stages: [
        { name: 'Build', type: 'BUILD', commands: ['echo Building...'], timeout: 60 },
        { name: 'Test', type: 'TEST', commands: ['echo Testing...'], timeout: 60 }
      ]
    },
    {
      name: 'Frontend CI/CD',
      trigger: 'GIT_PUSH',
      stages: [
        { name: 'Install', type: 'BUILD', commands: ['npm install'], timeout: 300 },
        { name: 'Lint', type: 'CODE_ANALYSIS', commands: ['npm run lint'], timeout: 120 },
        { name: 'Test', type: 'TEST', commands: ['npm test'], timeout: 300 },
        { name: 'Build', type: 'BUILD', commands: ['npm run build'], timeout: 600 },
        { name: 'Deploy', type: 'DEPLOY', commands: ['echo Deploying...'], timeout: 300 }
      ]
    }
  ];

  for (const p of pipelines) {
    const existing = await prisma.pipeline.findFirst({
      where: { name: p.name, projectId: project.id }
    });

    if (!existing) {
      await prisma.pipeline.create({
        data: {
          projectId: project.id,
          name: p.name,
          trigger: p.trigger as any,
          stages: JSON.stringify(p.stages),
          status: 'IDLE',
          isActive: true,
        }
      });
      console.log(` Created: ${p.name}`);
    }
  }

  console.log('\n<‰ Done! Visit http://localhost:3030/pipelines\n');
}

main().finally(() => prisma.$disconnect());
