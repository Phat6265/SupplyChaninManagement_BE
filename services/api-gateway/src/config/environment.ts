import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8080'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Downstream service URLs
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  productServiceUrl: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  inventoryServiceUrl: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3003',
  orderServiceUrl: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
  shipmentServiceUrl: process.env.SHIPMENT_SERVICE_URL || 'http://localhost:3005',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
  analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3007',

  // RSA public key can be fetched from auth-service or set via env
  rsaPublicKey: process.env.RSA_PUBLIC_KEY || '',

  // CORS
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:8081').split(','),

  // Rate limit
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '1000'),
};
