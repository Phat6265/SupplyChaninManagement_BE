import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Request, Response } from 'express';
import { inventoryController } from '../controllers/InventoryController';

const router = Router();

// ── Validators (matches original backend createWarehouseValidator) ─────────────
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

// ── Routes matching original backend warehouses.ts exactly ────────────────────
router.post('/', createWarehouseValidator, validate, (req: Request, res: Response) => inventoryController.createWarehouse(req, res));

router.get('/', (req: Request, res: Response) => inventoryController.getAllWarehouses(req, res));
router.get('/:id/capacity', (req: Request, res: Response) => inventoryController.getWarehouseCapacity(req, res));
router.get('/:id', (req: Request, res: Response) => inventoryController.getWarehouseById(req, res));

router.put('/:id', (req: Request, res: Response) => inventoryController.updateWarehouse(req, res));
router.delete('/:id', (req: Request, res: Response) => inventoryController.deleteWarehouse(req, res));

export default router;
