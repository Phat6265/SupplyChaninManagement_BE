import { Request, Response } from 'express';
import { inventoryService } from '../services/InventoryService';
import { body, validationResult } from 'express-validator';

const ok = (res: Response, data: any, msg = 'Success', code = 200) =>
  res.status(code).json({ success: true, message: msg, data, timestamp: new Date().toISOString() });
const err = (res: Response, msg: string, code = 400) =>
  res.status(code).json({ success: false, message: msg, timestamp: new Date().toISOString() });

export class InventoryController {
  // ── Inventory Logs ─────────────────────────────────────────────────────────

  async getInventoryLogs(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const productId = req.query.productId as string;
      const warehouseId = req.query.warehouseId as string;

      const logs = await inventoryService.getInventoryLogs(productId, warehouseId, skip, limit);
      ok(res, { data: logs, page, limit });
    } catch (e: any) { err(res, e.message); }
  }

  async importStock(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) { err(res, 'User not authenticated', 401); return; }
      const log = await inventoryService.importStock({ ...req.body, createdBy: userId });
      ok(res, log, 'Stock imported', 201);
    } catch (e: any) { err(res, e.message); }
  }

  async exportStock(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) { err(res, 'User not authenticated', 401); return; }
      const log = await inventoryService.exportStock({ ...req.body, createdBy: userId });
      ok(res, log, 'Stock exported', 201);
    } catch (e: any) { err(res, e.message); }
  }

  async adjustStock(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) { err(res, 'User not authenticated', 401); return; }
      const log = await inventoryService.adjustStock({ ...req.body, createdBy: userId });
      ok(res, log, 'Stock adjusted', 201);
    } catch (e: any) { err(res, e.message); }
  }

  async getWarehouseInventory(req: Request, res: Response): Promise<void> {
    try {
      const inventory = await inventoryService.getWarehouseInventory(req.params.warehouseId);
      ok(res, inventory);
    } catch (e: any) { err(res, e.message); }
  }

  // ── Warehouse CRUD ─────────────────────────────────────────────────────────

  async getAllWarehouses(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      ok(res, { data: await inventoryService.getAllWarehouses(skip, limit), page, limit });
    } catch (e: any) { err(res, e.message); }
  }

  async getWarehouseById(req: Request, res: Response): Promise<void> {
    try {
      const w = await inventoryService.getWarehouseById(req.params.id);
      ok(res, w, 'Warehouse retrieved');
    } catch (e: any) { err(res, e.message, 404); }
  }

  /**
   * ✅ Warehouse capacity endpoint — matches original GET /warehouses/:id/capacity
   */
  async getWarehouseCapacity(req: Request, res: Response): Promise<void> {
    try {
      const capacity = await inventoryService.getWarehouseCapacity(req.params.id);
      ok(res, capacity, 'Warehouse capacity retrieved');
    } catch (e: any) { err(res, e.message); }
  }

  async createWarehouse(req: Request, res: Response): Promise<void> {
    try { ok(res, await inventoryService.createWarehouse(req.body), 'Warehouse created', 201); }
    catch (e: any) { err(res, e.message); }
  }

  async updateWarehouse(req: Request, res: Response): Promise<void> {
    try {
      const w = await inventoryService.updateWarehouse(req.params.id, req.body);
      ok(res, w, 'Warehouse updated');
    } catch (e: any) { err(res, e.message); }
  }

  async deleteWarehouse(req: Request, res: Response): Promise<void> {
    try {
      const w = await inventoryService.deleteWarehouse(req.params.id);
      ok(res, w, 'Warehouse deleted');
    } catch (e: any) { err(res, e.message, 404); }
  }

  async getLowStockAlerts(req: Request, res: Response): Promise<void> {
    try {
      const threshold = parseInt(req.query.threshold as string) || 10;
      const alerts = await inventoryService.getLowStockAlerts(threshold);
      ok(res, alerts, 'Low stock alerts retrieved');
    } catch (e: any) { err(res, e.message); }
  }
}

export const inventoryController = new InventoryController();
