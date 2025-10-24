import { redis } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * Cache Service for Redis-based query result caching
 * Implements cache-aside pattern with TTL support
 */
export class CacheService {
  private static DEFAULT_TTL = 300; // 5 minutes in seconds

  /**
   * Generate a cache key with namespace
   */
  private static generateKey(namespace: string, identifier: string): string {
    return `cache:${namespace}:${identifier}`;
  }

  /**
   * Get cached data
   */
  static async get<T>(namespace: string, identifier: string): Promise<T | null> {
    try {
      const key = this.generateKey(namespace, identifier);
      const cached = await redis.get(key);

      if (!cached) {
        logger.debug('Cache miss', { namespace, identifier });
        return null;
      }

      logger.debug('Cache hit', { namespace, identifier });
      return JSON.parse(cached) as T;
    } catch (error: any) {
      logger.error('Cache get error', { error: error.message, namespace, identifier });
      return null; // Fail gracefully - return null on cache errors
    }
  }

  /**
   * Set cached data with TTL
   */
  static async set(
    namespace: string,
    identifier: string,
    data: any,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    try {
      const key = this.generateKey(namespace, identifier);
      await redis.setex(key, ttl, JSON.stringify(data));
      logger.debug('Cache set', { namespace, identifier, ttl });
    } catch (error: any) {
      logger.error('Cache set error', { error: error.message, namespace, identifier });
      // Fail gracefully - don't throw on cache errors
    }
  }

  /**
   * Delete cached data
   */
  static async delete(namespace: string, identifier: string): Promise<void> {
    try {
      const key = this.generateKey(namespace, identifier);
      await redis.del(key);
      logger.debug('Cache delete', { namespace, identifier });
    } catch (error: any) {
      logger.error('Cache delete error', { error: error.message, namespace, identifier });
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  static async deletePattern(namespace: string, pattern: string = '*'): Promise<void> {
    try {
      const searchPattern = `cache:${namespace}:${pattern}`;
      const keys = await redis.keys(searchPattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug('Cache pattern delete', { namespace, pattern, count: keys.length });
      }
    } catch (error: any) {
      logger.error('Cache pattern delete error', { error: error.message, namespace, pattern });
    }
  }

  /**
   * Invalidate all cache for a namespace
   */
  static async invalidateNamespace(namespace: string): Promise<void> {
    await this.deletePattern(namespace, '*');
  }

  /**
   * Cache-aside pattern: Get from cache or execute function and cache result
   */
  static async getOrSet<T>(
    namespace: string,
    identifier: string,
    fetchFunction: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(namespace, identifier);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - execute function
    const data = await fetchFunction();

    // Store in cache
    await this.set(namespace, identifier, data, ttl);

    return data;
  }

  /**
   * Cache with tags for grouped invalidation
   */
  static async setWithTags(
    namespace: string,
    identifier: string,
    data: any,
    tags: string[],
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    await this.set(namespace, identifier, data, ttl);

    // Store tag associations
    for (const tag of tags) {
      const tagKey = `cache:tags:${tag}`;
      const cacheKey = this.generateKey(namespace, identifier);
      await redis.sadd(tagKey, cacheKey);
      await redis.expire(tagKey, ttl + 60); // Tag expires slightly later
    }
  }

  /**
   * Invalidate all caches with a specific tag
   */
  static async invalidateByTag(tag: string): Promise<void> {
    try {
      const tagKey = `cache:tags:${tag}`;
      const cacheKeys = await redis.smembers(tagKey);

      if (cacheKeys.length > 0) {
        await redis.del(...cacheKeys);
        await redis.del(tagKey);
        logger.debug('Cache tag invalidation', { tag, count: cacheKeys.length });
      }
    } catch (error: any) {
      logger.error('Cache tag invalidation error', { error: error.message, tag });
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    totalKeys: number;
    namespaces: { [key: string]: number };
  }> {
    try {
      const allKeys = await redis.keys('cache:*');
      const namespaces: { [key: string]: number } = {};

      for (const key of allKeys) {
        const parts = key.split(':');
        if (parts.length >= 2) {
          const namespace = parts[1];
          namespaces[namespace] = (namespaces[namespace] || 0) + 1;
        }
      }

      return {
        totalKeys: allKeys.length,
        namespaces,
      };
    } catch (error: any) {
      logger.error('Cache stats error', { error: error.message });
      return { totalKeys: 0, namespaces: {} };
    }
  }

  /**
   * Clear all cache (use with caution!)
   */
  static async clearAll(): Promise<void> {
    try {
      const allKeys = await redis.keys('cache:*');
      if (allKeys.length > 0) {
        await redis.del(...allKeys);
        logger.warn('All cache cleared', { count: allKeys.length });
      }
    } catch (error: any) {
      logger.error('Cache clear all error', { error: error.message });
    }
  }
}

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  SHORT: 60,           // 1 minute - frequently changing data
  MEDIUM: 300,         // 5 minutes - default
  LONG: 1800,          // 30 minutes - stable data
  VERY_LONG: 3600,     // 1 hour - rarely changing data
  DAY: 86400,          // 24 hours - static data
};

/**
 * Cache namespaces for different data types
 */
export const CacheNamespace = {
  USER: 'user',
  PROJECT: 'project',
  PIPELINE: 'pipeline',
  PIPELINE_RUN: 'pipeline-run',
  TEST_SUITE: 'test-suite',
  TEST_RUN: 'test-run',
  DEPLOYMENT: 'deployment',
  INTEGRATION: 'integration',
  AUDIT_LOG: 'audit-log',
  METRICS: 'metrics',
  HEALTH: 'health',
};

/**
 * Helper function to generate list cache key
 */
export function generateListCacheKey(params: Record<string, any>): string {
  const sorted = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  return sorted || 'default';
}
