import prisma from '@/utils/prisma/client';

export type AuthEventType =
  | 'signin'
  | 'signup'
  | 'reset_requested'
  | 'reset_completed'
  | 'oauth_start'
  | 'oauth_callback'
  | 'captcha'
  | 'rate_limited';

interface AuthEventInput {
  type: AuthEventType;
  success: boolean;
  email?: string | null;
  userId?: string | null;
  detail?: string | null;
  request?: Request;
}

export function getClientIP(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}

/**
 * Record an auth event. Never throws and never blocks the caller: logging
 * must not be able to break sign-in/sign-up. Never pass credentials here.
 */
export async function logAuthEvent(input: AuthEventInput): Promise<void> {
  try {
    const email = input.email?.trim().toLowerCase().slice(0, 255) || null;
    let userId = input.userId ?? null;

    if (!userId && email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });
      userId = user?.id ?? null;
    }

    await prisma.auth_event.create({
      data: {
        type: input.type,
        success: input.success,
        userId,
        email,
        detail: input.detail?.slice(0, 200) ?? null,
        ipAddress: input.request ? getClientIP(input.request) : null,
        userAgent: input.request?.headers.get('user-agent')?.slice(0, 300) ?? null,
        origin: input.request?.headers.get('origin')?.slice(0, 100) ?? null
      }
    });
  } catch (error) {
    console.error('Failed to log auth event:', error);
  }
}
