import { NextRequest, NextResponse } from 'next/server';
import { checkUser } from '@/utils/auth/check-user';
import prisma from '@/utils/prisma/client';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';

export const dynamic = 'force-dynamic';

const rateLimiter = createRateLimiter('admin_update_user', 20, 60);

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

    const { userId, name } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cannot edit superAdmin unless you are superAdmin
    if (targetUser.role === 'superAdmin' && !userCheck.isSuperAdmin) {
      return NextResponse.json({ error: 'Cannot edit a super admin' }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 1 || name.length > 100) {
        return NextResponse.json({ error: 'Name must be between 1 and 100 characters' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    console.log(`✏️ Admin ${userCheck.user?.email} updated user ${userId}:`, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
