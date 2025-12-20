import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { getCurrentBoatPlan } from '@/utils/boats/payments';
import prisma from '@/utils/prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const boatId = params.id;

    // Vérifier que l'utilisateur est propriétaire du bateau
    const boat = await prisma.boat.findFirst({
      where: {
        id: boatId,
        userId: session.user.id
      }
    });

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found or unauthorized' }, { status: 404 });
    }

    const plan = await getCurrentBoatPlan(boatId);

    return NextResponse.json({
      success: true,
      plan
    });

  } catch (error) {
    console.error('Error fetching boat plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boat plan' },
      { status: 500 }
    );
  }
}
