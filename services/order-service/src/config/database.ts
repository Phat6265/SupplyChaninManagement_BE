import mongoose, { Connection } from 'mongoose';
import { config } from './environment';

let connection: Connection | null = null;

export const connectDatabase = async (): Promise<Connection> => {
  if (connection) return connection;
  const conn = await mongoose.connect(config.mongodbUri);
  connection = conn.connection;
  console.log('✅ [order-service] MongoDB connected');
  return connection;
};
