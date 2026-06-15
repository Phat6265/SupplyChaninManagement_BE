import { Router, Request, Response } from 'express';
import { salesOrderController } from '../controllers/SalesOrderController';
import { purchaseOrderController } from '../controllers/PurchaseOrderController';
import { customerController, supplierController } from '../controllers/CustomerSupplierController';
import { staffUp, managerUp } from '../middleware/rbac';

// ── Sales Orders ──────────────────────────────────────────────────────────────
export const salesOrderRouter = Router();

// READ: admin, manager, staff
salesOrderRouter.get('/', staffUp, (req: Request, res: Response) => salesOrderController.getAll(req, res));
salesOrderRouter.get('/:id', staffUp, (req: Request, res: Response) => salesOrderController.getById(req, res));

// CREATE: admin, manager, staff (staff tạo đơn bán)
salesOrderRouter.post('/', staffUp, (req: Request, res: Response) => salesOrderController.create(req, res));

// UPDATE STATUS: logic phân quyền theo trạng thái nằm trong controller
// - pending → confirmed: staff, manager, admin
// - confirmed → processing: manager, admin
// - processing → shipped: manager, admin
// - shipped → delivered: manager, admin (hoặc tự động từ shipment)
// - * → cancelled: manager, admin
salesOrderRouter.patch('/:id/status', staffUp, (req: Request, res: Response) => salesOrderController.updateStatus(req, res));
salesOrderRouter.put('/:id/status', staffUp, (req: Request, res: Response) => salesOrderController.updateStatus(req, res));

// ── Purchase Orders ───────────────────────────────────────────────────────────
export const purchaseOrderRouter = Router();

// READ: admin, manager, staff
purchaseOrderRouter.get('/', staffUp, (req: Request, res: Response) => purchaseOrderController.getAll(req, res));
purchaseOrderRouter.get('/:id', staffUp, (req: Request, res: Response) => purchaseOrderController.getById(req, res));

// CREATE: admin, manager, staff (staff tạo PO nháp)
purchaseOrderRouter.post('/', staffUp, (req: Request, res: Response) => purchaseOrderController.create(req, res));

// UPDATE STATUS: phân quyền theo trạng thái
// - draft → pending: staff, manager, admin
// - pending → approved: manager, admin (duyệt đơn)
// - approved → received: staff, manager, admin (nhận hàng)
// - * → cancelled: manager, admin
purchaseOrderRouter.patch('/:id/status', staffUp, (req: Request, res: Response) => purchaseOrderController.updateStatus(req, res));
purchaseOrderRouter.put('/:id/status', staffUp, (req: Request, res: Response) => purchaseOrderController.updateStatus(req, res));

// ── Customers ─────────────────────────────────────────────────────────────────
export const customerRouter = Router();
<<<<<<< Updated upstream
=======
customerRouter.get('/', (req: Request, res: Response) => customerController.getAllCustomers(req, res));
customerRouter.get('/:id', (req: Request, res: Response) => customerController.getCustomerById(req, res));
customerRouter.post('/', (req: Request, res: Response) => customerController.createCustomer(req, res));
customerRouter.put('/:id', (req: Request, res: Response) => customerController.updateCustomer(req, res));
customerRouter.patch('/:id/archive', (req: Request, res: Response) => customerController.archiveCustomer(req, res));
>>>>>>> Stashed changes

// READ: admin, manager, staff
customerRouter.get('/', staffUp, (req: Request, res: Response) => customerController.getAllCustomers(req, res));
customerRouter.get('/:id', staffUp, (req: Request, res: Response) => customerController.getCustomerById(req, res));

// WRITE: admin, manager, staff
customerRouter.post('/', staffUp, (req: Request, res: Response) => customerController.createCustomer(req, res));
customerRouter.put('/:id', staffUp, (req: Request, res: Response) => customerController.updateCustomer(req, res));

// ── Suppliers ─────────────────────────────────────────────────────────────────
export const supplierRouter = Router();
<<<<<<< Updated upstream
=======
supplierRouter.get('/', (req: Request, res: Response) => supplierController.getAllSuppliers(req, res));
supplierRouter.get('/:id', (req: Request, res: Response) => supplierController.getSupplierById(req, res));
supplierRouter.post('/', (req: Request, res: Response) => supplierController.createSupplier(req, res));
supplierRouter.put('/:id', (req: Request, res: Response) => supplierController.updateSupplier(req, res));
supplierRouter.patch('/:id/archive', (req: Request, res: Response) => supplierController.archiveSupplier(req, res));
supplierRouter.patch('/:id/rating', (req: Request, res: Response) => supplierController.updateRating(req, res));
supplierRouter.get('/:id/rating', (req: Request, res: Response) => supplierController.getRating(req, res));
>>>>>>> Stashed changes

// READ: admin, manager, staff
supplierRouter.get('/', staffUp, (req: Request, res: Response) => supplierController.getAllSuppliers(req, res));
supplierRouter.get('/:id', staffUp, (req: Request, res: Response) => supplierController.getSupplierById(req, res));

// WRITE: admin, manager, staff (US-S08)
supplierRouter.post('/', staffUp, (req: Request, res: Response) => supplierController.createSupplier(req, res));
supplierRouter.put('/:id', staffUp, (req: Request, res: Response) => supplierController.updateSupplier(req, res));
