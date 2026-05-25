import { Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config/environment';
import { getCircuitBreakerStats } from '../middleware/circuitBreaker';

interface ServiceHealth {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'timeout';
  responseTimeMs?: number;
  error?: string;
}

/**
 * Deep health check — probes all downstream services and infrastructure.
 * Returns detailed health status for monitoring dashboards.
 */
export const deepHealthCheck = async (_req: Request, res: Response): Promise<void> => {
  const services = [
    { name: 'auth-service', url: config.authServiceUrl },
    { name: 'product-service', url: config.productServiceUrl },
    { name: 'inventory-service', url: config.inventoryServiceUrl },
    { name: 'order-service', url: config.orderServiceUrl },
    { name: 'shipment-service', url: config.shipmentServiceUrl },
    { name: 'notification-service', url: config.notificationServiceUrl },
    { name: 'analytics-service', url: config.analyticsServiceUrl },
  ];

  const results: ServiceHealth[] = await Promise.all(
    services.map(async (svc): Promise<ServiceHealth> => {
      const start = Date.now();
      try {
        await axios.get(`${svc.url}/health`, { timeout: 5000 });
        return {
          name: svc.name,
          url: svc.url,
          status: 'healthy',
          responseTimeMs: Date.now() - start,
        };
      } catch (err: any) {
        const elapsed = Date.now() - start;
        return {
          name: svc.name,
          url: svc.url,
          status: elapsed >= 5000 ? 'timeout' : 'unhealthy',
          responseTimeMs: elapsed,
          error: err.message,
        };
      }
    })
  );

  // Check Redis
  let redisStatus: ServiceHealth = {
    name: 'redis',
    url: process.env.REDIS_URL || 'redis://redis:6379',
    status: 'unhealthy',
  };
  try {
    const Redis = require('ioredis');
    const r = new Redis(process.env.REDIS_URL || 'redis://redis:6379', { connectTimeout: 3000 });
    const start = Date.now();
    await r.ping();
    redisStatus = { ...redisStatus, status: 'healthy', responseTimeMs: Date.now() - start };
    r.disconnect();
  } catch (err: any) {
    redisStatus.error = err.message;
  }

  results.push(redisStatus);

  const allHealthy = results.every((r) => r.status === 'healthy');
  const circuitBreakers = getCircuitBreakerStats();

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    },
    services: results,
    circuitBreakers,
  });
};
