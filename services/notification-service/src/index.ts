import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './config/database';
import { config } from './config/environment';
import { initRedis } from './utils/cache';
import { initEventBus } from './utils/eventBus';
import { registerNotificationConsumers } from './consumers/eventConsumer';
import { deepHealthHandler } from './utils/healthCheck';
import { initSocketIO } from './socket/socketManager';
import notificationRoutes from './routes/notifications';

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize Socket.IO
initSocketIO(server, config.corsOrigin);
console.log('✅ [notification-service] Socket.IO initialized');

app.use('/api/notifications', notificationRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'notification-service', timestamp: new Date().toISOString() });
});
app.get('/health/deep', deepHealthHandler('notification-service'));

app.use((_req, res) => res.status(404).json({ success: false, message: 'Not found' }));

const startServer = async () => {
  try {
    await connectDatabase();
    initRedis();
    await initEventBus();
    await registerNotificationConsumers();
    server.listen(config.port, () => {
      console.log(`✅ [notification-service] Running on port ${config.port}`);
      console.log(`🔌 Socket.IO ready`);
    });
  } catch (err) {
    console.error('❌ [notification-service] Failed to start:', err);
    process.exit(1);
  }
};

startServer();
export default app;
