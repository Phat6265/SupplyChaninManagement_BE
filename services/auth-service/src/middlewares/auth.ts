import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/rsa';
import { sendError } from '../utils/response';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload & { userId: string };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Missing or invalid authorization header', 401);
      return;
    }
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    req.user = { ...payload, userId: payload.userId };
    next();
  } catch (error) {
    sendError(res, 'Invalid or expired token', 401, error);
  }
};

export const roleMiddleware = (allowedRoles: string[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }
    next();
  };
