import { Request, Response } from 'express';
import { salesOrderService } from '../services/SalesOrderService';
import { SalesOrderStatus } from '../models/SalesOrder';

const ok = (res: Response, data: any, msg = 'Success', code = 200) =>
  res.status(code).json({ success: true, message: msg, data, timestamp: new Date().toISOString() });
const err = (res: Response, msg: string, code = 400) =>
  res.status(code).json({ success: false, message: msg, timestamp: new Date().toISOString() });

export class SalesOrderController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { status, customerId, page, limit } = req.query;
      const result = await salesOrderService.getAll(
        { status, customerId },
        parseInt(page as string) || 1,
        parseInt(limit as string) || 20
      );
      ok(res, result);
    } catch (e: any) { err(res, e.message); }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try { ok(res, await salesOrderService.getById(req.params.id)); }
    catch (e: any) { err(res, e.message, 404); }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const order = await salesOrderService.create(req.body, userId);
      ok(res, order, 'Sales Order created', 201);
    } catch (e: any) { err(res, e.message); }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const role = (req.headers['x-user-role'] as string) || '';
      const { status } = req.body;

      if (!Object.values(SalesOrderStatus).includes(status)) {
        err(res, `Invalid status: ${status}`);
        return;
      }

      // ── Role-based status transition rules ────────────────────────────────
      // Staff can only confirm (pending → confirmed)
      // Manager/Admin can do all transitions including cancel
      const staffAllowedTransitions: SalesOrderStatus[] = [
        SalesOrderStatus.CONFIRMED,
      ];
      const managerAllowedTransitions: SalesOrderStatus[] = [
        SalesOrderStatus.CONFIRMED,
        SalesOrderStatus.PROCESSING,
        SalesOrderStatus.SHIPPED,
        SalesOrderStatus.DELIVERED,
        SalesOrderStatus.CANCELLED,
      ];

      if (role === 'staff' && !staffAllowedTransitions.includes(status as SalesOrderStatus)) {
        res.status(403).json({
          success: false,
          message: `Staff can only confirm orders. To set status '${status}', contact a manager.`,
        });
        return;
      }

      if (role === 'driver') {
        res.status(403).json({
          success: false,
          message: 'Drivers cannot update sales order status.',
        });
        return;
      }

      const order = await salesOrderService.updateStatus(req.params.id, status, userId);
      ok(res, order, 'Status updated');
    } catch (e: any) { err(res, e.message); }
  }
}

export const salesOrderController = new SalesOrderController();
