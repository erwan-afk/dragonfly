import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';
import { sendEmail, buildNewMessageEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MESSAGE_MAX_LENGTH = 2000;
const PAGE_SIZE = 50;

const messageSendLimiter = createRateLimiter('messages_message_send', 20, 300);

async function getParticipantConversation(conversationId: string, userId: string) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ buyerId: userId }, { sellerId: userId }]
    }
  });
}

async function notifyNewMessage(
  conversationId: string,
  recipientId: string,
  senderId: string
) {
  const [recipient, sender, conversation] = await Promise.all([
    prisma.user.findUnique({
      where: { id: recipientId },
      select: { name: true, email: true }
    }),
    prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true }
    }),
    prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { boat: { select: { model: true, email: true } } }
    })
  ]);

  if (!recipient?.email) return;

  const to = conversation?.boat?.email || recipient.email;
  const { subject, html, text } = buildNewMessageEmail({
    recipientName: recipient.name || 'there',
    senderName: sender?.name || 'A user',
    boatModel: conversation?.boat?.model || 'your listing',
    conversationId
  });

  await sendEmail(to, subject, html, text);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversation = await getParticipantConversation(
      params.id,
      session.user.id
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})
    });

    const hasMore = messages.length > PAGE_SIZE;
    const page = messages.slice(0, PAGE_SIZE);
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        readAt: null,
        senderId: { not: session.user.id }
      },
      data: { readAt: new Date() }
    });

    return NextResponse.json({
      messages: page.reverse(),
      nextCursor
    });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

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
      messageSendLimiter,
      session.user.id
    );
    if (rateLimitResponse) return rateLimitResponse;

    const conversation = await getParticipantConversation(
      params.id,
      session.user.id
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const text = typeof body?.body === 'string' ? body.body.trim() : '';

    if (!text) {
      return NextResponse.json({ error: 'Message is empty' }, { status: 400 });
    }
    if (text.length > MESSAGE_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Message must be less than ${MESSAGE_MAX_LENGTH} characters` },
        { status: 400 }
      );
    }

    const otherUserId =
      conversation.buyerId === session.user.id
        ? conversation.sellerId
        : conversation.buyerId;

    const blocked = await prisma.blocked_user.findFirst({
      where: {
        OR: [
          { blockerId: session.user.id, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: session.user.id }
        ]
      }
    });

    if (blocked) {
      return NextResponse.json(
        { error: 'You cannot message this user' },
        { status: 403 }
      );
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: session.user.id,
          body: text
        }
      }),
      prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() }
      })
    ]);

    // Disabled for now (SMTP credentials are invalid) — re-enable once
    // mail.infomaniak.com credentials are fixed.
    // void notifyNewMessage(conversation.id, otherUserId, session.user.id).catch(
    //   (error) => console.error('❌ Error sending notification email:', error)
    // );

    return NextResponse.json({ message });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
