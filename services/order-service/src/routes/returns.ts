import { Router, Request, Response } from 'express';
import { Return } from '../models/Return';
import { staffUp, managerUp } from '../middleware/rbac';

const router = Router();

// ── READ: admin, manager, staff ───────────────────────────────────────────────
router.get('/', staffUp, async (req: Request, res: Response) => {
  try {
    const { status, type, limit = 50, page = 1 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Return.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Return.countDocuments(filter),
    ]);
    res.json({ success: true, data: { data, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/:id', staffUp, async (req: Request, res: Response) => {
  try {
    const ret = await Return.findById(req.params.id);
    if (!ret) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: ret });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── CREATE: admin, manager, staff (staff tạo đơn trả từ khách) ───────────────
router.post('/', staffUp, async (req: Request, res: Response) => {
  try {
    const createdBy = req.headers['x-user-email'] || req.headers['x-user-id'] || 'system';
    const ret = await Return.create({ ...req.body, createdBy });
    res.status(201).json({ success: true, data: ret });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
});

// ── UPDATE STATUS: chỉ admin và manager (duyệt/từ chối đơn trả) ──────────────
// pending → approved/rejected: manager, admin
// approved → completed: manager, admin
router.patch('/:id/status', managerUp, async (req: Request, res: Response) => {
  try {
    const ret = await Return.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!ret) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: ret });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
});

export default router;
