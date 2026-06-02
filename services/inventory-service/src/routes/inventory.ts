import { Router } from 'express';
import { Request, Response } from 'express';
import { inventoryController } from '../controllers/InventoryController';
import { staffUp, managerUp } from '../middleware/rbac';

const router = Router();

// ── WRITE: nhập/xuất kho — admin, manager, staff ──────────────────────────────
// Driver không thao tác kho trực tiếp
router.post('/import', staffUp, (req: Request, res: Response) => inventoryController.importStock(req, res));
router.post('/export', staffUp, (req: Request, res: Response) => inventoryController.exportStock(req, res));

// ── ADJUST: chỉ admin và manager (điều chỉnh tồn kho cần quyền cao hơn) ───────
router.post('/adjust', managerUp, (req: Request, res: Response) => inventoryController.adjustStock(req, res));

// ── READ: admin, manager, staff (driver không cần xem logs kho) ───────────────
router.get('/logs', staffUp, (req: Request, res: Response) => inventoryController.getInventoryLogs(req, res));
router.get('/warehouse/:warehouseId', staffUp, (req: Request, res: Response) => inventoryController.getWarehouseInventory(req, res));

export default router;
