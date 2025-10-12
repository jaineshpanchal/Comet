// Redis configuration
import Redis from 'ioredis';

// Redis client instance
let redisClient: Redis | null = null;

// Redis configuration options
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// Create Redis client
export const createRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(redisConfig);

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });

    redisClient.on('ready', () => {
      console.log('🚀 Redis is ready to accept commands');
    });

    redisClient.on('close', () => {
      console.log('📦 Redis connection closed');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      if (redisClient) {
        await redisClient.quit();
      }
      process.exit(0);
    });
  }

  return redisClient;
};

// Export Redis instance
export const redis = createRedisClient();

// Redis utility functions
export const setCache = async (key: string, value: any, expireInSeconds?: number): Promise<void> => {
  try {
    const serializedValue = JSON.stringify(value);
    if (expireInSeconds) {
      await redis.setex(key, expireInSeconds, serializedValue);
    } else {
      await redis.set(key, serializedValue);
    }
  } catch (error) {
    console.error('Redis set error:', error);
    throw error;
  }
};

export const getCache = async (key: string): Promise<any> => {
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
    throw error;
  }
};

export const setCacheWithPattern = async (pattern: string, data: Record<string, any>, expireInSeconds?: number): Promise<void> => {
  try {
    const pipeline = redis.pipeline();
    
    Object.entries(data).forEach(([key, value]) => {
      const fullKey = `${pattern}:${key}`;
      const serializedValue = JSON.stringify(value);
      if (expireInSeconds) {
        pipeline.setex(fullKey, expireInSeconds, serializedValue);
      } else {
        pipeline.set(fullKey, serializedValue);
      }
    });

    await pipeline.exec();
  } catch (error) {
    console.error('Redis pattern set error:', error);
    throw error;
  }
};

export const getCacheByPattern = async (pattern: string): Promise<Record<string, any>> => {
  try {
    const keys = await redis.keys(`${pattern}:*`);
    if (keys.length === 0) return {};

    const values = await redis.mget(keys);
    const result: Record<string, any> = {};

    keys.forEach((key, index) => {
      const shortKey = key.replace(`${pattern}:`, '');
      const value = values[index];
      result[shortKey] = value ? JSON.parse(value) : null;
    });

    return result;
  } catch (error) {
    console.error('Redis pattern get error:', error);
    return {};
  }
};

// Redis health check
export const checkRedisConnection = async (): Promise<boolean> => {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
};