import { Router, Request, Response } from 'express';
import { notificationController } from '../controllers/NotificationController';
import { allRoles } from '../middleware/rbac';

const router = Router();

// ── Tất cả role đều nhận và đọc thông báo của mình ───────────────────────────
router.get('/', allRoles, (req: Request, res: Response) => notificationController.getMyNotifications(req, res));
router.patch('/:id/read', allRoles, (req: Request, res: Response) => notificationController.markAsRead(req, res));
router.patch('/read-all', allRoles, (req: Request, res: Response) => notificationController.markAllAsRead(req, res));

// ── Internal: không cần auth (chỉ gọi từ nội bộ service-to-service) ──────────
router.post('/internal', (req: Request, res: Response) => notificationController.createInternal(req, res));

export default router;
