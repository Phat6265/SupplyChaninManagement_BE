import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/rsa';

export interface GatewayRequest extends Request {
  user?: JwtPayload;
}

/**
 * Verifies the Bearer token (RS256) from Authorization header.
 * On success, attaches user payload to req.user and forwards
 * user info as X-User-* headers to downstream services.
 */
export const verifyTokenMiddleware = async (
  req: GatewayRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    req.user = payload;

    // Forward user info to downstream services via headers
    req.headers['x-user-id'] = payload.userId;
    req.headers['x-user-email'] = payload.email;
    req.headers['x-user-role'] = payload.role;

    next();
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message || 'Unauthorized' });
  }
};

/**
 * Optional: role-based access for gateway-level enforcement.
 */
export const requireRole = (allowedRoles: string[]) =>
  (req: GatewayRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };
