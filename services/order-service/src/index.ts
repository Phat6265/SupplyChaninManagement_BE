import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './config/database';
import { config } from './config/environment';
import { initRedis } from './utils/cache';
import { initEventBus } from './utils/eventBus';
import { deepHealthHandler } from './utils/healthCheck';
import {
  salesOrderRouter,
  purchaseOrderRouter,
  customerRouter,
  supplierRouter,
} from './routes/index';
import returnRouter from './routes/returns';

const app = express();
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/sales-orders', salesOrderRouter);
app.use('/api/purchase-orders', purchaseOrderRouter);
app.use('/api/customers', customerRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/returns', returnRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'order-service', timestamp: new Date().toISOString() });
});
app.get('/health/deep', deepHealthHandler('order-service'));

app.use((_req, res) => res.status(404).json({ success: false, message: 'Not found' }));

const startServer = async () => {
  try {
    await connectDatabase();
    initRedis();
    await initEventBus();
    app.listen(config.port, () => {
      console.log(`✅ [order-service] Running on port ${config.port}`);
    });
  } catch (err) {
    console.error('❌ [order-service] Failed to start:', err);
    process.exit(1);
  }
};

startServer();
export default app;
