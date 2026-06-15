import axios from 'axios';
import { InventoryLog } from '../models/InventoryLog';
import { Warehouse } from '../models/Warehouse';
import { config } from '../config/environment';

const productClient = axios.create({ baseURL: config.productServiceUrl, timeout: 5000 });


export class InventoryService {
  /** Core method — creates log AND updates warehouse stock */
  async createInventoryLog(data: any) {
    const log = new InventoryLog(data);
    await log.save();

    // ✅ Update warehouse stock — matches original backend InventoryService.createInventoryLog
    if (data.actionType === 'import') {
      await Warehouse.findByIdAndUpdate(data.warehouseId, { $inc: { currentStock: data.quantity } });
    } else if (data.actionType === 'export') {
      await Warehouse.findByIdAndUpdate(data.warehouseId, { $inc: { currentStock: -data.quantity } });
    }

    return log;
  }

  async getInventoryLogs(
    productId?: string,
    warehouseId?: string,
    skip: number = 0,
    limit: number = 20
  ) {
    const filter: any = {};
    if (productId) filter.productId = productId;
    if (warehouseId) filter.warehouseId = warehouseId;

    return InventoryLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  }

  async getWarehouseInventory(warehouseId: string) {
    const result = await InventoryLog.aggregate([
      { $match: { warehouseId } },
      {
        $group: {
          _id: '$productId',
          totalImported: {
            $sum: { $cond: [{ $eq: ['$actionType', 'import'] }, '$quantity', 0] },
          },
          totalExported: {
            $sum: { $cond: [{ $eq: ['$actionType', 'export'] }, '$quantity', 0] },
          },
        },
      },
      { $addFields: { currentStock: { $subtract: ['$totalImported', '$totalExported'] } } },
      { $match: { currentStock: { $gt: 0 } } },
      { $sort: { currentStock: -1 } },
    ]);

    /**
     * ✅ Enrich with product info — matches original backend InventoryService.getWarehouseInventory.
     * Calls product-service per productId. Falls back gracefully if product-service unavailable.
     */
    const enriched = await Promise.all(
      result.map(async (item: any) => {
        let productInfo: any = {};
        try {
          const res = await productClient.get(`/api/products/${item._id}`);
          const p = res.data?.data;
          if (p) {
            productInfo = {
              productName: p.name,
              sku: p.sku,
              barcode: p.barcode,
              price: p.price,
              unit: p.unit,
              categoryId: p.categoryId,
            };
          }
        } catch {
          // Non-critical: product-service unavailable, return raw data
        }
        return {
          productId: item._id,
          ...productInfo,
          currentStock: item.currentStock,
          totalImported: item.totalImported,
          totalExported: item.totalExported,
        };
      })
    );

    return enriched;
  }

  async importStock(data: any) {
    return this.createInventoryLog({ ...data, actionType: 'import' });
  }

  async exportStock(data: any) {
    return this.createInventoryLog({ ...data, actionType: 'export' });
  }

  async adjustStock(data: any) {
    return this.createInventoryLog({ ...data, actionType: 'adjustment' });
  }

  async transferStock(data: any) {
    return this.createInventoryLog({ ...data, actionType: 'transfer' });
  }

  // ── Warehouse CRUD ──────────────────────────────────────────────────────────

  async createWarehouse(data: any) {
    // ✅ Validate duplicate name — matches original WarehouseService.createWarehouse
    const existing = await Warehouse.findOne({ name: data.name });
    if (existing) throw new Error('Warehouse with this name already exists');

    const w = new Warehouse(data);
    await w.save();
    return w;
  }

  async getWarehouseById(id: string) {
    const w = await Warehouse.findById(id);
    if (!w) throw new Error('Warehouse not found');
    return w;
  }

  async getAllWarehouses(skip: number = 0, limit: number = 20) {
    return Warehouse.find().skip(skip).limit(limit);
  }

  async updateWarehouse(id: string, data: any) {
    const w = await Warehouse.findByIdAndUpdate(id, data, { new: true });
    if (!w) throw new Error('Warehouse not found');
    return w;
  }

  async deleteWarehouse(id: string) {
    const w = await Warehouse.findByIdAndDelete(id);
    if (!w) throw new Error('Warehouse not found');
    return w;
  }

  /**
   * ✅ Warehouse capacity — matches original WarehouseService.getWarehouseCapacity
   */
  async getWarehouseCapacity(id: string) {
    const warehouse = await Warehouse.findById(id);
    return {
      capacity: warehouse?.capacity,
      currentStock: warehouse?.currentStock,
      available: (warehouse?.capacity || 0) - (warehouse?.currentStock || 0),
    };
  }

  async updateWarehouseStock(warehouseId: string, quantity: number) {
    return Warehouse.findByIdAndUpdate(
      warehouseId,
      { $inc: { currentStock: quantity } },
      { new: true }
    );
  }

  /**
   * Get products with stock below threshold across all warehouses.
   * Aggregates inventory logs to calculate current stock per product.
   */
  async getLowStockAlerts(threshold: number = 10) {
    const pipeline = [
      {
        $group: {
          _id: { productId: '$productId', warehouseId: '$warehouseId' },
          totalImport: { $sum: { $cond: [{ $eq: ['$actionType', 'import'] }, '$quantity', 0] } },
          totalExport: { $sum: { $cond: [{ $eq: ['$actionType', 'export'] }, '$quantity', 0] } },
        },
      },
      {
        $project: {
          productId: '$_id.productId',
          warehouseId: '$_id.warehouseId',
          currentStock: { $subtract: ['$totalImport', '$totalExport'] },
          _id: 0,
        },
      },
      { $match: { currentStock: { $lte: threshold, $gte: 0 } } },
      { $sort: { currentStock: 1 as 1 } },
      { $limit: 50 },
    ];
    return InventoryLog.aggregate(pipeline);
  }
}

export const inventoryService = new InventoryService();
