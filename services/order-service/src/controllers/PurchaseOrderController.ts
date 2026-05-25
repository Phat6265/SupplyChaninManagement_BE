import { Request, Response } from 'express';
import { purchaseOrderService } from '../services/PurchaseOrderService';
import { PurchaseOrderStatus } from '../models/PurchaseOrder';

const ok = (res: Response, data: any, msg = 'Success', code = 200) =>
  res.status(code).json({ success: true, message: msg, data, timestamp: new Date().toISOString() });
const err = (res: Response, msg: string, code = 400) =>
  res.status(code).json({ success: false, message: msg, timestamp: new Date().toISOString() });

export class PurchaseOrderController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { status, supplierId, warehouseId, page, limit } = req.query;
      const result = await purchaseOrderService.getAll(
        { status, supplierId, warehouseId },
        parseInt(page as string) || 1,
        parseInt(limit as string) || 20
      );
      ok(res, result);
    } catch (e: any) { err(res, e.message); }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try { ok(res, await purchaseOrderService.getById(req.params.id)); }
    catch (e: any) { err(res, e.message, 404); }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const order = await purchaseOrderService.create(req.body, userId);
      ok(res, order, 'Purchase Order created', 201);
    } catch (e: any) { err(res, e.message); }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { status } = req.body;
      if (!Object.values(PurchaseOrderStatus).includes(status)) {
        err(res, `Invalid status: ${status}`);
        return;
      }
      const order = await purchaseOrderService.updateStatus(req.params.id, status, userId);
      ok(res, order, 'Status updated');
    } catch (e: any) { err(res, e.message); }
  }
}

export const purchaseOrderController = new PurchaseOrderController();
