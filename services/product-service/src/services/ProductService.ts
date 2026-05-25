import { Product, IProduct } from '../models/Product';
import { cacheGet, cacheSet, cacheInvalidatePattern, cacheDel } from '../utils/cache';

const CACHE_PREFIX = 'products';
const CACHE_TTL = 300; // 5 minutes

export class ProductService {
  async getAllProducts(skip: number = 0, limit: number = 20) {
    const cacheKey = `${CACHE_PREFIX}:list:${skip}:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const products = await Product.find().skip(skip).limit(limit).lean();
    await cacheSet(cacheKey, products, CACHE_TTL);
    return products;
  }

  async getProductById(id: string) {
    const cacheKey = `${CACHE_PREFIX}:id:${id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const product = await Product.findById(id).lean();
    if (!product) throw new Error('Product not found');
    await cacheSet(cacheKey, product, CACHE_TTL);
    return product;
  }

  async getProductBySku(sku: string) {
    const cacheKey = `${CACHE_PREFIX}:sku:${sku}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const product = await Product.findOne({ sku }).lean();
    if (product) await cacheSet(cacheKey, product, CACHE_TTL);
    return product;
  }

  async getProductByBarcode(barcode: string) {
    const cacheKey = `${CACHE_PREFIX}:barcode:${barcode}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const product = await Product.findOne({ barcode }).lean();
    if (product) await cacheSet(cacheKey, product, CACHE_TTL);
    return product;
  }

  async createProduct(data: Partial<IProduct>) {
    const existingSku = await Product.findOne({ sku: data.sku });
    if (existingSku) throw new Error('Product with this SKU already exists');

    const existingBarcode = await Product.findOne({ barcode: data.barcode });
    if (existingBarcode) throw new Error('Product with this barcode already exists');

    const product = new Product(data);
    await product.save();

    // Invalidate list caches
    await cacheInvalidatePattern(`${CACHE_PREFIX}:list:*`);
    return product;
  }

  async updateProduct(id: string, data: Partial<IProduct>) {
    const product = await Product.findByIdAndUpdate(id, data, { new: true });
    if (!product) throw new Error('Product not found');

    // Invalidate specific + list caches
    await cacheDel(`${CACHE_PREFIX}:id:${id}`);
    await cacheInvalidatePattern(`${CACHE_PREFIX}:list:*`);
    await cacheInvalidatePattern(`${CACHE_PREFIX}:sku:*`);
    await cacheInvalidatePattern(`${CACHE_PREFIX}:barcode:*`);
    return product;
  }

  async deleteProduct(id: string) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw new Error('Product not found');

    // Invalidate all product caches
    await cacheInvalidatePattern(`${CACHE_PREFIX}:*`);
    return { message: 'Product deleted successfully' };
  }

  async searchProducts(query: string) {
    // Search results are NOT cached (dynamic queries)
    return Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { sku: { $regex: query, $options: 'i' } },
        { barcode: { $regex: query, $options: 'i' } },
      ],
    }).lean();
  }

  async countProducts() {
    const cacheKey = `${CACHE_PREFIX}:count`;
    const cached = await cacheGet<number>(cacheKey);
    if (cached !== null) return cached;

    const count = await Product.countDocuments();
    await cacheSet(cacheKey, count, 120); // 2 min TTL
    return count;
  }
}

export const productService = new ProductService();
