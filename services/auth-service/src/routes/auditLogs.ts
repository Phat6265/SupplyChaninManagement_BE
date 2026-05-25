import { Router, Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog';

const router = Router();

// GET all audit logs
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, action, resource, limit = 50, page = 1 } = req.query;
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);
    res.json({ success: true, data: { data, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST create audit log (internal — called by services)
router.post('/', async (req: Request, res: Response) => {
  try {
    const log = await AuditLog.create(req.body);
    res.status(201).json({ success: true, data: log });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
});

export default router;
