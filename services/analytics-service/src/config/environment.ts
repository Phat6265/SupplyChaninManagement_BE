import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3007'),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:8080').split(','),

  // Downstream service URLs for data aggregation
  productServiceUrl: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  inventoryServiceUrl: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3003',
  orderServiceUrl: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
  shipmentServiceUrl: process.env.SHIPMENT_SERVICE_URL || 'http://localhost:3005',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
};
