import { Request, Response } from 'express';
import { customerService } from '../services/CustomerService';
import { supplierService } from '../services/SupplierService';

const ok = (res: Response, data: any, msg = 'Success', code = 200) =>
  res.status(code).json({ success: true, message: msg, data, timestamp: new Date().toISOString() });
const err = (res: Response, msg: string, code = 400) =>
  res.status(code).json({ success: false, message: msg, timestamp: new Date().toISOString() });

export class CustomerController {
  async getAllCustomers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      // ✅ Pass search and isActive filters — matches original backend CustomerController
      const filters = {
        search: req.query.search,
        isActive: req.query.isActive !== undefined
          ? req.query.isActive === 'true'
          : undefined,
      };
      ok(res, await customerService.getAllCustomers(filters, page, limit), 'Customers retrieved successfully');
    } catch (e: any) { err(res, e.message); }
  }

  async getCustomerById(req: Request, res: Response): Promise<void> {
    try { ok(res, await customerService.getCustomerById(req.params.id), 'Customer retrieved successfully'); }
    catch (e: any) { err(res, e.message, 404); }
  }

  async createCustomer(req: Request, res: Response): Promise<void> {
    try { ok(res, await customerService.createCustomer(req.body), 'Customer created successfully', 201); }
    catch (e: any) { err(res, e.message); }
  }

  async updateCustomer(req: Request, res: Response): Promise<void> {
    try { ok(res, await customerService.updateCustomer(req.params.id, req.body), 'Customer updated successfully'); }
    catch (e: any) { err(res, e.message); }
  }

  async archiveCustomer(req: Request, res: Response): Promise<void> {
    try { ok(res, await customerService.updateCustomer(req.params.id, { isActive: false }), 'Customer archived successfully'); }
    catch (e: any) { err(res, e.message); }
  }
}

export class SupplierController {
  async getAllSuppliers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      // ✅ Pass search and isActive filters — matches original backend SupplierController
      const filters = {
        search: req.query.search,
        isActive: req.query.isActive !== undefined
          ? req.query.isActive === 'true'
          : undefined,
      };
      ok(res, await supplierService.getAllSuppliers(filters, page, limit), 'Suppliers retrieved successfully');
    } catch (e: any) { err(res, e.message); }
  }

  async getSupplierById(req: Request, res: Response): Promise<void> {
    try { ok(res, await supplierService.getSupplierById(req.params.id), 'Supplier retrieved successfully'); }
    catch (e: any) { err(res, e.message, 404); }
  }

  async createSupplier(req: Request, res: Response): Promise<void> {
    try { ok(res, await supplierService.createSupplier(req.body), 'Supplier created successfully', 201); }
    catch (e: any) { err(res, e.message); }
  }

  async updateSupplier(req: Request, res: Response): Promise<void> {
    try { ok(res, await supplierService.updateSupplier(req.params.id, req.body), 'Supplier updated successfully'); }
    catch (e: any) { err(res, e.message); }
  }

  async archiveSupplier(req: Request, res: Response): Promise<void> {
    try { ok(res, await supplierService.updateSupplier(req.params.id, { isActive: false }), 'Supplier archived successfully'); }
    catch (e: any) { err(res, e.message); }
  }

  async updateRating(req: Request, res: Response): Promise<void> {
    try {
      const { rating } = req.body;
      if (!rating || rating < 1 || rating > 5) { err(res, 'Rating must be between 1 and 5'); return; }
      ok(res, await supplierService.updateSupplier(req.params.id, { rating }), 'Rating updated');
    } catch (e: any) { err(res, e.message); }
  }

  async getRating(req: Request, res: Response): Promise<void> {
    try {
      const supplier = await supplierService.getSupplierById(req.params.id);
      ok(res, { rating: (supplier as any).rating || 0 }, 'Rating retrieved');
    } catch (e: any) { err(res, e.message, 404); }
  }
}

export const customerController = new CustomerController();
export const supplierController = new SupplierController();
