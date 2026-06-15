import { Router, Request, Response } from 'express';
import { ProductVariant } from '../models/ProductVariant';

const router = Router();

const ok = (res: Response, data: any, msg = 'Success', code = 200) =>
  res.status(code).json({ success: true, message: msg, data, timestamp: new Date().toISOString() });
const err = (res: Response, msg: string, code = 400) =>
  res.status(code).json({ success: false, message: msg, timestamp: new Date().toISOString() });

// GET /products/:productId/variants — List variants for a product
router.get('/:productId/variants', async (req: Request, res: Response) => {
  try {
    const variants = await ProductVariant.find({ productId: req.params.productId, isActive: true }).sort({ createdAt: -1 });
    ok(res, variants);
  } catch (e: any) { err(res, e.message, 500); }
});

// GET /products/variants/:id — Get variant by id
router.get('/variants/:id', async (req: Request, res: Response) => {
  try {
    const variant = await ProductVariant.findById(req.params.id);
    if (!variant) { err(res, 'Variant not found', 404); return; }
    ok(res, variant);
  } catch (e: any) { err(res, e.message, 500); }
});

// POST /products/:productId/variants — Create variant
router.post('/:productId/variants', async (req: Request, res: Response) => {
  try {
    const { variantName, sku, barcode, attributes, price } = req.body;
    if (!variantName || !sku) { err(res, 'variantName and sku are required'); return; }

    const variant = await ProductVariant.create({
      productId: req.params.productId,
      variantName,
      sku,
      barcode,
      attributes: attributes || {},
      price,
    });
    ok(res, variant, 'Variant created', 201);
  } catch (e: any) { err(res, e.message); }
});

// PUT /products/variants/:id — Update variant
router.put('/variants/:id', async (req: Request, res: Response) => {
  try {
    const variant = await ProductVariant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!variant) { err(res, 'Variant not found', 404); return; }
    ok(res, variant, 'Variant updated');
  } catch (e: any) { err(res, e.message); }
});

// DELETE /products/variants/:id — Soft delete variant
router.delete('/variants/:id', async (req: Request, res: Response) => {
  try {
    const variant = await ProductVariant.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!variant) { err(res, 'Variant not found', 404); return; }
    ok(res, variant, 'Variant deleted');
  } catch (e: any) { err(res, e.message, 500); }
});

export default router;
