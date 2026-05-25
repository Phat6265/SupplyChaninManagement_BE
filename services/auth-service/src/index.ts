import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './config/database';
import { config } from './config/environment';
import { errorHandler } from './utils/response';
import authRoutes from './routes/auth';
import auditLogRoutes from './routes/auditLogs';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// Error handler
app.use(errorHandler as any);

// Start
const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(config.port, () => {
      console.log(`✅ [auth-service] Running on port ${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      if (!config.rsaPrivateKey) {
        console.warn('⚠️  RSA keys not found! Run: npm run generate-keys');
      } else {
        console.log('🔑 RSA keys loaded successfully');
      }
    });

    process.on('SIGTERM', () => {
      console.log('[auth-service] SIGTERM received, shutting down...');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ [auth-service] Failed to start:', error);
    process.exit(1);
  }
};

startServer();

export default app;
