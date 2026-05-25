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

  async getShipment(req: Request, res: Response): Promise<void> {
    try {
      const shipment = await shipmentService.getShipmentById(req.params.id);
      sendSuccess(res, shipment, 'Shipment retrieved');
    } catch (e: any) { sendError(res, e.message, 404); }
  }

  async getShipmentByCode(req: Request, res: Response): Promise<void> {
    try {
      const shipment = await shipmentService.getShipmentByCode(req.params.code);
      if (!shipment) { sendError(res, 'Shipment not found', 404); return; }
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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const shipments = await shipmentService.getAllShipments(skip, limit);
      sendSuccess(res, { data: shipments, page, limit });
    } catch (e: any) { sendError(res, e.message); }
  }

  async getShipmentsByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const shipments = await shipmentService.getShipmentsByStatus(status, skip, limit);
      sendSuccess(res, { data: shipments, page, limit });
    } catch (e: any) { sendError(res, e.message); }
  }

  async updateShipmentLocation(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude } = req.body;
      const shipment = await shipmentService.updateShipmentLocation(req.params.id, latitude, longitude);
      sendSuccess(res, shipment, 'Location updated');
    } catch (e: any) { sendError(res, e.message); }
  }

  async updateShipmentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body;
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
