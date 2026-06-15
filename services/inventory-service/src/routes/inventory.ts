import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Request, Response } from 'express';
import { inventoryController } from '../controllers/InventoryController';

const router = Router();

// ── Routes matching original backend inventory.ts exactly ─────────────────────
router.post('/import', (req: Request, res: Response) => inventoryController.importStock(req, res));
router.post('/export', (req: Request, res: Response) => inventoryController.exportStock(req, res));
router.post('/adjust', (req: Request, res: Response) => inventoryController.adjustStock(req, res));

// ✅ Fix: original backend uses /logs not /
router.get('/logs', (req: Request, res: Response) => inventoryController.getInventoryLogs(req, res));
router.get('/low-stock', (req: Request, res: Response) => inventoryController.getLowStockAlerts(req, res));
router.get('/warehouse/:warehouseId', (req: Request, res: Response) => inventoryController.getWarehouseInventory(req, res));

export default router;
