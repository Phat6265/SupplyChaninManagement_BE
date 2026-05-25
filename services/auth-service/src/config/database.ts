import mongoose, { Connection } from 'mongoose';
import { config } from './environment';

let connection: Connection | null = null;

export const connectDatabase = async (): Promise<Connection> => {
  if (connection) return connection;

  try {
    const mongooseConn = await mongoose.connect(config.mongodbUri);
    connection = mongooseConn.connection;
    console.log('✅ [auth-service] MongoDB connected:', config.mongodbUri);
    return connection;
  } catch (error) {
    console.error('❌ [auth-service] MongoDB connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (connection) {
    await mongoose.disconnect();
    connection = null;
  }
};
