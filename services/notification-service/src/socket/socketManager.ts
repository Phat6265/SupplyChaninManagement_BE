import { Server as IOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

let io: IOServer | null = null;

/**
 * Initialize Socket.IO with Redis adapter for horizontal scaling.
 * When running multiple notification-service instances, all instances
 * share the same Socket.IO rooms via Redis pub/sub.
 */
export const initSocketIO = async (httpServer: HttpServer, corsOrigin: string[]): Promise<IOServer> => {
  io = new IOServer(httpServer, {
    cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
    // Performance optimizations
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // ✅ Phase 4: Redis adapter for multi-instance Socket.IO
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  if (process.env.REDIS_URL) {
    try {
      const pubClient = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        retryStrategy: (times: number) => {
          if (times > 5) return null;
          return Math.min(times * 500, 3000);
        },
        lazyConnect: true,
      });
      const subClient = pubClient.duplicate();

      pubClient.on('connect', () => console.log('[socket.io] Redis pub client connected'));
      subClient.on('connect', () => console.log('[socket.io] Redis sub client connected'));
      pubClient.on('error', (err) => console.error('[socket.io] Redis pub error:', err.message));
      subClient.on('error', (err) => console.error('[socket.io] Redis sub error:', err.message));

      await pubClient.connect();
      await subClient.connect();

      io.adapter(createAdapter(pubClient, subClient));
      console.log('[socket.io] Redis adapter enabled — multi-instance ready');
    } catch (err: any) {
      console.warn('[socket.io] Redis adapter failed, running in single-instance mode:', err.message);
    }
  } else {
    console.log('[socket.io] No REDIS_URL set, running in single-instance mode');
  }

  io.on('connection', (socket) => {
    console.log(`[notification-service] Socket connected: ${socket.id}`);

    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
    });

    // ✅ Phase 4: Join role-based rooms for targeted broadcasts
    socket.on('join:role', (role: string) => {
      socket.join(`role:${role}`);
    });

    socket.on('disconnect', () => {
      console.log(`[notification-service] Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): IOServer | null => io;
