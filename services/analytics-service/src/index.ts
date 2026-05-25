import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/environment';
import { initRedis } from './utils/cache';
import { initEventBus } from './utils/eventBus';
import { registerAnalyticsConsumers } from './consumers/analyticsConsumer';
import analyticsRoutes from './routes/analytics';

const app = express();
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use('/api/analytics', analyticsRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'analytics-service', timestamp: new Date().toISOString() });
});

app.use((_req, res) => res.status(404).json({ success: false, message: 'Not found' }));

const startServer = async () => {
  initRedis();
  await initEventBus();
  await registerAnalyticsConsumers();
  app.listen(config.port, () => {
    console.log(`✅ [analytics-service] Running on port ${config.port}`);
    console.log(`📊 Analytics event consumers active`);
  });
};

startServer();
export default app;
