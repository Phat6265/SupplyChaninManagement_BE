import { Router, Request, Response } from 'express';
import { Category } from '../models/Category';
import { staffUp, managerUp } from '../middleware/rbac';

const router = Router();

// ── READ: tất cả role ─────────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: { data: categories, meta: { total: categories.length } } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: cat });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ── WRITE: admin, manager, staff ──────────────────────────────────────────────
router.post('/', staffUp, async (req: Request, res: Response) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ success: true, data: cat });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
});

router.put('/:id', staffUp, async (req: Request, res: Response) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: cat });
  } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
});

// ── DELETE: chỉ admin và manager ─────────────────────────────────────────────
router.delete('/:id', managerUp, async (req: Request, res: Response) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
