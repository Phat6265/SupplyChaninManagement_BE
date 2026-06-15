import { Router, Request, Response } from 'express';
import { PurchaseRequisition, RequisitionStatus } from '../models/PurchaseRequisition';

const router = Router();

const ok = (res: Response, data: any, msg = 'Success', code = 200) =>
  res.status(code).json({ success: true, message: msg, data, timestamp: new Date().toISOString() });
const err = (res: Response, msg: string, code = 400) =>
  res.status(code).json({ success: false, message: msg, timestamp: new Date().toISOString() });

// GET / — List all requisitions
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, priority, page = '1', limit = '20' } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      PurchaseRequisition.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      PurchaseRequisition.countDocuments(filter),
    ]);

    ok(res, { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
  } catch (e: any) { err(res, e.message, 500); }
});

// GET /:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const req2 = await PurchaseRequisition.findById(req.params.id);
    if (!req2) { err(res, 'Not found', 404); return; }
    ok(res, req2);
  } catch (e: any) { err(res, e.message, 500); }
});

// POST / — Create requisition (draft)
router.post('/', async (req: Request, res: Response) => {
  try {
    const requestedBy = req.headers['x-user-email'] as string || req.headers['x-user-id'] as string || 'system';
    const { title, items, priority, notes } = req.body;

    if (!title) { err(res, 'Title is required'); return; }
    if (!items || !Array.isArray(items) || items.length === 0) { err(res, 'Items are required'); return; }

    const count = await PurchaseRequisition.countDocuments();
    const reqNumber = `REQ-${String(count + 1).padStart(6, '0')}`;

    const totalEstimatedAmount = items.reduce((sum: number, item: any) =>
      sum + (item.quantity || 0) * (item.estimatedUnitPrice || 0), 0);

    const requisition = await PurchaseRequisition.create({
      reqNumber,
      title,
      items,
      priority: priority || 'medium',
      notes,
      requestedBy,
      totalEstimatedAmount,
    });

    ok(res, requisition, 'Requisition created', 201);
  } catch (e: any) { err(res, e.message); }
});

// PATCH /:id/submit — Submit for approval
router.patch('/:id/submit', async (req: Request, res: Response) => {
  try {
    const requisition = await PurchaseRequisition.findById(req.params.id);
    if (!requisition) { err(res, 'Not found', 404); return; }
    if (requisition.status !== RequisitionStatus.DRAFT) { err(res, 'Only draft requisitions can be submitted'); return; }

    requisition.status = RequisitionStatus.SUBMITTED;
    await requisition.save();
    ok(res, requisition, 'Requisition submitted for approval');
  } catch (e: any) { err(res, e.message, 500); }
});

// PATCH /:id/approve — Approve requisition
router.patch('/:id/approve', async (req: Request, res: Response) => {
  try {
    const approvedBy = req.headers['x-user-email'] as string || req.headers['x-user-id'] as string || 'system';
    const requisition = await PurchaseRequisition.findById(req.params.id);
    if (!requisition) { err(res, 'Not found', 404); return; }
    if (requisition.status !== RequisitionStatus.SUBMITTED) { err(res, 'Only submitted requisitions can be approved'); return; }

    requisition.status = RequisitionStatus.APPROVED;
    requisition.approvedBy = approvedBy;
    await requisition.save();
    ok(res, requisition, 'Requisition approved');
  } catch (e: any) { err(res, e.message, 500); }
});

// PATCH /:id/reject — Reject requisition
router.patch('/:id/reject', async (req: Request, res: Response) => {
  try {
    const rejectedBy = req.headers['x-user-email'] as string || req.headers['x-user-id'] as string || 'system';
    const { reason } = req.body;
    const requisition = await PurchaseRequisition.findById(req.params.id);
    if (!requisition) { err(res, 'Not found', 404); return; }
    if (requisition.status !== RequisitionStatus.SUBMITTED) { err(res, 'Only submitted requisitions can be rejected'); return; }

    requisition.status = RequisitionStatus.REJECTED;
    requisition.rejectedBy = rejectedBy;
    requisition.rejectionReason = reason || '';
    await requisition.save();
    ok(res, requisition, 'Requisition rejected');
  } catch (e: any) { err(res, e.message, 500); }
});

export default router;
