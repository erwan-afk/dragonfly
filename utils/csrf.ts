import crypto from 'crypto';
import prisma from '@/utils/prisma/client';

/**
 * Generate a CSRF token and store it in the database.
 * Returns { sessionId, token, expiresAt }.
 */
export async function generateCSRFToken(): Promise<{ sessionId: string; token: string; expiresAt: Date }> {
  const sessionId = crypto.randomUUID();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour

  await prisma.csrf_token.upsert({
    where: { sessionId },
    update: { token, expiresAt },
    create: { sessionId, token, expiresAt }
  });

  return { sessionId, token, expiresAt };
}

/**
 * Validate a CSRF token. Returns true if valid, false otherwise.
 * Also cleans up expired tokens opportunistically.
 */
export async function validateCSRFToken(sessionId: string, token: string): Promise<boolean> {
  if (!sessionId || !token) return false;

  try {
    const stored = await prisma.csrf_token.findUnique({
      where: { sessionId }
    });

    if (!stored) return false;

    // Check expiration
    if (stored.expiresAt < new Date()) {
      await prisma.csrf_token.delete({ where: { sessionId } }).catch(() => {});
      return false;
    }

    // Validate token (constant-time comparison)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(stored.token, 'hex'),
      Buffer.from(token, 'hex')
    );

    if (isValid) {
      // Delete used token (one-time use)
      await prisma.csrf_token.delete({ where: { sessionId } }).catch(() => {});
    }

    // Opportunistic cleanup: delete expired tokens (non-blocking)
    prisma.csrf_token.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    }).catch(() => {});

    return isValid;
  } catch {
    return false;
  }
}
