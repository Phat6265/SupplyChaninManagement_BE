import { SalesOrder, ISalesOrder, SalesOrderStatus } from '../models/SalesOrder';
import { publishEvent } from '../utils/eventBus';

export class SalesOrderService {
  async getAllSalesOrders(filters: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.customerId) query.customerId = filters.customerId;

    const [data, total] = await Promise.all([
      SalesOrder.find(query)
        .populate('customerId', 'name email companyName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SalesOrder.countDocuments(query),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getSalesOrderById(id: string) {
    const order = await SalesOrder.findById(id)
      .populate('customerId')
      .populate('items.productId');
    if (!order) throw new Error('Sales Order not found');
    return order;
  }

  async createSalesOrder(data: Partial<ISalesOrder>, userId: string) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await SalesOrder.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    const orderNumber = `SO-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

    let totalAmount = 0;
    if (data.items && data.items.length > 0) {
      data.items.forEach((item) => {
        item.totalPrice = item.quantity * item.unitPrice;
        totalAmount += item.totalPrice;
      });
    }

    const order = new SalesOrder({
      ...data,
      orderNumber,
      totalAmount,
      createdBy: userId,
      status: SalesOrderStatus.PENDING,
    });

    await order.save();

    // ✅ Phase 2: Publish event instead of HTTP call
    await publishEvent('order.created', {
      orderId: (order as any)._id.toString(),
      orderNumber: order.orderNumber,
      items: order.items,
      totalAmount: order.totalAmount,
      customerId: order.customerId?.toString(),
      createdBy: userId,
    });

    return order;
  }

  async updateSalesOrderStatus(id: string, status: SalesOrderStatus, userId?: string) {
    const order = await SalesOrder.findById(id);
    if (!order) throw new Error('Sales Order not found');

    const prevStatus = order.status;
    order.status = status;
    await order.save();

    // ✅ Phase 2: Publish event — inventory-service and notification-service
    // will consume this event and handle stock export + notifications async
    await publishEvent('order.status_changed', {
      orderId: (order as any)._id.toString(),
      orderNumber: order.orderNumber,
      previousStatus: prevStatus,
      newStatus: status,
      items: order.items,
      customerId: order.customerId?.toString(),
      userId: userId || 'system',
    });

    // ✅ Special event for shipped status → inventory auto-export
    if (status === SalesOrderStatus.SHIPPED && prevStatus !== SalesOrderStatus.SHIPPED) {
      await publishEvent('order.shipped', {
        orderId: (order as any)._id.toString(),
        orderNumber: order.orderNumber,
        items: order.items.map((item) => ({
          productId: item.productId.toString(),
          quantity: item.quantity,
        })),
        userId: userId || 'system',
      });
    }

    if (status === SalesOrderStatus.CANCELLED) {
      await publishEvent('order.cancelled', {
        orderId: (order as any)._id.toString(),
        orderNumber: order.orderNumber,
        items: order.items.map((item) => ({
          productId: item.productId.toString(),
          quantity: item.quantity,
        })),
        userId: userId || 'system',
      });
    }

    return order;
  }

  async countAll() { return SalesOrder.countDocuments(); }

  async getTotalRevenue() {
    const orders = await SalesOrder.find({
      status: { $in: ['delivered', 'completed', 'shipped', 'processing', 'confirmed', 'pending'] },
    });
    return orders.reduce((sum, o) => sum + o.totalAmount, 0);
  }

  // ── Aliases (used by controllers) ──────────────────────────────────────
  getAll       = this.getAllSalesOrders.bind(this);
  getById      = this.getSalesOrderById.bind(this);
  create       = this.createSalesOrder.bind(this);
  updateStatus = this.updateSalesOrderStatus.bind(this);
}

export const salesOrderService = new SalesOrderService();
