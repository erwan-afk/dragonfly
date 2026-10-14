import type { PrismaClient } from '@prisma/client';
import defaultPrisma from './prisma/client';

export interface EmailTrackingInput {
  type: string;
  to: string;
  subject?: string;
  userId?: string | null;
  boatId?: string | null;
  /** Result of nodemailer's sendMail, when the send succeeded */
  info?: { messageId?: string } | null;
  /** Error thrown by sendMail, when the send failed */
  error?: unknown;
}

/**
 * Record an outgoing email attempt. Never throws: tracking must not be able
 * to break (or hide the result of) a send. Never pass the email body here.
 */
export async function recordEmail(
  input: EmailTrackingInput,
  db: Pick<PrismaClient, 'email_event' | 'user'> = defaultPrisma
): Promise<void> {
  try {
    const to = input.to.trim().toLowerCase().slice(0, 255);
    let userId = input.userId ?? null;

    if (!userId) {
      const user = await db.user.findUnique({
        where: { email: to },
        select: { id: true }
      });
      userId = user?.id ?? null;
    }

    const failed = input.error !== undefined;
    await db.email_event.create({
      data: {
        type: input.type,
        status: failed ? 'failed' : 'sent',
        toEmail: to,
        userId,
        boatId: input.boatId ?? null,
        subject: input.subject?.slice(0, 300) ?? null,
        messageId: input.info?.messageId?.slice(0, 200) ?? null,
        error: failed
          ? (input.error instanceof Error ? input.error.message : String(input.error)).slice(0, 300)
          : null
      }
    });
  } catch (error) {
    console.error('Failed to record email event:', error);
  }
}
