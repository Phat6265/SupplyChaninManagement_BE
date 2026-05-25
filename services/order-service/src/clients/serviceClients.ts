import axios from 'axios';
import { config } from '../config/environment';

/**
 * HTTP client for calling inventory-service internally.
 * Note: No auth header needed — services communicate on internal Docker network.
 */
export const inventoryClient = axios.create({
  baseURL: config.inventoryServiceUrl,
  timeout: 10000,
});

/**
 * HTTP client for calling notification-service internally.
 */
export const notificationClient = axios.create({
  baseURL: config.notificationServiceUrl,
  timeout: 5000,
});

export interface ImportStockPayload {
  productId: string;
  warehouseId: string;
  quantity: number;
  createdBy?: string;
  notes?: string;
}

export interface ExportStockPayload {
  productId: string;
  warehouseId: string;
  quantity: number;
  createdBy?: string;
  notes?: string;
}

export const importStock = async (data: ImportStockPayload) => {
  try {
    const res = await inventoryClient.post('/api/inventory/import', data);
    return res.data;
  } catch (err: any) {
    console.error('[order-service] importStock HTTP error:', err.message);
    throw new Error('Failed to import stock via inventory-service');
  }
};

export const exportStock = async (data: ExportStockPayload) => {
  try {
    const res = await inventoryClient.post('/api/inventory/export', data);
    return res.data;
  } catch (err: any) {
    console.error('[order-service] exportStock HTTP error:', err.message);
    throw new Error('Failed to export stock via inventory-service');
  }
};

export const getFirstWarehouse = async (): Promise<{ _id: string; name: string } | null> => {
  try {
    const res = await inventoryClient.get('/api/warehouses');
    const warehouses = res.data?.data;
    return Array.isArray(warehouses) && warehouses.length > 0 ? warehouses[0] : null;
  } catch {
    return null;
  }
};

export const sendNotification = async (payload: {
  title: string;
  message: string;
  type: string;
  targetUserId?: string | null;
  relatedEntity?: { kind: string; id: string; code: string };
}) => {
  try {
    await notificationClient.post('/api/notifications/internal', payload);
  } catch (err: any) {
    // Non-critical — notification failure should not break order operations
    console.warn('[order-service] Notification send failed (non-critical):', err.message);
  }
};
