import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Request, Response } from 'express';
import { shipmentController } from '../controllers/ShipmentController';
import { allRoles, staffUp, managerUp, adminOnly, trackingUp } from '../middleware/rbac';

const router = Router();

const createShipmentValidator = [
  body('shipmentCode').trim().notEmpty().withMessage('Shipment code is required'),
  body('originWarehouseId').notEmpty().withMessage('Origin warehouse is required'),
  body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
];

const validate = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    return;
  }
  next();
};

// ── READ: tất cả role (driver xem lô hàng của mình) ──────────────────────────
router.get('/', allRoles, (req: Request, res: Response) => shipmentController.getAllShipments(req, res));
router.get('/status/:status', allRoles, (req: Request, res: Response) => shipmentController.getShipmentsByStatus(req, res));
router.get('/code/:code', allRoles, (req: Request, res: Response) => shipmentController.getShipmentByCode(req, res));
router.get('/:id', allRoles, (req: Request, res: Response) => shipmentController.getShipment(req, res));

// ── CREATE: admin, manager, staff (tạo lô hàng) ──────────────────────────────
router.post('/', staffUp, createShipmentValidator, validate, (req: Request, res: Response) => shipmentController.createShipment(req, res));

// ── UPDATE FULL: chỉ admin và manager ────────────────────────────────────────
router.put('/:id', managerUp, (req: Request, res: Response) => shipmentController.updateShipment(req, res));

// ── UPDATE STATUS: tất cả role ────────────────────────────────────────────────
// Driver: pending → in_transit → delivered / cancelled (lô hàng của mình)
// Manager/Admin: có thể override bất kỳ trạng thái
// Controller sẽ kiểm tra driver chỉ được cập nhật shipment được gán cho mình
router.put('/:id/status', allRoles, (req: Request, res: Response) => shipmentController.updateShipmentStatus(req, res));
router.patch('/:id/status', allRoles, (req: Request, res: Response) => shipmentController.updateShipmentStatus(req, res));

// ── UPDATE LOCATION (GPS): admin, manager, driver ─────────────────────────────
router.put('/:id/location', trackingUp, (req: Request, res: Response) => shipmentController.updateShipmentLocation(req, res));
router.patch('/:id/location', trackingUp, (req: Request, res: Response) => shipmentController.updateShipmentLocation(req, res));

// ── ASSIGN DRIVER: chỉ admin và manager ──────────────────────────────────────
router.put('/:id/assign-driver', managerUp, (req: Request, res: Response) => shipmentController.assignDriver(req, res));
router.patch('/:id/driver', managerUp, (req: Request, res: Response) => shipmentController.assignDriver(req, res));

// ── DELETE: chỉ admin ─────────────────────────────────────────────────────────
router.delete('/:id', adminOnly, (req: Request, res: Response) => shipmentController.deleteShipment(req, res));

export default router;
