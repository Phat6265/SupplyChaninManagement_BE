import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './config/database';
import { config } from './config/environment';
import { initRedis } from './utils/cache';
import { initEventBus } from './utils/eventBus';
import { registerInventoryConsumers } from './consumers/orderConsumer';
import { deepHealthHandler } from './utils/healthCheck';
import inventoryRoutes from './routes/inventory';
import warehouseRoutes from './routes/warehouses';

const app = express();
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/inventory', inventoryRoutes);
app.use('/api/warehouses', warehouseRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'inventory-service', timestamp: new Date().toISOString() });
});
app.get('/health/deep', deepHealthHandler('inventory-service'));

app.use((_req, res) => res.status(404).json({ success: false, message: 'Not found' }));

const startServer = async () => {
  try {
    await connectDatabase();
    initRedis();
    await initEventBus();
    await registerInventoryConsumers();
    app.listen(config.port, () => {
      console.log(`✅ [inventory-service] Running on port ${config.port}`);
    });
  } catch (err) {
    console.error('❌ [inventory-service] Failed to start:', err);
    process.exit(1);
  }
};

startServer();
export default app;
