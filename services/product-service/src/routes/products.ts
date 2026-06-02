import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Request, Response } from 'express';
import { productController } from '../controllers/ProductController';
import { staffUp, managerUp, adminOnly } from '../middleware/rbac';

const router = Router();

const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('barcode').trim().notEmpty().withMessage('Barcode is required'),
  body('categoryId').notEmpty().withMessage('Category ID is required'),
];

const validate = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    return;
  }
  next();
};

// ── READ: admin, manager, staff, driver (tất cả cần xem sản phẩm) ─────────────
router.get('/', (req: Request, res: Response) => productController.getAllProducts(req, res));
router.get('/search', (req: Request, res: Response) => productController.searchProducts(req, res));
router.get('/sku/:sku', (req: Request, res: Response) => productController.getProductBySku(req, res));
router.get('/barcode/:barcode', (req: Request, res: Response) => productController.getProductByBarcode(req, res));
router.get('/:id', (req: Request, res: Response) => productController.getById(req, res));

// ── WRITE: admin, manager, staff (driver không quản lý sản phẩm) ──────────────
router.post('/', staffUp, createProductValidator, validate, (req: Request, res: Response) => productController.create(req, res));
router.put('/:id', staffUp, (req: Request, res: Response) => productController.update(req, res));

// ── DELETE: admin, manager, staff (driver không quản lý sản phẩm) ───────────
router.delete('/:id', staffUp, (req: Request, res: Response) => productController.delete(req, res));

export default router;
