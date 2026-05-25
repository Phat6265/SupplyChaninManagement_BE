import { PurchaseOrder, IPurchaseOrder, PurchaseOrderStatus } from '../models/PurchaseOrder';
import { importStock, sendNotification } from '../clients/serviceClients';

export class PurchaseOrderService {
  async getAllPurchaseOrders(filters: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.supplierId) query.supplierId = filters.supplierId;
    if (filters.warehouseId) query.warehouseId = filters.warehouseId;

    const [data, total] = await Promise.all([
      PurchaseOrder.find(query)
        .populate('supplierId', 'name email companyName rating')
        // warehouseId is a string ref in microservices, not ObjectId — cannot populate cross-service
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PurchaseOrder.countDocuments(query),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getPurchaseOrderById(id: string) {
    const order = await PurchaseOrder.findById(id)
      .populate('supplierId')
      .populate('items.productId');
    if (!order) throw new Error('Purchase Order not found');
    return order;
  }

  async createPurchaseOrder(data: Partial<IPurchaseOrder>, userId: string) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    // ✅ Fixed date range query — matches original backend (added $lt)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await PurchaseOrder.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    const poNumber = `PO-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

    let totalAmount = 0;
    if (data.items && data.items.length > 0) {
      data.items.forEach((item) => {
        item.totalPrice = item.quantity * item.unitPrice;
        totalAmount += item.totalPrice;
      });
    }

    const order = new PurchaseOrder({
      ...data,
      poNumber,
      totalAmount,
      createdBy: userId,
      status: PurchaseOrderStatus.PENDING,
    });

    await order.save();
    return order;
  }

  async updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus, userId: string) {
    const order = await PurchaseOrder.findById(id);
    if (!order) throw new Error('Purchase Order not found');

    // ✅ AUTO-IMPORT: When PO is received, import to inventory via HTTP
    if (status === PurchaseOrderStatus.RECEIVED && order.status !== PurchaseOrderStatus.RECEIVED) {
      for (const item of order.items) {
        await importStock({
          productId: item.productId.toString(),
          warehouseId: order.warehouseId,
          quantity: item.quantity,
          createdBy: userId,
          notes: `Auto-imported from PO: ${order.poNumber}`,
        });
      }
    }

    order.status = status;
    await order.save();

    // ✅ Notification messages — matches original backend PurchaseOrderService exactly
    const statusMessages: Record<string, string> = {
      pending: 'đã được gửi đi và đang chờ duyệt',
      approved: 'đã được PHÊ DUYỆT',
      received: 'đã được NHẬN HÀNG – Tồn kho đã tự động cập nhật',
      cancelled: 'đã bị HỦY',
    };
    const msg = statusMessages[status] || `đã cập nhật sang "${status}"`;

    await sendNotification({
      title: `📦 Purchase Order ${order.poNumber}`,
      message: `Đơn mua hàng ${order.poNumber} ${msg}.`,
      type: 'order_status',
      targetUserId: null,
      relatedEntity: {
        kind: 'PurchaseOrder',
        id: (order as any)._id.toString(),
        code: order.poNumber,
      },
    });

    return order;
  }

  async countAll() { return PurchaseOrder.countDocuments(); }

  // ── Aliases (used by controllers) ──────────────────────────────────────
  getAll         = this.getAllPurchaseOrders.bind(this);
  getById        = this.getPurchaseOrderById.bind(this);
  create         = this.createPurchaseOrder.bind(this);
  updateStatus   = this.updatePurchaseOrderStatus.bind(this);
}

export const purchaseOrderService = new PurchaseOrderService();
