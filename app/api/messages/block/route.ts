import { NextRequest, NextResponse } from 'next/server';
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

    const blocked = await prisma.blocked_user.findMany({
      where: { blockerId: session.user.id },
      select: { blockedId: true }
    });

    return NextResponse.json({
      blockedUserIds: blocked.map((b) => b.blockedId)
    });
  } catch (error) {
    console.error('❌ Error fetching blocked users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked users' },
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

    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot block yourself' },
        { status: 400 }
      );
    }

    await prisma.blocked_user.upsert({
      where: {
        blockerId_blockedId: { blockerId: session.user.id, blockedId: userId }
      },
      create: { blockerId: session.user.id, blockedId: userId },
      update: {}
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error blocking user:', error);
    return NextResponse.json(
      { error: 'Failed to block user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    await prisma.blocked_user.deleteMany({
      where: { blockerId: session.user.id, blockedId: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error unblocking user:', error);
    return NextResponse.json(
      { error: 'Failed to unblock user' },
      { status: 500 }
    );
  }
}
