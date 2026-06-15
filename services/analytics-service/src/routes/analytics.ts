import { Router, Request, Response } from 'express';
import { analyticsController } from '../controllers/AnalyticsController';
import { staffUp } from '../middleware/rbac';

const router = Router();

<<<<<<< Updated upstream
// ── Analytics: admin, manager, staff (driver không cần báo cáo kinh doanh) ───
router.get('/inventory', staffUp, (req: Request, res: Response) => analyticsController.getInventoryAnalytics(req, res));
router.get('/shipment', staffUp, (req: Request, res: Response) => analyticsController.getShipmentAnalytics(req, res));
router.get('/dashboard', staffUp, (req: Request, res: Response) => analyticsController.getDashboardMetrics(req, res));
router.get('/products/top-moving', staffUp, (req: Request, res: Response) => analyticsController.getTopMovingProducts(req, res));
router.get('/monthly-stats', staffUp, (req: Request, res: Response) => analyticsController.getMonthlyStats(req, res));
=======
// ── Routes matching original backend analytics.ts exactly ─────────────────────
router.get('/inventory', (req: Request, res: Response) => analyticsController.getInventoryAnalytics(req, res));
router.get('/shipment', (req: Request, res: Response) => analyticsController.getShipmentAnalytics(req, res));
router.get('/dashboard', (req: Request, res: Response) => analyticsController.getDashboardMetrics(req, res));
router.get('/products/top-moving', (req: Request, res: Response) => analyticsController.getTopMovingProducts(req, res));

// ✅ Added missing endpoint — matches original backend
router.get('/monthly-stats', (req: Request, res: Response) => analyticsController.getMonthlyStats(req, res));
router.get('/inventory-valuation', (req: Request, res: Response) => analyticsController.getInventoryValuation(req, res));
>>>>>>> Stashed changes

export default router;
