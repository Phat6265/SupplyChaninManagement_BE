import { subscribeEvent } from '../utils/eventBus';
import { cacheSet, cacheDel } from '../utils/cache';

// In-memory counters updated by event stream (materialized view)
export const analyticsCounters = {
  totalOrders: 0,
  totalShipments: 0,
  deliveredShipments: 0,
  pendingOrders: 0,
  recentEvents: [] as Array<{ event: string; data: any; timestamp: string }>,
};

/**
 * Register RabbitMQ consumers for analytics-service.
 * Instead of making 6 HTTP calls per dashboard request, we maintain
 * a materialized view updated by the event stream.
 */
export const registerAnalyticsConsumers = async (): Promise<void> => {
  await subscribeEvent(
    'analytics-service.data-stream',
    ['order.*', 'shipment.*', 'inventory.*'],
    async (routingKey: string, data: any) => {
      console.log(`[analytics-service] Event received: ${routingKey}`);

      // Update counters based on event type
      switch (routingKey) {
        case 'order.created':
          analyticsCounters.totalOrders++;
          analyticsCounters.pendingOrders++;
          break;
        case 'order.status_changed':
          if (data.newStatus === 'cancelled' || data.newStatus === 'delivered') {
            analyticsCounters.pendingOrders = Math.max(0, analyticsCounters.pendingOrders - 1);
          }
          break;
        case 'shipment.status_changed':
          if (data.newStatus === 'delivered') {
            analyticsCounters.deliveredShipments++;
          }
          break;
      }

      // Keep last 50 events for recent activity feed
      analyticsCounters.recentEvents.unshift({
        event: routingKey,
        data: { ...data, items: undefined }, // Strip large fields
        timestamp: new Date().toISOString(),
      });
      if (analyticsCounters.recentEvents.length > 50) {
        analyticsCounters.recentEvents = analyticsCounters.recentEvents.slice(0, 50);
      }

      // Invalidate dashboard cache so next request gets fresh data
      await cacheDel('analytics:dashboard');
      await cacheDel('analytics:monthly-stats');
    }
  );
};
