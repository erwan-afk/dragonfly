import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/boats/my-active
 * Récupère toutes les annonces actives de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer toutes les annonces actives de l'utilisateur
    const boats = await prisma.boat.findMany({
      where: {
        userId: session.user.id,
        status: 'active'
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        model: true,
        price: true,
        country: true,
        description: true,
        photos: true,
        currency: true,
        specifications: true,
        vatPaid: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Convertir les Decimal en nombres pour la sérialisation JSON
    const serializedBoats = boats.map((boat) => ({
      ...boat,
      price: parseFloat(boat.price.toString())
    }));

    return NextResponse.json({
      success: true,
      boats: serializedBoats
    });
  } catch (error) {
    console.error('❌ Error fetching user active boats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boats' },
      { status: 500 }
    );
  }
}
