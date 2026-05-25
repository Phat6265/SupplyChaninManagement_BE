import { Supplier } from '../models/Supplier';

export class SupplierService {
  async getAllSuppliers(filters: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const query: any = {};
    // ✅ isActive filter — matches original backend
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    // ✅ search filter via $text — matches original backend
    if (filters.search) query.$text = { $search: filters.search };

    const [data, total] = await Promise.all([
      Supplier.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Supplier.countDocuments(query),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSupplierById(id: string) {
    const s = await Supplier.findById(id);
    if (!s) throw new Error('Supplier not found');
    return s;
  }

  async createSupplier(data: any) {
    // ✅ Validate duplicate email — matches original backend SupplierService.createSupplier
    const existing = await Supplier.findOne({ email: data.email });
    if (existing) throw new Error('Supplier email already exists');

    const s = new Supplier(data);
    await s.save();
    return s;
  }

  async updateSupplier(id: string, data: any) {
    const s = await Supplier.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    if (!s) throw new Error('Supplier not found');
    return s;
  }

  async delete(id: string) {
    const s = await Supplier.findByIdAndDelete(id);
    if (!s) throw new Error('Supplier not found');
    return { message: 'Supplier deleted' };
  }

  async countAll() { return Supplier.countDocuments(); }
}

export const supplierService = new SupplierService();
