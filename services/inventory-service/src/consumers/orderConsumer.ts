import { subscribeEvent } from '../utils/eventBus';
import { inventoryService } from '../services/InventoryService';
import { Warehouse } from '../models/Warehouse';

/**
 * Register RabbitMQ event consumers for inventory-service.
 * Handles: order.shipped (auto-export stock), order.cancelled (rollback stock)
 */
export const registerInventoryConsumers = async (): Promise<void> => {
  // ── Order Shipped → Auto-export stock from warehouse ────────────────────
  await subscribeEvent(
    'inventory-service.order-events',
    ['order.shipped', 'order.cancelled'],
    async (routingKey: string, data: any) => {
      console.log(`[inventory-service] Received event: ${routingKey}`, data);

      if (routingKey === 'order.shipped') {
        // Find first warehouse (same logic as original HTTP-based flow)
        const warehouses = await Warehouse.find().limit(1);
        const warehouse = warehouses[0];
        if (!warehouse || !data.items?.length) return;

        for (const item of data.items) {
          await inventoryService.exportStock({
            productId: item.productId,
            warehouseId: (warehouse as any)._id.toString(),
            quantity: item.quantity,
            createdBy: data.userId || 'system',
            notes: `Auto-export for Sales Order ${data.orderNumber}`,
          });
        }
        console.log(`[inventory-service] Auto-exported stock for order ${data.orderNumber}`);
      }

      if (routingKey === 'order.cancelled') {
        // Rollback: re-import stock that was previously exported
        const warehouses = await Warehouse.find().limit(1);
        const warehouse = warehouses[0];
        if (!warehouse || !data.items?.length) return;

        for (const item of data.items) {
          await inventoryService.importStock({
            productId: item.productId,
            warehouseId: (warehouse as any)._id.toString(),
            quantity: item.quantity,
            createdBy: data.userId || 'system',
            notes: `Rollback for cancelled order ${data.orderNumber}`,
          });
        }
        console.log(`[inventory-service] Rolled back stock for cancelled order ${data.orderNumber}`);
      }
    }
  );
};
