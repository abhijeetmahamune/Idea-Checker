import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
let guestRateLimiter: Ratelimit | null = null;
let userRateLimiter: Ratelimit | null = null;

if (redisUrl && redisToken) {
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });

  // Guest Rate Limiter: Max 3 evaluations per 24 hours per guest ID / IP
  guestRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '86400 s'), // 24 hours
    analytics: true,
    prefix: 'ideachecker:ratelimit:guest',
  });

  // Logged-in User Rate Limiter: Max 10 evaluations per hour per user ID
  userRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '3600 s'), // 1 hour
    analytics: true,
    prefix: 'ideachecker:ratelimit:user',
  });
} else {
  console.warn('Upstash Redis environment variables are missing. Rate limiting is disabled.');
}

export async function checkRateLimit(
  identifier: string,
  isGuest: boolean
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  if (!redis) {
    // If Redis is not configured, fail-open (allow evaluations, but warn)
    return { success: true, limit: 999, remaining: 999, reset: Date.now() };
  }

  const limiter = isGuest ? guestRateLimiter : userRateLimiter;
  if (!limiter) {
    return { success: true, limit: 999, remaining: 999, reset: Date.now() };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('Rate limiting service error, falling back to open access:', error);
    return { success: true, limit: 999, remaining: 999, reset: Date.now() };
  }
}
