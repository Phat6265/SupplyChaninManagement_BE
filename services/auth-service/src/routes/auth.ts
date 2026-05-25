import { Router, Request, Response } from 'express';
import { authController } from '../controllers/AuthController';
import { authMiddleware, roleMiddleware } from '../middlewares/auth';
import { body, validationResult } from 'express-validator';
import { UserRole } from '../models/User';

const router = Router();

const validate = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    return;
  }
  next();
};

const loginValidator = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

const registerValidator = [
  body('firstName').notEmpty().withMessage('First name required'),
  body('lastName').notEmpty().withMessage('Last name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(Object.values(UserRole)).withMessage('Invalid role'),
];

// ── Public ─────────────────────────────────────────────────────────────────
router.post('/login', loginValidator, validate, (req: Request, res: Response) => authController.login(req, res));
router.post('/refresh-token', (req: Request, res: Response) => authController.refreshToken(req, res));

/** Expose RSA public key so api-gateway can fetch it at startup */
router.get('/public-key', (req: Request, res: Response) => authController.getPublicKeyEndpoint(req, res));

/** Internal: user count for analytics (no auth required for service-to-service) */
router.get('/users/count', async (_req: Request, res: Response) => {
  try {
    const { authService } = await import('../services/AuthService');
    const total = await authService.countUsers();
    res.json({ success: true, data: { total } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Protected (admin registers new users) ──────────────────────────────────
router.post(
  '/register',
  authMiddleware,
  roleMiddleware([UserRole.ADMIN]),
  registerValidator,
  validate,
  (req: Request, res: Response) => authController.register(req, res)
);

router.get('/profile', authMiddleware, (req: Request, res: Response) =>
  authController.getProfile(req as any, res)
);
router.put('/profile', authMiddleware, (req: Request, res: Response) =>
  authController.updateProfile(req as any, res)
);
router.put('/change-password', authMiddleware, (req: Request, res: Response) =>
  authController.changePassword(req as any, res)
);

// ── Admin: user management (mirrors original /api/users routes) ──────────────
const adminOnly = [authMiddleware, roleMiddleware([UserRole.ADMIN])];

router.get('/users', ...adminOnly, (req: Request, res: Response) => authController.getAllUsers(req, res));
router.get('/users/:id', ...adminOnly, (req: Request, res: Response) => authController.getUserById(req, res));
router.post('/users', ...adminOnly, (req: Request, res: Response) => authController.createUser(req, res));
router.put('/users/:id', ...adminOnly, (req: Request, res: Response) => authController.updateUserById(req, res));
// Soft-delete: deactivate instead of hard delete — matches original backend
router.patch('/users/:id/deactivate', ...adminOnly, (req: Request, res: Response) => authController.deactivateUser(req, res));
router.patch('/users/:id/activate', ...adminOnly, (req: Request, res: Response) => authController.activateUser(req, res));
router.delete('/users/:id', ...adminOnly, (req: Request, res: Response) => authController.deactivateUser(req, res));

export default router;
