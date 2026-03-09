import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma/client';
import { checkUser } from '@/utils/auth/check-user';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';

export const dynamic = 'force-dynamic';

const rateLimiter = createRateLimiter('admin_boat_status', 30, 60);

export async function POST(
  request: NextRequest,
  { params }: { params: { boatId: string } }
) {
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

    const { boatId } = params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!['pending', 'active', 'inactive', 'deleted'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await prisma.boat.update({
      where: { id: boatId },
      data: { status: status as any }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating boat status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
