import axios from 'axios';
import { config } from '../config/environment';
import { Request, Response } from 'express';

const productClient = axios.create({ baseURL: config.productServiceUrl, timeout: 8000 });
const inventoryClient = axios.create({ baseURL: config.inventoryServiceUrl, timeout: 8000 });
const orderClient = axios.create({ baseURL: config.orderServiceUrl, timeout: 8000 });
const shipmentClient = axios.create({ baseURL: config.shipmentServiceUrl, timeout: 8000 });
const authClient = axios.create({ baseURL: config.authServiceUrl, timeout: 8000 });
const notifClient = axios.create({ baseURL: config.notificationServiceUrl, timeout: 8000 });

const ok = (res: Response, data: any, msg = 'Success') =>
  res.json({ success: true, message: msg, data, timestamp: new Date().toISOString() });
const err = (res: Response, msg: string, code = 500) =>
  res.status(code).json({ success: false, message: msg, timestamp: new Date().toISOString() });

const safeFetch = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  try { return await fn(); } catch { return fallback; }
};

export class AnalyticsController {
  /**
   * ✅ getInventoryAnalytics — matches original backend AnalyticsController.getInventoryAnalytics exactly
   */
  async getInventoryAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const warehouseId = req.query.warehouseId as string;
      const path = warehouseId
        ? `/api/inventory/logs?warehouseId=${warehouseId}`
        : '/api/inventory/logs';

      const response = await inventoryClient.get(path);
      const logs: any[] = response.data?.data?.data ?? [];

      const totalImported = logs
        .filter((l) => l.actionType === 'import')
        .reduce((sum, l) => sum + l.quantity, 0);

      const totalExported = logs
        .filter((l) => l.actionType === 'export')
        .reduce((sum, l) => sum + l.quantity, 0);

      ok(res, {
        totalImported,
        totalExported,
        netChange: totalImported - totalExported,
        totalTransactions: logs.length,
        byAction: {
          import: logs.filter((l) => l.actionType === 'import').length,
          export: logs.filter((l) => l.actionType === 'export').length,
          adjustment: logs.filter((l) => l.actionType === 'adjustment').length,
          transfer: logs.filter((l) => l.actionType === 'transfer').length,
        },
      });
    } catch (e: any) { err(res, e.message); }
  }

  /**
   * ✅ getShipmentAnalytics — matches original backend, includes statusDistribution
   */
  async getShipmentAnalytics(_req: Request, res: Response): Promise<void> {
    try {
      const response = await shipmentClient.get('/api/shipments?limit=1000');
      const shipments: any[] = response.data?.data?.data ?? [];

      const totalShipments = shipments.length;
      const delivered = shipments.filter((s) => s.status === 'delivered').length;
      const inTransit = shipments.filter((s) => s.status === 'in_transit').length;
      const pending = shipments.filter((s) => s.status === 'pending').length;
      const cancelled = shipments.filter((s) => s.status === 'cancelled').length;

      ok(res, {
        totalShipments,
        delivered,
        inTransit,
        pending,
        cancelled,
        deliveryRate: totalShipments > 0 ? ((delivered / totalShipments) * 100).toFixed(2) : 0,
        // ✅ statusDistribution — matches original backend exactly
        statusDistribution: { delivered, inTransit, pending, cancelled },
      });
    } catch (e: any) { err(res, e.message); }
  }

  /**
   * ✅ getDashboardMetrics — matches original backend, includes all fields:
   * products, totalShipments, deliveredShipments, deliveryRate,
   * totalInventoryValue, recentActivity, totalUsers, totalCustomers,
   * totalSuppliers, totalPurchaseOrders, totalSalesOrders, totalRevenue
   */
  async getDashboardMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const [
        productsRes, shipmentsRes, inventoryLogsRes, deliveredRes,
        usersRes, customersRes, suppliersRes, poRes, soRes, soListRes,
      ] = await Promise.allSettled([
        productClient.get('/api/products?limit=1'),
        shipmentClient.get('/api/shipments?limit=1'),
        inventoryClient.get('/api/inventory/logs'),
        shipmentClient.get('/api/shipments?status=delivered&limit=1'),
        authClient.get('/api/auth/users/count'),
        orderClient.get('/api/customers?limit=1'),
        orderClient.get('/api/suppliers?limit=1'),
        orderClient.get('/api/purchase-orders?limit=1'),
        orderClient.get('/api/sales-orders?limit=1'),
        orderClient.get('/api/sales-orders?limit=1000'),
      ]);

      const getTotal = (result: PromiseSettledResult<any>): number => {
        if (result.status === 'fulfilled') {
          return result.value?.data?.data?.meta?.total
            ?? result.value?.data?.data?.length
            ?? 0;
        }
        return 0;
      };

      // Total inventory value = sum of all log quantities (matches original: logs.reduce sum quantity)
      const logs: any[] = (inventoryLogsRes.status === 'fulfilled'
        ? inventoryLogsRes.value?.data?.data?.data : []) ?? [];
      const totalInventoryValue = logs.reduce((sum: number, log: any) => sum + log.quantity, 0);
      const recentActivity = logs.length;

      // Total revenue from all valid sales orders
      const soList: any[] = (soListRes.status === 'fulfilled'
        ? soListRes.value?.data?.data?.data : []) ?? [];
      const totalRevenue = soList.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

      // Users count from /users/count endpoint
      const totalUsers = (() => {
        if (usersRes.status === 'fulfilled') {
          const d = usersRes.value?.data?.data;
          return d?.total ?? (Array.isArray(d) ? d.length : 0);
        }
        return 0;
      })();

      const products = getTotal(productsRes);
      const shipments = getTotal(shipmentsRes);
      const deliveredShipments = getTotal(deliveredRes);

      ok(res, {
        products,
        totalShipments: shipments,
        deliveredShipments,
        deliveryRate: shipments > 0 ? ((deliveredShipments / shipments) * 100).toFixed(2) : 0,
        totalInventoryValue,
        recentActivity,
        totalUsers,
        totalCustomers: getTotal(customersRes),
        totalSuppliers: getTotal(suppliersRes),
        totalPurchaseOrders: getTotal(poRes),
        totalSalesOrders: getTotal(soRes),
        totalRevenue,
      });
    } catch (e: any) { err(res, e.message); }
  }

  /**
   * ✅ getTopMovingProducts — matches original backend logic exactly
   */
  async getTopMovingProducts(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const response = await inventoryClient.get('/api/inventory/logs?limit=1000');
      const logs: any[] = response.data?.data?.data ?? [];

      const productMovement: Record<string, number> = {};
      logs.forEach((log: any) => {
        if (log.actionType === 'export') {
          productMovement[log.productId] = (productMovement[log.productId] || 0) + log.quantity;
        }
      });

      const topProducts = Object.entries(productMovement)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([productId, quantity]) => ({ productId, quantity }));

      ok(res, topProducts);
    } catch (e: any) { err(res, e.message); }
  }

  async getMonthlyStats(_req: Request, res: Response): Promise<void> {
    try {
      const response = await shipmentClient.get('/api/shipments?limit=1000');
      const shipments: any[] = response.data?.data?.data ?? [];

      const monthlyStats: Record<string, { count: number; delivered: number }> = {};

      shipments.forEach((shipment: any) => {
        const date = new Date(shipment.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = { count: 0, delivered: 0 };
        }

        monthlyStats[monthKey].count++;
        if (shipment.status === 'delivered') {
          monthlyStats[monthKey].delivered++;
        }
      });

      ok(res, monthlyStats);
    } catch (e: any) { err(res, e.message); }
  }
  /**
   * Inventory Valuation Report — stock × unit price per product per warehouse
   */
  async getInventoryValuation(_req: Request, res: Response): Promise<void> {
    try {
      const [productsRes, logsRes] = await Promise.allSettled([
        productClient.get('/api/products?limit=500'),
        inventoryClient.get('/api/inventory/logs?limit=5000'),
      ]);

      const products: any[] = productsRes.status === 'fulfilled'
        ? (productsRes.value?.data?.data?.data || []) : [];
      const logs: any[] = logsRes.status === 'fulfilled'
        ? (logsRes.value?.data?.data?.data || []) : [];

      // Build product price map
      const priceMap: Record<string, number> = {};
      products.forEach((p: any) => { priceMap[p._id] = p.price || 0; });

      // Calculate stock per product
      const stockMap: Record<string, number> = {};
      logs.forEach((log: any) => {
        if (!stockMap[log.productId]) stockMap[log.productId] = 0;
        if (log.actionType === 'import') stockMap[log.productId] += log.quantity;
        else if (log.actionType === 'export') stockMap[log.productId] -= log.quantity;
      });

      // Build valuation
      const valuation = Object.entries(stockMap).map(([productId, stock]) => {
        const product = products.find((p: any) => p._id === productId);
        const unitPrice = priceMap[productId] || 0;
        return {
          productId,
          productName: product?.name || productId,
          sku: product?.sku || '—',
          currentStock: Math.max(0, stock),
          unitPrice,
          totalValue: Math.max(0, stock) * unitPrice,
        };
      }).filter((v) => v.currentStock > 0).sort((a, b) => b.totalValue - a.totalValue);

      const totalValue = valuation.reduce((sum, v) => sum + v.totalValue, 0);

      ok(res, { valuation, totalValue, productCount: valuation.length });
    } catch (e: any) { err(res, e.message); }
  }
}

export const analyticsController = new AnalyticsController();
