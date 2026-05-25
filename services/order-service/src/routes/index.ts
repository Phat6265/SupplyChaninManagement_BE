import { Router, Request, Response } from 'express';
import { salesOrderController } from '../controllers/SalesOrderController';
import { purchaseOrderController } from '../controllers/PurchaseOrderController';
import { customerController, supplierController } from '../controllers/CustomerSupplierController';

// Sales Orders
export const salesOrderRouter = Router();
salesOrderRouter.get('/', (req: Request, res: Response) => salesOrderController.getAll(req, res));
salesOrderRouter.get('/:id', (req: Request, res: Response) => salesOrderController.getById(req, res));
salesOrderRouter.post('/', (req: Request, res: Response) => salesOrderController.create(req, res));
salesOrderRouter.patch('/:id/status', (req: Request, res: Response) => salesOrderController.updateStatus(req, res));
salesOrderRouter.put('/:id/status', (req: Request, res: Response) => salesOrderController.updateStatus(req, res));

// Purchase Orders
export const purchaseOrderRouter = Router();
purchaseOrderRouter.get('/', (req: Request, res: Response) => purchaseOrderController.getAll(req, res));
purchaseOrderRouter.get('/:id', (req: Request, res: Response) => purchaseOrderController.getById(req, res));
purchaseOrderRouter.post('/', (req: Request, res: Response) => purchaseOrderController.create(req, res));
purchaseOrderRouter.patch('/:id/status', (req: Request, res: Response) => purchaseOrderController.updateStatus(req, res));
purchaseOrderRouter.put('/:id/status', (req: Request, res: Response) => purchaseOrderController.updateStatus(req, res));

// Customers
export const customerRouter = Router();
customerRouter.get('/', (req: Request, res: Response) => customerController.getAllCustomers(req, res));
customerRouter.get('/:id', (req: Request, res: Response) => customerController.getCustomerById(req, res));
customerRouter.post('/', (req: Request, res: Response) => customerController.createCustomer(req, res));
customerRouter.put('/:id', (req: Request, res: Response) => customerController.updateCustomer(req, res));

// Suppliers
export const supplierRouter = Router();
supplierRouter.get('/', (req: Request, res: Response) => supplierController.getAllSuppliers(req, res));
supplierRouter.get('/:id', (req: Request, res: Response) => supplierController.getSupplierById(req, res));
supplierRouter.post('/', (req: Request, res: Response) => supplierController.createSupplier(req, res));
supplierRouter.put('/:id', (req: Request, res: Response) => supplierController.updateSupplier(req, res));

