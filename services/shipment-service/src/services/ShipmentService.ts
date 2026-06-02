import { Shipment, IShipment } from '../models/Shipment';
import { publishEvent } from '../utils/eventBus';

export class ShipmentService {
  async createShipment(data: any) {
    // ✅ Validate duplicate shipmentCode — matches original backend
    const existingShipment = await Shipment.findOne({ shipmentCode: data.shipmentCode });
    if (existingShipment) throw new Error('Shipment with this code already exists');

    const shipment = new Shipment(data);
    await shipment.save();
    return shipment;
  }

  async getShipmentById(id: string) {
    const s = await Shipment.findById(id);
    if (!s) throw new Error('Shipment not found');
    return s;
  }

  async getShipmentByCode(shipmentCode: string) {
    return Shipment.findOne({ shipmentCode });
  }

  async updateShipment(id: string, data: any) {
    const s = await Shipment.findByIdAndUpdate(id, data, { new: true });
    if (!s) throw new Error('Shipment not found');
    return s;
  }

  async deleteShipment(id: string) {
    const s = await Shipment.findByIdAndDelete(id);
    if (!s) throw new Error('Shipment not found');
    return s;
  }

  async getAllShipments(skip: number = 0, limit: number = 20, driverId?: string) {
    const filter = driverId ? { driverId } : {};
    return Shipment.find(filter)
      .populate('customerId')
      .populate('salesOrderId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  async getShipmentsByStatus(status: string, skip: number = 0, limit: number = 20, driverId?: string) {
    const filter: Record<string, unknown> = { status };
    if (driverId) filter.driverId = driverId;
    return Shipment.find(filter)
      .populate('customerId')
      .populate('salesOrderId')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  async updateShipmentLocation(id: string, latitude: number, longitude: number) {
    const s = await Shipment.findByIdAndUpdate(
      id,
      { latitude, longitude, updatedAt: new Date() },
      { new: true }
    );
    if (!s) throw new Error('Shipment not found');
    return s;
  }

  async updateShipmentStatus(id: string, status: IShipment['status']) {
    const s = await Shipment.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!s) throw new Error('Shipment not found');

    // Publish event for notification-service and analytics
    await publishEvent('shipment.status_changed', {
      shipmentId: (s as any)._id.toString(),
      shipmentCode: s.shipmentCode,
      newStatus: status,
      driverId: s.driverId,
    });

    return s;
  }

  /**
   * ✅ Assign driver AND automatically set status to in_transit — matches original backend
   */
  async assignDriver(id: string, driverId: string) {
    const s = await Shipment.findByIdAndUpdate(
      id,
      { driverId, status: 'in_transit' },
      { new: true }
    );
    if (!s) throw new Error('Shipment not found');

    await publishEvent('shipment.status_changed', {
      shipmentId: (s as any)._id.toString(),
      shipmentCode: s.shipmentCode,
      newStatus: 'in_transit',
      driverId,
    });

    return s;
  }

  async countAll() { return Shipment.countDocuments(); }
  async countDelivered() { return Shipment.countDocuments({ status: 'delivered' }); }
}

export const shipmentService = new ShipmentService();
