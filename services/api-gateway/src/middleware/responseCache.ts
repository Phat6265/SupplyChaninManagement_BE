import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

let redis: Redis | null = null;

export const initGatewayCache = (): void => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 10) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
    keyPrefix: 'gw:',
  });
  redis.on('connect', () => console.log('[gateway-cache] Redis connected'));
  redis.on('error', (err) => console.error('[gateway-cache] Redis error:', err.message));
  redis.connect().catch(() => {});
};

/**
 * Cache GET responses at the gateway level.
 * Only caches successful (2xx) JSON responses.
 * TTL is configurable per route prefix.
 */
export const responseCacheMiddleware = (ttlSeconds: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET' || !redis) {
      next();
      return;
    }

    // Skip cache for authenticated user-specific data
    const userId = req.headers['x-user-id'] as string;
    const cacheKey = `${req.originalUrl}:${userId || 'anon'}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-TTL', String(ttlSeconds));
        res.json(parsed);
        return;
      }
    } catch {
      // Cache read failure — continue to proxy
    }

    // Intercept the response to cache it
    const originalJson = res.json.bind(res);
    res.json = (body: any): Response => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300 && body) {
        redis?.setex(cacheKey, ttlSeconds, JSON.stringify(body)).catch(() => {});
      }
      res.set('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate gateway cache for a given path prefix.
 * Called when write operations (POST/PUT/DELETE) go through the gateway.
 */
export const cacheInvalidationMiddleware = (pathPrefix: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && redis) {
      try {
        const keys = await redis.keys(`gw:${pathPrefix}*`);
        if (keys.length > 0) {
          // Remove the keyPrefix since keys already include it
          const cleanKeys = keys.map((k) => k.replace(/^gw:/, ''));
          await redis.del(...cleanKeys);
        }
      } catch {}
    }
    next();
  };
};
