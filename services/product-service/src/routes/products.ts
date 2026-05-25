import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Request, Response } from 'express';
import { productController } from '../controllers/ProductController';

const router = Router();

// ── Input validator (matches original backend createProductValidator)
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

// ── Routes matching original backend exactly ─────────────────────────────────
router.get('/', (req: Request, res: Response) => productController.getAllProducts(req, res));
router.get('/search', (req: Request, res: Response) => productController.searchProducts(req, res));
router.get('/sku/:sku', (req: Request, res: Response) => productController.getProductBySku(req, res));
router.get('/barcode/:barcode', (req: Request, res: Response) => productController.getProductByBarcode(req, res));
router.get('/:id', (req: Request, res: Response) => productController.getById(req, res));

router.post('/', createProductValidator, validate, (req: Request, res: Response) => productController.create(req, res));
router.put('/:id', (req: Request, res: Response) => productController.update(req, res));
router.delete('/:id', (req: Request, res: Response) => productController.delete(req, res));

export default router;
