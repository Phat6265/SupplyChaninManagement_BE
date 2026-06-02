import { Router, Request, Response } from 'express';
import { analyticsController } from '../controllers/AnalyticsController';
import { staffUp } from '../middleware/rbac';

const router = Router();

// ── Analytics: admin, manager, staff (driver không cần báo cáo kinh doanh) ───
router.get('/inventory', staffUp, (req: Request, res: Response) => analyticsController.getInventoryAnalytics(req, res));
router.get('/shipment', staffUp, (req: Request, res: Response) => analyticsController.getShipmentAnalytics(req, res));
router.get('/dashboard', staffUp, (req: Request, res: Response) => analyticsController.getDashboardMetrics(req, res));
router.get('/products/top-moving', staffUp, (req: Request, res: Response) => analyticsController.getTopMovingProducts(req, res));
router.get('/monthly-stats', staffUp, (req: Request, res: Response) => analyticsController.getMonthlyStats(req, res));

export default router;
