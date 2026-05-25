import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3006'),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sw_notification',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:8080,http://localhost:8081').split(','),
};
