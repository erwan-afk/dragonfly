import { NextRequest, NextResponse } from 'next/server';
import { checkUser } from '@/utils/auth/check-user';
import prisma from '@/utils/prisma/client';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';

export const dynamic = 'force-dynamic';

const rateLimiter = createRateLimiter('admin_delete_user', 10, 60);

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(
    rateLimiter,
    request.headers.get('x-forwarded-for') || 'unknown'
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const userCheck = await checkUser();
    if (!userCheck.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Cannot delete yourself
    if (userId === userCheck.user?.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cannot delete superAdmin
    if (targetUser.role === 'superAdmin') {
      return NextResponse.json({ error: 'Cannot delete a super admin' }, { status: 403 });
    }

    // Regular admin cannot delete other admins
    if (targetUser.role === 'admin' && !userCheck.isSuperAdmin) {
      return NextResponse.json({ error: 'Only super admins can delete admins' }, { status: 403 });
    }

    // Delete related data in order (respecting foreign keys)
    await prisma.$transaction([
      prisma.boat_view.deleteMany({ where: { userId } }),
      prisma.payment.deleteMany({ where: { userId } }),
      prisma.boat.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.customer.deleteMany({ where: { id: userId } }),
      prisma.user.delete({ where: { id: userId } })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
