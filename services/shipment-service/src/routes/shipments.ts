import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Request, Response } from 'express';
import { shipmentController } from '../controllers/ShipmentController';

const router = Router();

// ── Validators (matches original createShipmentValidator) ─────────────────────
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

// ── Routes matching original backend shipments.ts exactly ─────────────────────
router.post('/', createShipmentValidator, validate, (req: Request, res: Response) => shipmentController.createShipment(req, res));

router.get('/', (req: Request, res: Response) => shipmentController.getAllShipments(req, res));
router.get('/status/:status', (req: Request, res: Response) => shipmentController.getShipmentsByStatus(req, res));
router.get('/code/:code', (req: Request, res: Response) => shipmentController.getShipmentByCode(req, res));
router.get('/:id', (req: Request, res: Response) => shipmentController.getShipment(req, res));

router.put('/:id', (req: Request, res: Response) => shipmentController.updateShipment(req, res));
router.put('/:id/location', (req: Request, res: Response) => shipmentController.updateShipmentLocation(req, res));
router.put('/:id/status', (req: Request, res: Response) => shipmentController.updateShipmentStatus(req, res));
router.patch('/:id/status', (req: Request, res: Response) => shipmentController.updateShipmentStatus(req, res));
router.put('/:id/assign-driver', (req: Request, res: Response) => shipmentController.assignDriver(req, res));
router.patch('/:id/location', (req: Request, res: Response) => shipmentController.updateShipmentLocation(req, res));
router.patch('/:id/driver', (req: Request, res: Response) => shipmentController.assignDriver(req, res));

router.delete('/:id', (req: Request, res: Response) => shipmentController.deleteShipment(req, res));

export default router;
