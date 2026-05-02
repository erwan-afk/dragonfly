import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma/client';
import { checkUser } from '@/utils/auth/check-user';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';

export const dynamic = 'force-dynamic';

const rateLimiter = createRateLimiter('admin_boat_plan', 30, 60);

export async function PATCH(
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

    const rateLimitResponse = await checkRateLimit(rateLimiter, userCheck.user!.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { boatId } = params;
    const body = await request.json();
    const { productId } = body;

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.boat.update({
      where: { id: boatId },
      data: { productId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating boat plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
