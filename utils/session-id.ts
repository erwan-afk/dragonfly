import crypto from 'crypto';

/**
 * Generate a deterministic session ID based on IP and user agent.
 * Used for anonymous view deduplication - same visitor = same sessionId.
 */
export function generateSessionId(
  ip: string | null,
  userAgent: string | null
): string {
  const data = `${ip || 'unknown'}-${userAgent || 'unknown'}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}
