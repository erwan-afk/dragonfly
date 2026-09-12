import { NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const unreadMessages = await prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: session.user.id },
        conversation: {
          OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }]
        }
      }
    });

    return NextResponse.json({ count: unreadMessages });
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
