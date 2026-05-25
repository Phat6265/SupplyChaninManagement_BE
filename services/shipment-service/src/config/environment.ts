import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3005'),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sw_shipment',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:8080').split(','),
};
