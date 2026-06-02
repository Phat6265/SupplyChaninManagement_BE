import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Request, Response } from 'express';
import { inventoryController } from '../controllers/InventoryController';
import { staffUp, managerUp, allRoles } from '../middleware/rbac';

const router = Router();

const createWarehouseValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
];

const validate = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    return;
  }
  next();
};

// ── READ: tất cả role (driver cần biết kho để nhận lô hàng) ──────────────────
router.get('/', allRoles, (req: Request, res: Response) => inventoryController.getAllWarehouses(req, res));
router.get('/:id', allRoles, (req: Request, res: Response) => inventoryController.getWarehouseById(req, res));

// ── CAPACITY: admin, manager, staff (quản lý kho) ────────────────────────────
router.get('/:id/capacity', staffUp, (req: Request, res: Response) => inventoryController.getWarehouseCapacity(req, res));

// ── CREATE/UPDATE: chỉ admin và manager (staff không tạo/sửa kho) ─────────────
router.post('/', managerUp, createWarehouseValidator, validate, (req: Request, res: Response) => inventoryController.createWarehouse(req, res));
router.put('/:id', managerUp, (req: Request, res: Response) => inventoryController.updateWarehouse(req, res));

// ── DELETE: chỉ admin ─────────────────────────────────────────────────────────
router.delete('/:id', managerUp, (req: Request, res: Response) => inventoryController.deleteWarehouse(req, res));

export default router;
