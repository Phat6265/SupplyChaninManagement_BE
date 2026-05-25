import jwt from 'jsonwebtoken';
import axios from 'axios';
import { config } from '../config/environment';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

let cachedPublicKey = config.rsaPublicKey;

/**
 * Fetches the RSA public key from auth-service if not already cached.
 */
export const fetchPublicKey = async (): Promise<string> => {
  if (cachedPublicKey) return cachedPublicKey;

  try {
    const response = await axios.get(`${config.authServiceUrl}/api/auth/public-key`, {
      timeout: 5000,
    });
    cachedPublicKey = response.data as string;
    console.log('✅ [api-gateway] RSA public key fetched from auth-service');
    return cachedPublicKey;
  } catch (error) {
    throw new Error('Failed to fetch RSA public key from auth-service');
  }
};

/**
 * Verifies a JWT using the cached RSA public key (RS256).
 */
export const verifyToken = async (token: string): Promise<JwtPayload> => {
  const publicKey = await fetchPublicKey();
  try {
    return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;
  } catch {
    throw new Error('Invalid or expired token');
  }
};
