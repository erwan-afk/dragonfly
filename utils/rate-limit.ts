import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextResponse } from 'next/server';

/**
 * Create a rate limiter instance for an API endpoint.
 * Uses in-memory storage (suitable for single-instance deployments).
 */
export function createRateLimiter(keyPrefix: string, points: number, durationSeconds: number) {
  return new RateLimiterMemory({
    keyPrefix,
    points,
    duration: durationSeconds,
  });
}

/**
 * Consume a rate limit point. Returns a 429 response if the limit is exceeded, or null if allowed.
 */
export async function checkRateLimit(
  limiter: RateLimiterMemory,
  key: string
): Promise<NextResponse | null> {
  try {
    await limiter.consume(key);
    return null;
  } catch {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
}
