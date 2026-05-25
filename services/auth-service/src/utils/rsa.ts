import jwt from 'jsonwebtoken';
import { config } from '../config/environment';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Sign a JWT using the RSA-256 private key.
 * Only the Auth Service has the private key — no other service can forge tokens.
 */
export const signToken = (payload: JwtPayload, isRefresh = false): string => {
  if (!config.rsaPrivateKey) {
    throw new Error('RSA private key not loaded. Run: npm run generate-keys');
  }
  const expiresIn = isRefresh ? config.jwtRefreshExpire : config.jwtExpire;
  return jwt.sign(payload, config.rsaPrivateKey, {
    algorithm: 'RS256' as const,
    expiresIn: expiresIn as any,
  });
};

/**
 * Verify a JWT using the RSA-256 public key.
 */
export const verifyToken = (token: string): JwtPayload => {
  if (!config.rsaPublicKey) {
    throw new Error('RSA public key not loaded.');
  }
  try {
    return jwt.verify(token, config.rsaPublicKey, { algorithms: ['RS256'] }) as JwtPayload;
  } catch {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Expose the public key as a PEM string (for the /public-key endpoint).
 */
export const getPublicKey = (): string => config.rsaPublicKey;
