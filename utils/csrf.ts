import crypto from 'crypto';

// Store tokens in memory (in production, use Redis or database)
export const tokenStore = new Map<string, { token: string; timestamp: number; ip: string }>();

// Clean expired tokens every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const oneHour = 3600000;

    Array.from(tokenStore.entries()).forEach(([sessionId, data]) => {
      if (now - data.timestamp > oneHour) {
        tokenStore.delete(sessionId);
      }
    });
  }, 3600000);
}

export function validateCSRFToken(sessionId: string, token: string, ip: string): boolean {
  const stored = tokenStore.get(sessionId);
  if (!stored) return false;

  if (stored.token !== token) return false;

  const now = Date.now();
  if (now - stored.timestamp > 3600000) {
    tokenStore.delete(sessionId);
    return false;
  }

  if (stored.ip !== ip) return false;

  return true;
}
