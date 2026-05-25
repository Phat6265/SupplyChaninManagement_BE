import { subscribeEvent } from '../utils/eventBus';
import { notificationService } from '../services/NotificationService';

/**
 * Register RabbitMQ event consumers for notification-service.
 * Listens to all domain events and creates notifications + Socket.IO broadcasts.
 */
export const registerNotificationConsumers = async (): Promise<void> => {
  await subscribeEvent(
    'notification-service.all-events',
    ['order.*', 'shipment.*', 'inventory.*'],
    async (routingKey: string, data: any) => {
      console.log(`[notification-service] Received event: ${routingKey}`);

      switch (routingKey) {
        case 'order.created':
          await notificationService.createAndBroadcast({
            title: `🛒 Đơn hàng mới ${data.orderNumber}`,
            message: `Đơn bán hàng ${data.orderNumber} đã được tạo thành công.`,
            type: 'order_status',
            targetUserId: null,
            relatedEntity: {
              kind: 'SalesOrder',
              id: data.orderId,
              code: data.orderNumber,
            },
          });
          break;

        case 'order.status_changed': {
          const statusMessages: Record<string, string> = {
            confirmed: 'đã được XÁC NHẬN',
            processing: 'đang được XỬ LÝ',
            shipped: 'đã XUẤT KHO và đang trên đường giao – Tồn kho tự động giảm',
            delivered: 'đã GIAO HÀNG THÀNH CÔNG',
            cancelled: 'đã bị HỦY',
          };
          const msg = statusMessages[data.newStatus] || `đã cập nhật sang "${data.newStatus}"`;

          await notificationService.createAndBroadcast({
            title: `🛒 Sales Order ${data.orderNumber}`,
            message: `Đơn bán hàng ${data.orderNumber} ${msg}.`,
            type: 'order_status',
            targetUserId: null,
            relatedEntity: {
              kind: 'SalesOrder',
              id: data.orderId,
              code: data.orderNumber,
            },
          });
          break;
        }

        case 'shipment.status_changed':
          await notificationService.createAndBroadcast({
            title: `🚛 Shipment ${data.shipmentCode}`,
            message: `Lô hàng ${data.shipmentCode} ${data.newStatus === 'delivered' ? 'đã giao thành công' : `trạng thái: ${data.newStatus}`}.`,
            type: 'shipment_status',
            targetUserId: data.driverId || null,
            relatedEntity: {
              kind: 'Shipment',
              id: data.shipmentId,
              code: data.shipmentCode,
            },
          });
          break;

        case 'inventory.low_stock':
          await notificationService.createAndBroadcast({
            title: `⚠️ Cảnh báo tồn kho thấp`,
            message: `Sản phẩm ${data.productName || data.productId} tại kho ${data.warehouseName || data.warehouseId} còn ${data.currentStock} đơn vị.`,
            type: 'inventory_alert',
            targetUserId: null,
            relatedEntity: {
              kind: 'Product',
              id: data.productId,
              code: data.productId,
            },
          });
          break;

        default:
          console.log(`[notification-service] Unhandled event: ${routingKey}`);
      }
    }
  );
};
