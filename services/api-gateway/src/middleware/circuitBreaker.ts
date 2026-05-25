import CircuitBreaker from 'opossum';

interface CircuitBreakerOptions {
  timeout?: number;       // Time in ms before request is considered failed
  errorThresholdPercentage?: number;  // % failures before opening circuit
  resetTimeout?: number;  // Time in ms before trying again after circuit opens
  volumeThreshold?: number; // Min number of requests before evaluating
}

const defaultOptions: CircuitBreakerOptions = {
  timeout: 10000,                  // 10 seconds
  errorThresholdPercentage: 50,    // Open circuit if 50% fail
  resetTimeout: 15000,             // Try again after 15 seconds
  volumeThreshold: 5,              // Need at least 5 requests before evaluating
};

// Store circuit breakers per service
const breakers = new Map<string, CircuitBreaker>();

/**
 * Get or create a circuit breaker for a downstream service.
 * When the circuit is open, requests fail-fast with 503 instead of timing out.
 */
export const getCircuitBreaker = (
  serviceName: string,
  action: (...args: any[]) => Promise<any>,
  options?: CircuitBreakerOptions,
): CircuitBreaker => {
  if (breakers.has(serviceName)) {
    return breakers.get(serviceName)!;
  }

  const mergedOpts = { ...defaultOptions, ...options };
  const breaker = new CircuitBreaker(action, mergedOpts);

  breaker.on('open', () => {
    console.warn(`🔴 [circuit-breaker] ${serviceName} — circuit OPENED (too many failures)`);
  });
  breaker.on('halfOpen', () => {
    console.info(`🟡 [circuit-breaker] ${serviceName} — circuit HALF-OPEN (testing)`);
  });
  breaker.on('close', () => {
    console.info(`🟢 [circuit-breaker] ${serviceName} — circuit CLOSED (healthy)`);
  });
  breaker.on('fallback', () => {
    console.warn(`⚡ [circuit-breaker] ${serviceName} — fallback triggered`);
  });

  breakers.set(serviceName, breaker);
  return breaker;
};

/**
 * Get health status of all circuit breakers for monitoring.
 */
export const getCircuitBreakerStats = (): Record<string, any> => {
  const stats: Record<string, any> = {};
  breakers.forEach((breaker, name) => {
    stats[name] = {
      state: breaker.opened ? 'OPEN' : breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
      stats: {
        fires: (breaker as any).stats?.fires || 0,
        failures: (breaker as any).stats?.failures || 0,
        successes: (breaker as any).stats?.successes || 0,
        timeouts: (breaker as any).stats?.timeouts || 0,
        fallbacks: (breaker as any).stats?.fallbacks || 0,
      },
    };
  });
  return stats;
};
