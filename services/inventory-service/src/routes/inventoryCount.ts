import { Router, Request, Response } from 'express';
import { InventoryCount } from '../models/InventoryCount';
import { InventoryLog } from '../models/InventoryLog';

const router = Router();

const ok = (res: Response, data: any, msg = 'Success', code = 200) =>
  res.status(code).json({ success: true, message: msg, data, timestamp: new Date().toISOString() });
const err = (res: Response, msg: string, code = 400) =>
  res.status(code).json({ success: false, message: msg, timestamp: new Date().toISOString() });

// GET / — List all inventory counts
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, warehouseId, limit = '20', page = '1' } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (warehouseId) filter.warehouseId = warehouseId;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      InventoryCount.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      InventoryCount.countDocuments(filter),
    ]);

    ok(res, { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
  } catch (e: any) { err(res, e.message, 500); }
});

// GET /:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const count = await InventoryCount.findById(req.params.id);
    if (!count) { err(res, 'Not found', 404); return; }
    ok(res, count);
  } catch (e: any) { err(res, e.message, 500); }
});

// POST / — Create inventory count session
router.post('/', async (req: Request, res: Response) => {
  try {
    const createdBy = req.headers['x-user-id'] as string || req.headers['x-user-email'] as string || 'system';
    const { warehouseId, items, notes } = req.body;

    if (!warehouseId) { err(res, 'Warehouse ID is required'); return; }
    if (!items || !Array.isArray(items) || items.length === 0) { err(res, 'Items are required'); return; }

    // Auto-generate code
    const total = await InventoryCount.countDocuments();
    const countCode = `CNT-${String(total + 1).padStart(6, '0')}`;

    // Calculate differences
    const processedItems = items.map((item: any) => ({
      productId: item.productId,
      expectedQuantity: item.expectedQuantity || 0,
      actualQuantity: item.actualQuantity || 0,
      difference: (item.actualQuantity || 0) - (item.expectedQuantity || 0),
    }));

    const count = await InventoryCount.create({
      countCode,
      warehouseId,
      items: processedItems,
      notes,
      createdBy,
    });

    ok(res, count, 'Inventory count created', 201);
  } catch (e: any) { err(res, e.message); }
});

// PATCH /:id/complete — Complete the count and generate adjustment logs
router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.headers['x-user-email'] as string || 'system';
    const count = await InventoryCount.findById(req.params.id);
    if (!count) { err(res, 'Not found', 404); return; }
    if (count.status !== 'in_progress') { err(res, 'Count is not in progress'); return; }

    // Mark as completed
    count.status = 'completed';
    count.completedBy = userId;
    count.completedAt = new Date();
    await count.save();

    // Generate adjustment logs for items with differences
    for (const item of count.items) {
      if (item.difference !== 0) {
        await InventoryLog.create({
          productId: item.productId,
          warehouseId: count.warehouseId,
          actionType: 'adjustment',
          quantity: Math.abs(item.difference),
          previousQuantity: item.expectedQuantity,
          newQuantity: item.actualQuantity,
          createdBy: userId,
          notes: `Stocktake adjustment - ${count.countCode}. Difference: ${item.difference > 0 ? '+' : ''}${item.difference}`,
        });
      }
    }

    ok(res, count, 'Inventory count completed with adjustments');
  } catch (e: any) { err(res, e.message, 500); }
});

// PATCH /:id/cancel
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const count = await InventoryCount.findById(req.params.id);
    if (!count) { err(res, 'Not found', 404); return; }
    if (count.status !== 'in_progress') { err(res, 'Only in-progress counts can be cancelled'); return; }

    count.status = 'cancelled';
    await count.save();
    ok(res, count, 'Inventory count cancelled');
  } catch (e: any) { err(res, e.message, 500); }
});

export default router;
