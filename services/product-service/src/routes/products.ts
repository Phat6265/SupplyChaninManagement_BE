import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { productController } from '../controllers/ProductController';
import { staffUp, managerUp, adminOnly } from '../middleware/rbac';

const router = Router();

<<<<<<< Updated upstream
=======
// ── File upload config ───────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed (jpg, png, webp, gif)'));
  },
});

// ── Input validator (matches original backend createProductValidator)
>>>>>>> Stashed changes
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

// ── Image upload ─────────────────────────────────────────────────────────────
router.post('/:id/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided' });
      return;
    }
    const imageUrl = `/uploads/products/${req.file.filename}`;
    const { productService } = await import('../services/ProductService');
    const product = await productService.updateProduct(req.params.id, { imageUrl });
    res.json({ success: true, message: 'Image uploaded', data: { imageUrl, product } });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});

export default router;
