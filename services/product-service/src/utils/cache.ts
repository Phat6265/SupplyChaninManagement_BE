import Redis from 'ioredis';

let redisClient: Redis | null = null;

export const initRedis = (url?: string): Redis => {
  if (redisClient) return redisClient;
  const redisUrl = url || process.env.REDIS_URL || 'redis://localhost:6379';
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 10) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });
  redisClient.on('connect', () => console.log('[cache] Redis connected'));
  redisClient.on('error', (err) => console.error('[cache] Redis error:', err.message));
  redisClient.connect().catch(() => {});
  return redisClient;
};

export const cacheGet = async <T = any>(key: string): Promise<T | null> => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

export const cacheSet = async (key: string, value: any, ttlSeconds: number = 300): Promise<void> => {
  if (!redisClient) return;
  try { await redisClient.setex(key, ttlSeconds, JSON.stringify(value)); } catch {}
};

export const cacheDel = async (key: string): Promise<void> => {
  if (!redisClient) return;
  try { await redisClient.del(key); } catch {}
};

export const cacheInvalidatePattern = async (pattern: string): Promise<void> => {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(...keys);
  } catch {}
};
