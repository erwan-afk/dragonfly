import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';
import { revalidateTag, revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getBoatAndVerifyOwner(boatId: string, userId: string) {
  const rows = await prisma.$queryRaw`
    SELECT id, user_id, status FROM boats WHERE id = ${boatId}
  ` as any[];

  if (!rows || rows.length === 0) return { error: 'Boat not found', status: 404 };
  if (rows[0].user_id !== userId) return { error: 'Forbidden', status: 403 };
  return { boat: rows[0] };
}

// POST → mark as sold
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getBoatAndVerifyOwner(params.id, session.user.id);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (result.boat.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active listings can be marked as sold' },
        { status: 400 }
      );
    }

    await prisma.boat.update({
      where: { id: params.id },
      data: { status: 'sold', updatedAt: new Date() }
    });

    revalidateTag('user-data');
    revalidatePath('/account');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking boat as sold:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE → relist (sold → active)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getBoatAndVerifyOwner(params.id, session.user.id);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (result.boat.status !== 'sold') {
      return NextResponse.json(
        { error: 'Only sold listings can be relisted' },
        { status: 400 }
      );
    }

    await prisma.boat.update({
      where: { id: params.id },
      data: { status: 'active', updatedAt: new Date() }
    });

    revalidateTag('user-data');
    revalidatePath('/account');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error relisting boat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
