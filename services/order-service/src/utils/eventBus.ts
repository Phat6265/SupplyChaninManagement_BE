import amqp from 'amqplib';

const EXCHANGE_NAME = 'smartwarehouse.events';
const EXCHANGE_TYPE = 'topic';

let connection: amqp.ChannelModel | null = null;
let channel: amqp.Channel | null = null;

/**
 * Connect to RabbitMQ and create a topic exchange.
 * Call once at service startup.
 */
export const initEventBus = async (url?: string): Promise<amqp.Channel> => {
  const rmqUrl = url || process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';

  const connectWithRetry = async (retries = 10, delay = 3000): Promise<void> => {
    for (let i = 0; i < retries; i++) {
      try {
        connection = await amqp.connect(rmqUrl);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

        console.log('[eventBus] RabbitMQ connected');
        return;
      } catch (err: any) {
        console.warn(`[eventBus] RabbitMQ connect attempt ${i + 1}/${retries} failed: ${err.message}`);
        if (i < retries - 1) await new Promise((r) => setTimeout(r, delay));
      }
    }
    console.error('[eventBus] Could not connect to RabbitMQ after retries');
  };

  await connectWithRetry();
  return channel!;
};

/**
 * Publish an event to the topic exchange.
 * @param routingKey - e.g. 'order.created', 'shipment.updated'
 * @param data - event payload (will be JSON stringified)
 */
export const publishEvent = async (routingKey: string, data: any): Promise<boolean> => {
  if (!channel) {
    console.warn('[eventBus] Channel not ready, event dropped:', routingKey);
    return false;
  }
  try {
    const message = Buffer.from(JSON.stringify({
      event: routingKey,
      timestamp: new Date().toISOString(),
      data,
    }));
    channel.publish(EXCHANGE_NAME, routingKey, message, { persistent: true });
    return true;
  } catch (err: any) {
    console.error('[eventBus] Publish error:', err.message);
    return false;
  }
};

/**
 * Subscribe to events matching a routing key pattern.
 * @param queueName - unique queue name for this consumer (e.g. 'inventory-service.order-events')
 * @param bindingKeys - array of routing key patterns (e.g. ['order.created', 'order.cancelled'])
 * @param handler - callback function to process each message
 */
export const subscribeEvent = async (
  queueName: string,
  bindingKeys: string[],
  handler: (routingKey: string, data: any) => Promise<void>
): Promise<void> => {
  if (!channel) {
    console.warn('[eventBus] Channel not ready, cannot subscribe');
    return;
  }

  // Assert queue with dead-letter exchange
  await channel.assertQueue(queueName, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': `${EXCHANGE_NAME}.dlx`,
      'x-dead-letter-routing-key': `${queueName}.dead`,
    },
  });

  // Bind queue to each routing key pattern
  for (const key of bindingKeys) {
    await channel.bindQueue(queueName, EXCHANGE_NAME, key);
  }

  // Prefetch 10 messages at a time for flow control
  await channel.prefetch(10);

  channel.consume(queueName, async (msg) => {
    if (!msg) return;
    try {
      const parsed = JSON.parse(msg.content.toString());
      await handler(msg.fields.routingKey, parsed.data || parsed);
      channel!.ack(msg);
    } catch (err: any) {
      console.error(`[eventBus] Handler error for ${msg.fields.routingKey}:`, err.message);
      // Reject and don't requeue (send to DLQ)
      channel!.nack(msg, false, false);
    }
  });

  console.log(`[eventBus] Subscribed: ${queueName} → [${bindingKeys.join(', ')}]`);
};

/**
 * Gracefully close the RabbitMQ connection.
 */
export const closeEventBus = async (): Promise<void> => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } catch {}
};
