import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './config/database';
import { config } from './config/environment';
import { initRedis } from './utils/cache';
import { initEventBus } from './utils/eventBus';
import { deepHealthHandler } from './utils/healthCheck';
import shipmentRoutes from './routes/shipments';

const app = express();
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/shipments', shipmentRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'shipment-service', timestamp: new Date().toISOString() });
});
app.get('/health/deep', deepHealthHandler('shipment-service'));

app.use((_req, res) => res.status(404).json({ success: false, message: 'Not found' }));

const startServer = async () => {
  try {
    await connectDatabase();
    initRedis();
    await initEventBus();
    app.listen(config.port, () => {
      console.log(`✅ [shipment-service] Running on port ${config.port}`);
    });
  } catch (err) {
    console.error('❌ [shipment-service] Failed to start:', err);
    process.exit(1);
  }
};

startServer();
export default app;
