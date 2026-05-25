import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3004'),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sw_order',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:8080').split(','),

  // Inter-service URLs
  inventoryServiceUrl: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3003',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
};
