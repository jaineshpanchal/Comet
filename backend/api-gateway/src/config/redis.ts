// Redis configuration
import Redis from 'ioredis';

// Redis client instance
let redisClient: Redis | null = null;
let redisEnabled = process.env.REDIS_ENABLED !== 'false'; // Disable Redis if explicitly set to false

// Redis configuration options
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 1, // Reduced retries
  lazyConnect: true,
  connectTimeout: 2000, // Faster timeout
  commandTimeout: 2000,
  retryStrategy: () => null, // Don't retry connections
  enableOfflineQueue: false, // Don't queue commands when offline
};

// Create Redis client
export const createRedisClient = (): Redis | null => {
  if (!redisEnabled) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(redisConfig);

    // Suppress all error logging
    redisClient.on('connect', () => {
      // Silent
    });

    redisClient.on('error', () => {
      // Silent - no logging
    });

    redisClient.on('ready', () => {
      // Silent
    });

    redisClient.on('close', () => {
      // Silent
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      if (redisClient) {
        try {
          await redisClient.quit();
        } catch (e) {
          // Silent
        }
      }
      process.exit(0);
    });
  }

  return redisClient;
};

// Export Redis instance
export const redis = createRedisClient();

// Redis utility functions (with graceful fallback if Redis is unavailable)
export const setCache = async (key: string, value: any, expireInSeconds?: number): Promise<void> => {
  if (!redis) return; // Redis disabled
  try {
    const serializedValue = JSON.stringify(value);
    if (expireInSeconds) {
      await redis.setex(key, expireInSeconds, serializedValue);
    } else {
      await redis.set(key, serializedValue);
    }
  } catch (error) {
    // Silently fail if Redis is unavailable (development mode)
    // In production, you'd want to handle this differently
  }
};

export const getCache = async (key: string): Promise<any> => {
  if (!redis) return null; // Redis disabled
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  if (!redis) return; // Redis disabled
  try {
    await redis.del(key);
  } catch (error) {
    // Silently fail if Redis is unavailable (development mode)
  }
};

export const setCacheWithPattern = async (pattern: string, data: Record<string, any>, expireInSeconds?: number): Promise<void> => {
  if (!redis) return; // Redis disabled
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
    // Silently fail if Redis is unavailable (development mode)
  }
};

export const getCacheByPattern = async (pattern: string): Promise<Record<string, any>> => {
  if (!redis) return {}; // Redis disabled
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
    return {};
  }
};

// Redis health check
export const checkRedisConnection = async (): Promise<boolean> => {
  if (!redis) return false; // Redis disabled
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    return false;
  }
};