/**
 * Role-Based Access Control middleware
 * Reads x-user-role header forwarded by API Gateway (JWT already verified upstream)
 */
import { Request, Response, NextFunction } from 'express';

export type UserRole = 'admin' | 'warehouse_manager' | 'staff' | 'driver';

const sendForbidden = (res: Response, role: string, action: string) => {
  res.status(403).json({
    success: false,
    message: `Access denied: role '${role}' is not allowed to ${action}`,
  });
};

/**
 * Require one of the specified roles.
 * Usage: requireRole(['admin', 'warehouse_manager'])
 */
export const requireRole = (allowedRoles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const role = (req.headers['x-user-role'] as string) || '';
    if (!role) {
      res.status(401).json({ success: false, message: 'Unauthorized: missing role' });
      return;
    }
    if (!allowedRoles.includes(role as UserRole)) {
      sendForbidden(res, role, `perform this action (requires: ${allowedRoles.join(', ')})`);
      return;
    }
    next();
  };

// ── Convenience shorthands ────────────────────────────────────────────────────

/** Admin only */
export const adminOnly = requireRole(['admin']);

/** Admin + Warehouse Manager */
export const managerUp = requireRole(['admin', 'warehouse_manager']);

/** Admin + Warehouse Manager + Staff (everyone except driver) */
export const staffUp = requireRole(['admin', 'warehouse_manager', 'staff']);

/** All authenticated roles */
export const allRoles = requireRole(['admin', 'warehouse_manager', 'staff', 'driver']);
