import { Request, Response } from 'express';
import { shipmentService } from '../services/ShipmentService';
import { body, validationResult } from 'express-validator';

const sendSuccess = (res: Response, data: any, msg = 'Success', code = 200) =>
  res.status(code).json({ success: true, message: msg, data, timestamp: new Date().toISOString() });
const sendError = (res: Response, msg: string, code = 400) =>
  res.status(code).json({ success: false, message: msg, timestamp: new Date().toISOString() });

export class ShipmentController {
  async createShipment(req: Request, res: Response): Promise<void> {
    try {
      const shipment = await shipmentService.createShipment(req.body);
      sendSuccess(res, shipment, 'Shipment created', 201);
    } catch (e: any) { sendError(res, e.message); }
  }

  private assertDriverCanAccessShipment(shipment: any, userId: string, res: Response): boolean {
    if (shipment.driverId !== userId) {
      sendError(res, 'Drivers can only access their own assigned shipments', 403);
      return false;
    }
    return true;
  }

  async getShipment(req: Request, res: Response): Promise<void> {
    try {
      const role = (req.headers['x-user-role'] as string) || '';
      const userId = req.headers['x-user-id'] as string;
      const shipment = await shipmentService.getShipmentById(req.params.id);
      if (role === 'driver' && !this.assertDriverCanAccessShipment(shipment, userId, res)) return;
      sendSuccess(res, shipment, 'Shipment retrieved');
    } catch (e: any) { sendError(res, e.message, 404); }
  }

  async getShipmentByCode(req: Request, res: Response): Promise<void> {
    try {
      const role = (req.headers['x-user-role'] as string) || '';
      const userId = req.headers['x-user-id'] as string;
      const shipment = await shipmentService.getShipmentByCode(req.params.code);
      if (!shipment) { sendError(res, 'Shipment not found', 404); return; }
      if (role === 'driver' && !this.assertDriverCanAccessShipment(shipment, userId, res)) return;
      sendSuccess(res, shipment, 'Shipment retrieved');
    } catch (e: any) { sendError(res, e.message); }
  }

  async updateShipment(req: Request, res: Response): Promise<void> {
    try {
      const shipment = await shipmentService.updateShipment(req.params.id, req.body);
      sendSuccess(res, shipment, 'Shipment updated');
    } catch (e: any) { sendError(res, e.message); }
  }

  async deleteShipment(req: Request, res: Response): Promise<void> {
    try {
      const shipment = await shipmentService.deleteShipment(req.params.id);
      sendSuccess(res, shipment, 'Shipment deleted');
    } catch (e: any) { sendError(res, e.message, 404); }
  }

  async getAllShipments(req: Request, res: Response): Promise<void> {
    try {
      const role = (req.headers['x-user-role'] as string) || '';
      const userId = req.headers['x-user-id'] as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const driverId = role === 'driver' ? userId : undefined;
      const shipments = await shipmentService.getAllShipments(skip, limit, driverId);
      sendSuccess(res, { data: shipments, page, limit });
    } catch (e: any) { sendError(res, e.message); }
  }

  async getShipmentsByStatus(req: Request, res: Response): Promise<void> {
    try {
      const role = (req.headers['x-user-role'] as string) || '';
      const userId = req.headers['x-user-id'] as string;
      const { status } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const driverId = role === 'driver' ? userId : undefined;
      const shipments = await shipmentService.getShipmentsByStatus(status, skip, limit, driverId);
      sendSuccess(res, { data: shipments, page, limit });
    } catch (e: any) { sendError(res, e.message); }
  }

  async updateShipmentLocation(req: Request, res: Response): Promise<void> {
    try {
      const role = (req.headers['x-user-role'] as string) || '';
      const userId = req.headers['x-user-id'] as string;

      const existing = await shipmentService.getShipmentById(req.params.id);

      // Driver chỉ được cập nhật vị trí lô hàng được gán cho mình
      if (role === 'driver') {
        if ((existing as any).driverId !== userId) {
          sendError(res, 'Drivers can only update location of their own assigned shipments', 403);
          return;
        }
      }

      const { latitude, longitude, eta } = req.body;
      const shipment = await shipmentService.updateShipmentLocation(req.params.id, latitude, longitude, eta);
      sendSuccess(res, shipment, 'Location updated');
    } catch (e: any) { sendError(res, e.message); }
  }

  async updateShipmentStatus(req: Request, res: Response): Promise<void> {
    try {
      const role = (req.headers['x-user-role'] as string) || '';
      const userId = req.headers['x-user-id'] as string;
      const { status } = req.body;

      const validStatuses = ['pending', 'in_transit', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        sendError(res, `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
        return;
      }

      const existing = await shipmentService.getShipmentById(req.params.id);
      const shipment = existing as any;

      // Driver: chỉ lô hàng của mình, chỉ in_transit | delivered | cancelled
      if (role === 'driver') {
        if (shipment.driverId !== userId) {
          sendError(res, 'Drivers can only update status of their own assigned shipments', 403);
          return;
        }

        const driverAllowed = ['in_transit', 'delivered', 'cancelled'];
        if (!driverAllowed.includes(status)) {
          sendError(res, `Drivers can only set status to: ${driverAllowed.join(', ')}`, 403);
          return;
        }
      }

      // Staff: không hủy lô hàng (Manager/Admin xử lý sự cố)
      if (role === 'staff' && status === 'cancelled') {
        sendError(res, 'Staff cannot cancel shipments. Contact a manager.', 403);
        return;
      }

      const shipment = await shipmentService.updateShipmentStatus(req.params.id, status);
      sendSuccess(res, shipment, 'Status updated');
    } catch (e: any) { sendError(res, e.message); }
  }

  async assignDriver(req: Request, res: Response): Promise<void> {
    try {
      const { driverId } = req.body;
      const shipment = await shipmentService.assignDriver(req.params.id, driverId);
      sendSuccess(res, shipment, 'Driver assigned');
    } catch (e: any) { sendError(res, e.message); }
  }
}

export const shipmentController = new ShipmentController();
