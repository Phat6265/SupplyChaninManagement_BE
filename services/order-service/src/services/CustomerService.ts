import { Customer } from '../models/Customer';

export class CustomerService {
  async getAllCustomers(filters: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const query: any = {};
    // ✅ isActive filter — matches original backend
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    // ✅ search filter via $text — matches original backend
    if (filters.search) query.$text = { $search: filters.search };

    const [data, total] = await Promise.all([
      Customer.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Customer.countDocuments(query),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCustomerById(id: string) {
    const customer = await Customer.findById(id);
    if (!customer) throw new Error('Customer not found');
    return customer;
  }

  async createCustomer(data: any) {
    // ✅ Validate duplicate email — matches original backend CustomerService.createCustomer
    const existing = await Customer.findOne({ email: data.email });
    if (existing) throw new Error('Customer email already exists');

    const c = new Customer(data);
    await c.save();
    return c;
  }

  async updateCustomer(id: string, data: any) {
    const c = await Customer.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    if (!c) throw new Error('Customer not found');
    return c;
  }

  async delete(id: string) {
    const c = await Customer.findByIdAndDelete(id);
    if (!c) throw new Error('Customer not found');
    return { message: 'Customer deleted' };
  }

  async countAll() { return Customer.countDocuments(); }
}

export const customerService = new CustomerService();
