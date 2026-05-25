import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3003'),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sw_inventory',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:8080').split(','),
  productServiceUrl: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
};
