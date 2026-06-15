import { Router, Request, Response } from 'express';
import { StockTransfer } from '../models/StockTransfer';
import { InventoryLog } from '../models/InventoryLog';
import { Warehouse } from '../models/Warehouse';

const router = Router();

const ok = (res: Response, data: any, msg = 'Success', code = 200) =>
  res.status(code).json({ success: true, message: msg, data, timestamp: new Date().toISOString() });
const err = (res: Response, msg: string, code = 400) =>
  res.status(code).json({ success: false, message: msg, timestamp: new Date().toISOString() });

// ── GET / — List all transfers (with status filter & pagination) ──────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      StockTransfer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      StockTransfer.countDocuments(filter),
    ]);

    ok(res, {
      data,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (e: any) {
    err(res, e.message, 500);
  }
});

// ── GET /:id — Get transfer by ID ────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id);
    if (!transfer) { err(res, 'Stock transfer not found', 404); return; }
    ok(res, transfer, 'Stock transfer retrieved');
  } catch (e: any) {
    err(res, e.message, 500);
  }
});

// ── POST / — Create a new stock transfer ─────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const createdBy = req.headers['x-user-id'] as string || req.headers['x-user-email'] as string;
    if (!createdBy) { err(res, 'User not authenticated', 401); return; }

    const { sourceWarehouseId, destinationWarehouseId, items, notes } = req.body;

    if (!sourceWarehouseId || !destinationWarehouseId) {
      err(res, 'Source and destination warehouse IDs are required'); return;
    }
    if (sourceWarehouseId === destinationWarehouseId) {
      err(res, 'Source and destination warehouses must be different'); return;
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      err(res, 'At least one item is required'); return;
    }

    // Generate transfer code
    const count = await StockTransfer.countDocuments();
    const transferCode = `TRF-${String(count + 1).padStart(6, '0')}`;

    const transfer = await StockTransfer.create({
      transferCode,
      sourceWarehouseId,
      destinationWarehouseId,
      items,
      notes,
      createdBy,
    });

    ok(res, transfer, 'Stock transfer created', 201);
  } catch (e: any) {
    err(res, e.message);
  }
});

// ── PATCH /:id/status — Update transfer status ───────────────────────────────
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || req.headers['x-user-email'] as string;
    if (!userId) { err(res, 'User not authenticated', 401); return; }

    const { status } = req.body;
    const validStatuses = ['approved', 'in_transit', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      err(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`); return;
    }

    const transfer = await StockTransfer.findById(req.params.id);
    if (!transfer) { err(res, 'Stock transfer not found', 404); return; }

    // Validate status transitions
    const allowedTransitions: Record<string, string[]> = {
      pending: ['approved', 'cancelled'],
      approved: ['in_transit', 'cancelled'],
      in_transit: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!allowedTransitions[transfer.status]?.includes(status)) {
      err(res, `Cannot transition from '${transfer.status}' to '${status}'`); return;
    }

    // Build update payload
    const updateData: any = { status };
    if (status === 'approved') {
      updateData.approvedBy = userId;
    }
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const updated = await StockTransfer.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // ── When completed: deduct from source, add to destination ──────────────
    if (status === 'completed' && updated) {
      for (const item of updated.items) {
        // Deduct from source warehouse
        await InventoryLog.create({
          productId: item.productId,
          warehouseId: updated.sourceWarehouseId,
          actionType: 'transfer',
          quantity: item.quantity,
          createdBy: userId,
          notes: `Transfer out to warehouse ${updated.destinationWarehouseId} - ${updated.transferCode}`,
        });
        await Warehouse.findByIdAndUpdate(updated.sourceWarehouseId, {
          $inc: { currentStock: -item.quantity },
        });

        // Add to destination warehouse
        await InventoryLog.create({
          productId: item.productId,
          warehouseId: updated.destinationWarehouseId,
          actionType: 'transfer',
          quantity: item.quantity,
          createdBy: userId,
          notes: `Transfer in from warehouse ${updated.sourceWarehouseId} - ${updated.transferCode}`,
        });
        await Warehouse.findByIdAndUpdate(updated.destinationWarehouseId, {
          $inc: { currentStock: item.quantity },
        });
      }
    }

    ok(res, updated, `Stock transfer ${status}`);
  } catch (e: any) {
    err(res, e.message, 500);
  }
});

export default router;
