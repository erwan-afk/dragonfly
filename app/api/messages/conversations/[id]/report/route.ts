import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';
import { sendEmail, buildReportEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const reportLimiter = createRateLimiter('messages_report', 5, 3600);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await checkRateLimit(
      reportLimiter,
      session.user.id
    );
    if (rateLimitResponse) return rateLimitResponse;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: params.id,
        OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }]
      },
      include: {
        boat: { select: { model: true } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason =
      typeof body?.reason === 'string' ? body.reason.slice(0, 500) : '';

    if (!process.env.CONTACT_EMAIL) {
      console.error(
        '❌ CONTACT_EMAIL is not set, cannot send report email'
      );
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const reporter =
      conversation.buyerId === session.user.id
        ? conversation.buyer
        : conversation.seller;
    const reported =
      conversation.buyerId === session.user.id
        ? conversation.seller
        : conversation.buyer;

    const { subject, html, text } = buildReportEmail({
      reporterName: reporter.name || 'A user',
      reporterEmail: session.user.email,
      reportedName: reported.name || 'A user',
      boatModel: conversation.boat?.model || null,
      reason,
      conversationId: conversation.id
    });

    await sendEmail(process.env.CONTACT_EMAIL, subject, html, text);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error reporting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to report conversation' },
      { status: 500 }
    );
  }
}
