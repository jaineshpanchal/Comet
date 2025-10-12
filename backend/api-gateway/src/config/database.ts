// Database configuration
import { PrismaClient } from '@prisma/client';

// Global variable to store the Prisma client instance
let prisma: PrismaClient;

// Database connection configuration
export const createPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      datasources: {
        db: {
          url: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?schema=public`
        }
      }
    });

    // Handle process termination
    process.on('beforeExit', async () => {
      await prisma?.$disconnect();
    });

    process.on('SIGINT', async () => {
      await prisma?.$disconnect();
      process.exit(0);
    });
  }

  return prisma;
};

// Export the database instance
export const db = createPrismaClient();

// Database health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Database utilities
export const connectDatabase = async (): Promise<void> => {
  try {
    await db.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await db.$disconnect();
  console.log('📦 Database disconnected');
};