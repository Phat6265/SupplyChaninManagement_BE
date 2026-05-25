import { Request, Response } from 'express';
import { productService } from '../services/ProductService';

const sendSuccess = (res: Response, data: any, message = 'Success', code = 200) =>
  res.status(code).json({ success: true, message, data, timestamp: new Date().toISOString() });

const sendError = (res: Response, message: string, code = 400) =>
  res.status(code).json({ success: false, message, timestamp: new Date().toISOString() });

export class ProductController {
  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const products = await productService.getAllProducts(skip, limit);
      sendSuccess(res, { data: products, page, limit });
    } catch (e: any) { sendError(res, e.message); }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const product = await productService.getProductById(req.params.id);
      sendSuccess(res, product, 'Product retrieved');
    } catch (e: any) { sendError(res, e.message, 404); }
  }

  async getProductBySku(req: Request, res: Response): Promise<void> {
    try {
      const product = await productService.getProductBySku(req.params.sku);
      if (!product) { sendError(res, 'Product not found', 404); return; }
      sendSuccess(res, product, 'Product retrieved');
    } catch (e: any) { sendError(res, e.message); }
  }

  async getProductByBarcode(req: Request, res: Response): Promise<void> {
    try {
      const product = await productService.getProductByBarcode(req.params.barcode);
      if (!product) { sendError(res, 'Product not found', 404); return; }
      sendSuccess(res, product, 'Product retrieved');
    } catch (e: any) { sendError(res, e.message); }
  }

  async searchProducts(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;
      if (!query) { sendError(res, 'Search query is required', 400); return; }
      const products = await productService.searchProducts(query as string);
      sendSuccess(res, products);
    } catch (e: any) { sendError(res, e.message); }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const product = await productService.createProduct(req.body);
      sendSuccess(res, product, 'Product created', 201);
    } catch (e: any) { sendError(res, e.message); }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      sendSuccess(res, product, 'Product updated');
    } catch (e: any) { sendError(res, e.message); }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const result = await productService.deleteProduct(req.params.id);
      sendSuccess(res, result, 'Product deleted');
    } catch (e: any) { sendError(res, e.message, 404); }
  }
}

export const productController = new ProductController();
