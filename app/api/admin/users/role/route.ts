import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma/client';
import { checkUser } from '@/utils/auth/check-user';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';

export const dynamic = 'force-dynamic';

const rateLimiter = createRateLimiter('admin_role', 10, 60);

export async function POST(request: NextRequest) {
  try {
    const userCheck = await checkUser();

    if (!userCheck.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (userCheck.isBanned) {
      return NextResponse.json({ error: 'Account is banned' }, { status: 403 });
    }

    // Only superAdmin can change roles
    if (!userCheck.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden - Super Admin required' }, { status: 403 });
    }

    // Rate limiting
    const rateLimitResponse = await checkRateLimit(rateLimiter, userCheck.user!.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Cannot change superAdmin role
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role === 'superAdmin') {
      return NextResponse.json({ error: 'Cannot change super admin role' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: role as any }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error changing role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
