import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import proxy from 'express-http-proxy';
import { config } from './config/environment';
import { verifyTokenMiddleware } from './middleware/verifyToken';
import { initGatewayCache, responseCacheMiddleware, cacheInvalidationMiddleware } from './middleware/responseCache';
import { fetchPublicKey } from './utils/rsa';
import { deepHealthCheck } from './utils/healthCheck';

const app = express();

// ── Core Middleware ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));

// ✅ Phase 4: Response Compression — reduces payload size by 60-80%
app.use(compression({
  level: 6,                // Balance between compression ratio and CPU
  threshold: 1024,         // Don't compress responses < 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// ── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

// ── Health Checks ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// ✅ Phase 4: Deep health check — probes all downstream services + Redis
app.get('/health/deep', deepHealthCheck);

// ── Auth routes (no token required — login, register, public-key) ────────────
app.use('/api/auth', proxy(config.authServiceUrl, {
  proxyReqPathResolver: (req) => req.baseUrl + req.url,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    const r = srcReq as express.Request & { headers: Record<string, any> };
    if (r.headers.authorization) {
      (proxyReqOpts as any).headers = {
        ...(proxyReqOpts as any).headers,
        authorization: r.headers.authorization,
      };
    }
    return proxyReqOpts;
  },
  proxyReqBodyDecorator: (bodyContent, srcReq) => {
    // Re-stringify the already-parsed JSON body
    if ((srcReq as any).body && typeof (srcReq as any).body === 'object') {
      return JSON.stringify((srcReq as any).body);
    }
    return bodyContent;
  },
  timeout: 15000,
}));

// ── Proxy Helper with Auth + Cache Invalidation ──────────────────────────────
const proxyWithAuth = (targetUrl: string, cachePrefix?: string) => {
  const middlewares: any[] = [verifyTokenMiddleware];

  // Add cache invalidation for write operations
  if (cachePrefix) {
    middlewares.push(cacheInvalidationMiddleware(cachePrefix));
  }

  middlewares.push(
    proxy(targetUrl, {
      proxyReqPathResolver: (req) => req.baseUrl + req.url,
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        const r = srcReq as express.Request & { headers: Record<string, any> };
        (proxyReqOpts as any).headers = {
          ...(proxyReqOpts as any).headers,
          'x-user-id': r.headers['x-user-id'],
          'x-user-email': r.headers['x-user-email'],
          'x-user-role': r.headers['x-user-role'],
        };
        return proxyReqOpts;
      },
      timeout: 15000, // 15s timeout for downstream services
    }),
  );

  return middlewares;
};

// ── Protected Routes ─────────────────────────────────────────────────────────
// Products — cached for 2 min at gateway
app.use('/api/products',
  verifyTokenMiddleware,
  responseCacheMiddleware(120),
  cacheInvalidationMiddleware('/api/products'),
  proxy(config.productServiceUrl, {
    proxyReqPathResolver: (req) => req.baseUrl + req.url,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      const r = srcReq as express.Request & { headers: Record<string, any> };
      (proxyReqOpts as any).headers = {
        ...(proxyReqOpts as any).headers,
        'x-user-id': r.headers['x-user-id'],
        'x-user-email': r.headers['x-user-email'],
        'x-user-role': r.headers['x-user-role'],
      };
      return proxyReqOpts;
    },
    timeout: 15000,
  }),
);

// Inventory & Warehouses — cached for 1 min
app.use('/api/inventory',
  verifyTokenMiddleware,
  responseCacheMiddleware(60),
  cacheInvalidationMiddleware('/api/inventory'),
  proxy(config.inventoryServiceUrl, {
    proxyReqPathResolver: (req) => req.baseUrl + req.url,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      const r = srcReq as express.Request & { headers: Record<string, any> };
      (proxyReqOpts as any).headers = {
        ...(proxyReqOpts as any).headers,
        'x-user-id': r.headers['x-user-id'],
        'x-user-email': r.headers['x-user-email'],
        'x-user-role': r.headers['x-user-role'],
      };
      return proxyReqOpts;
    },
    timeout: 15000,
  }),
);

app.use('/api/warehouses',      ...proxyWithAuth(config.inventoryServiceUrl, '/api/warehouses'));

// Stock Transfers
app.use('/api/stock-transfers', ...proxyWithAuth(config.inventoryServiceUrl));

// Inventory Counts (Stocktaking)
app.use('/api/inventory-counts', ...proxyWithAuth(config.inventoryServiceUrl));

// Orders — no gateway cache (frequently changing)
app.use('/api/customers',       ...proxyWithAuth(config.orderServiceUrl));
app.use('/api/suppliers',       ...proxyWithAuth(config.orderServiceUrl));
app.use('/api/purchase-orders', ...proxyWithAuth(config.orderServiceUrl));
app.use('/api/sales-orders',    ...proxyWithAuth(config.orderServiceUrl));

// Shipments — no gateway cache (real-time tracking)
app.use('/api/shipments',       ...proxyWithAuth(config.shipmentServiceUrl));

// Categories — same service as products
app.use('/api/categories',      ...proxyWithAuth(config.productServiceUrl, '/api/categories'));

// Returns — part of order-service
app.use('/api/returns',         ...proxyWithAuth(config.orderServiceUrl));

// Purchase Requisitions — part of order-service
app.use('/api/requisitions',    ...proxyWithAuth(config.orderServiceUrl));

// Audit Logs — part of auth-service
app.use('/api/audit-logs', proxy(config.authServiceUrl, {
  proxyReqPathResolver: (req) => req.baseUrl + req.url,
}));

// Notifications — no cache (user-specific)
app.use('/api/notifications',   ...proxyWithAuth(config.notificationServiceUrl));

// Analytics — cached for 5 min at gateway
app.use('/api/analytics',
  verifyTokenMiddleware,
  responseCacheMiddleware(300),
  proxy(config.analyticsServiceUrl, {
    proxyReqPathResolver: (req) => req.baseUrl + req.url,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      const r = srcReq as express.Request & { headers: Record<string, any> };
      (proxyReqOpts as any).headers = {
        ...(proxyReqOpts as any).headers,
        'x-user-id': r.headers['x-user-id'],
        'x-user-email': r.headers['x-user-email'],
        'x-user-role': r.headers['x-user-role'],
      };
      return proxyReqOpts;
    },
    timeout: 15000,
  }),
);

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const startGateway = async () => {
  try {
    await fetchPublicKey();
  } catch (err) {
    console.warn('⚠️  Could not fetch RSA public key on startup — will retry per request');
  }

  // ✅ Phase 4: Init gateway-level Redis cache
  initGatewayCache();

  app.listen(config.port, () => {
    console.log(`✅ [api-gateway] Running on port ${config.port}`);
    console.log(`🗜️  Compression enabled (gzip/deflate)`);
    console.log(`🛡️  Circuit breakers active`);
    console.log(`📦  Gateway response cache enabled (Redis)`);
    console.log(`📡 Routes:`);
    console.log(`   /api/auth         → ${config.authServiceUrl}`);
    console.log(`   /api/products     → ${config.productServiceUrl} [cached 2min]`);
    console.log(`   /api/inventory    → ${config.inventoryServiceUrl} [cached 1min]`);
    console.log(`   /api/orders       → ${config.orderServiceUrl}`);
    console.log(`   /api/shipments    → ${config.shipmentServiceUrl}`);
    console.log(`   /api/notifications → ${config.notificationServiceUrl}`);
    console.log(`   /api/analytics    → ${config.analyticsServiceUrl} [cached 5min]`);
    console.log(`   /health/deep      → all services probe`);
  });
};

startGateway();

export default app;
