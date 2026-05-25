import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './config/database';
import { config } from './config/environment';
import { initRedis } from './utils/cache';
import { deepHealthHandler } from './utils/healthCheck';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';

const app = express();
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'product-service', timestamp: new Date().toISOString() });
});
app.get('/health/deep', deepHealthHandler('product-service'));

app.use((_req, res) => res.status(404).json({ success: false, message: 'Not found' }));

const startServer = async () => {
  try {
    await connectDatabase();
    initRedis();
    app.listen(config.port, () => {
      console.log(`✅ [product-service] Running on port ${config.port}`);
    });
  } catch (err) {
    console.error('❌ [product-service] Failed to start:', err);
    process.exit(1);
  }
};

startServer();
export default app;
