import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';

export const dynamic = 'force-dynamic';

const favoriteLimiter = createRateLimiter('favorite_toggle', 30, 60); // 30 toggles/min per user

// POST /api/favorites - Toggle a boat as favorite for the current user
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const rateLimitResponse = await checkRateLimit(favoriteLimiter, userId);
    if (rateLimitResponse) return rateLimitResponse;

    const { boatId } = await request.json();
    if (!boatId || typeof boatId !== 'string') {
      return NextResponse.json({ error: 'boatId is required' }, { status: 400 });
    }

    const boat = await prisma.boat.findFirst({ where: { id: boatId, status: 'active' } });
    if (!boat) {
      return NextResponse.json({ error: 'Boat not found or not active' }, { status: 404 });
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_boatId: { userId, boatId } }
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }

    await prisma.favorite.create({ data: { userId, boatId } });
    return NextResponse.json({ favorited: true });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
