import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const loadKey = (envPath: string, fallbackPath: string): string => {
  const keyPath = process.env[envPath] || fallbackPath;
  const resolved = path.resolve(keyPath);
  if (!fs.existsSync(resolved)) {
    console.warn(`⚠️  Key file not found at ${resolved}. Run: npm run generate-keys`);
    return '';
  }
  return fs.readFileSync(resolved, 'utf8');
};

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sw_auth',

  // RSA Keys (loaded at startup)
  rsaPrivateKey: loadKey('RSA_PRIVATE_KEY_PATH', './keys/private.pem'),
  rsaPublicKey: loadKey('RSA_PUBLIC_KEY_PATH', './keys/public.pem'),

  // JWT
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',

  // CORS
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:8080').split(','),
};
