import { Request, Response } from 'express';
import mongoose from 'mongoose';

/**
 * Enhanced health check that reports MongoDB and Redis connection status.
 * Used by all microservices.
 */
export const deepHealthHandler = (serviceName: string) => {
  return async (_req: Request, res: Response): Promise<void> => {
    const mongoState = mongoose.connection.readyState;
    const mongoStates: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    let redisOk = false;
    try {
      // Check if Redis is accessible via the cached client
      const Redis = require('ioredis');
      const r = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { connectTimeout: 2000 });
      await r.ping();
      redisOk = true;
      r.disconnect();
    } catch {
      // Redis unavailable — non-critical
    }

    const healthy = mongoState === 1;

    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'healthy' : 'degraded',
      service: serviceName,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies: {
        mongodb: mongoStates[mongoState] || 'unknown',
        redis: redisOk ? 'connected' : 'unavailable',
      },
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      },
    });
  };
};
