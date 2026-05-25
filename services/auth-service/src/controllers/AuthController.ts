import { Request, Response } from 'express';
import { authService } from '../services/AuthService';
import { sendSuccess, sendError, AppError } from '../utils/response';
import { signToken, getPublicKey } from '../utils/rsa';
import { AuthenticatedRequest } from '../middlewares/auth';
import { UserRole } from '../models/User';

export class AuthController {
  /** POST /api/auth/register — Admin only */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const user = await authService.register(req.body);
      sendSuccess(res, user, 'User registered successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 400);
    }
  }

  /** POST /api/auth/login */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const user = await authService.login(email, password);

      const payload = {
        userId: (user as any)._id.toString(),
        email: user.email,
        role: user.role,
      };

      const tokens = {
        accessToken: signToken(payload, false),
        refreshToken: signToken(payload, true),
      };

      sendSuccess(res, { user, ...tokens }, 'Login successful');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 401);
    }
  }

  /** POST /api/auth/refresh-token */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        sendError(res, 'Refresh token is required', 400);
        return;
      }
      // verifyToken will throw if expired/invalid
      const { verifyToken } = await import('../utils/rsa');
      const payload = verifyToken(refreshToken);
      const accessToken = signToken({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      });
      sendSuccess(res, { accessToken }, 'Token refreshed');
    } catch (error: any) {
      sendError(res, error.message, 401);
    }
  }

  /** GET /api/auth/profile */
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { sendError(res, 'Not authenticated', 401); return; }
      const user = await authService.getUserById(req.user.userId);
      sendSuccess(res, user, 'Profile retrieved');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 400);
    }
  }

  /** PUT /api/auth/profile */
  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { sendError(res, 'Not authenticated', 401); return; }
      const { firstName, lastName, phone } = req.body;
      const user = await authService.updateUser(req.user.userId, { firstName, lastName, phone });
      sendSuccess(res, user, 'Profile updated');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 400);
    }
  }

  /** PUT /api/auth/change-password */
  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) { sendError(res, 'Not authenticated', 401); return; }
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        sendError(res, 'currentPassword and newPassword are required', 400);
        return;
      }
      if (newPassword.length < 6) {
        sendError(res, 'New password must be at least 6 characters', 400);
        return;
      }
      const result = await authService.changePassword(req.user.userId, currentPassword, newPassword);
      sendSuccess(res, result, 'Password changed successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 400);
    }
  }

  /** GET /api/auth/users — Admin only, with filters role/search/isActive (matches original UserController.getAllUsers) */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // ✅ Filters — matches original backend UserController.getAllUsers
      const filters: any = {};
      if (req.query.role) filters.role = req.query.role;
      if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
      if (req.query.search) filters.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];

      const [users, total] = await Promise.all([
        authService.getAllUsersFiltered(filters, skip, limit),
        authService.countUsersFiltered(filters),
      ]);
      sendSuccess(res, { data: users, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }, 'Users retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  /** GET /api/auth/users/:id — Admin only */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const user = await authService.getUserById(req.params.id);
      sendSuccess(res, user, 'User retrieved successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 404);
    }
  }

  /** POST /api/auth/users — Admin creates user directly */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await authService.register(req.body);
      sendSuccess(res, user, 'User created successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 400);
    }
  }

  /** PUT /api/auth/users/:id — Admin updates any user */
  async updateUserById(req: Request, res: Response): Promise<void> {
    try {
      const user = await authService.updateUser(req.params.id, req.body);
      sendSuccess(res, user, 'User updated successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 400);
    }
  }

  /** PATCH /api/auth/users/:id/deactivate — Soft-delete (matches original backend) */
  async deactivateUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await authService.changeUserStatus(req.params.id, false);
      sendSuccess(res, user, 'User deactivated successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 400);
    }
  }

  /** PATCH /api/auth/users/:id/activate */
  async activateUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await authService.changeUserStatus(req.params.id, true);
      sendSuccess(res, user, 'User activated successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 400);
    }
  }

  /** DELETE /api/auth/users/:id — Hard delete (Admin) */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.deleteUser(req.params.id);
      sendSuccess(res, result, 'User deleted');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 400);
    }
  }

  /** GET /api/auth/public-key — Returns RSA public key for other services */
  getPublicKeyEndpoint(_req: Request, res: Response): void {
    const key = getPublicKey();
    if (!key) {
      sendError(res, 'Public key not available', 500);
      return;
    }
    res.type('text/plain').send(key);
  }
}

export const authController = new AuthController();
