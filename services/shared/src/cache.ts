import Redis from 'ioredis';

let redisClient: Redis | null = null;

/**
 * Initialize Redis connection.
 * Call once at service startup.
 */
export const initRedis = (url?: string): Redis => {
  if (redisClient) return redisClient;

  const redisUrl = url || process.env.REDIS_URL || 'redis://localhost:6379';
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 10) return null; // stop retrying after 10 attempts
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redisClient.on('connect', () => console.log('[cache] Redis connected'));
  redisClient.on('error', (err) => console.error('[cache] Redis error:', err.message));

  // connect in background — non-blocking
  redisClient.connect().catch(() => {});

  return redisClient;
};

/**
 * Get a cached value by key.
 * Returns null if not found or Redis is unavailable.
 */
export const cacheGet = async <T = any>(key: string): Promise<T | null> => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

/**
 * Set a value in cache with TTL (in seconds).
 * Default TTL: 300 seconds (5 minutes).
 */
export const cacheSet = async (key: string, value: any, ttlSeconds: number = 300): Promise<void> => {
  if (!redisClient) return;
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Cache set failure is non-critical
  }
};

/**
 * Delete a specific cache key.
 */
export const cacheDel = async (key: string): Promise<void> => {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch {}
};

/**
 * Delete all cache keys matching a pattern.
 * Example: invalidatePattern('products:*') removes all product cache entries.
 */
export const cacheInvalidatePattern = async (pattern: string): Promise<void> => {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch {}
};

/**
 * Get the raw Redis client (for Socket.IO adapter, pub/sub, etc.)
 */
export const getRedisClient = (): Redis | null => redisClient;
