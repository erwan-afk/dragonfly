import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const conversationCreateLimiter = createRateLimiter('messages_conversation_create', 10, 60);

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }]
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        boat: {
          select: { id: true, model: true, photos: true, status: true }
        },
        buyer: {
          select: { id: true, name: true, avatar_url: true }
        },
        seller: {
          select: { id: true, name: true, avatar_url: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            messages: {
              where: { readAt: null, senderId: { not: session.user.id } }
            }
          }
        }
      }
    });

    const result = conversations.map((conversation) => {
      const otherUser =
        conversation.buyerId === session.user.id
          ? conversation.seller
          : conversation.buyer;

      return {
        id: conversation.id,
        boat: conversation.boat,
        otherUser,
        lastMessage: conversation.messages[0] || null,
        unreadCount: conversation._count.messages,
        lastMessageAt: conversation.lastMessageAt
      };
    });

    return NextResponse.json({ conversations: result });
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await checkRateLimit(
      conversationCreateLimiter,
      session.user.id
    );
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { boatId } = body;

    if (!boatId || typeof boatId !== 'string') {
      return NextResponse.json({ error: 'Missing boatId' }, { status: 400 });
    }

    const boat = await prisma.boat.findUnique({
      where: { id: boatId },
      select: { id: true, userId: true, status: true }
    });

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    if (boat.userId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot message yourself about your own listing' },
        { status: 400 }
      );
    }

    // An existing conversation stays reachable even if the listing's status
    // has since changed (sold, inactive, etc). Only a brand new conversation
    // requires an active listing.
    const existing = await prisma.conversation.findUnique({
      where: { boatId_buyerId: { boatId, buyerId: session.user.id } }
    });

    if (existing) {
      return NextResponse.json({ conversationId: existing.id });
    }

    if (boat.status !== 'active') {
      return NextResponse.json(
        { error: 'This listing is no longer available' },
        { status: 400 }
      );
    }

    const blocked = await prisma.blocked_user.findFirst({
      where: {
        OR: [
          { blockerId: session.user.id, blockedId: boat.userId },
          { blockerId: boat.userId, blockedId: session.user.id }
        ]
      }
    });

    if (blocked) {
      return NextResponse.json(
        { error: 'You cannot contact this user' },
        { status: 403 }
      );
    }

    const conversation = await prisma.conversation.create({
      data: {
        boatId,
        buyerId: session.user.id,
        sellerId: boat.userId
      }
    });

    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
