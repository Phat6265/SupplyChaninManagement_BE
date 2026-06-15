import { Router, Request, Response } from 'express';
import { notificationController } from '../controllers/NotificationController';

const router = Router();

// ── Routes matching original backend notifications.ts exactly ──────────────────
router.get('/', (req: Request, res: Response) => notificationController.getMyNotifications(req, res));

// ✅ Fix: original uses /read-all not /mark-all-read
router.patch('/:id/read', (req: Request, res: Response) => notificationController.markAsRead(req, res));
router.patch('/read-all', (req: Request, res: Response) => notificationController.markAllAsRead(req, res));
router.delete('/:id', (req: Request, res: Response) => notificationController.deleteNotification(req, res));

// Internal endpoint — no auth, only accessible from internal Docker network
router.post('/internal', (req: Request, res: Response) => notificationController.createInternal(req, res));

export default router;
