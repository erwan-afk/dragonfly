import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma/client';
import { checkUser } from '@/utils/auth/check-user';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';
import { logAdminAction } from '@/utils/audit-log';

export const dynamic = 'force-dynamic';

const rateLimiter = createRateLimiter('admin_ban', 10, 60); // 10 requests per minute

export async function POST(request: NextRequest) {
  try {
    const userCheck = await checkUser();

    if (!userCheck.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (userCheck.isBanned) {
      return NextResponse.json({ error: 'Account is banned' }, { status: 403 });
    }

    if (!userCheck.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rate limiting
    const rateLimitResponse = await checkRateLimit(rateLimiter, userCheck.user!.id);
    if (rateLimitResponse) return rateLimitResponse;

    const currentUser = userCheck.user!;

    const body = await request.json();
    const { userId, ban } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Check target user's role - cannot ban admins unless you're superAdmin
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role === 'superAdmin') {
      return NextResponse.json({ error: 'Cannot ban super admin' }, { status: 403 });
    }

    if (targetUser.role === 'admin' && !userCheck.isSuperAdmin) {
      return NextResponse.json({ error: 'Only super admin can ban admins' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { banned: ban }
    });

    // Audit log
    logAdminAction({
      action: ban ? 'USER_BANNED' : 'USER_UNBANNED',
      adminId: currentUser.id,
      adminEmail: currentUser.email,
      targetId: userId,
      targetType: 'user',
      details: { ban }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
