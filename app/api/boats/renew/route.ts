import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';
import { revalidateTag } from 'next/cache';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/boats/renew
 * Renouvelle une annonce en ajoutant 3 mois à sa date de création
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { boatId } = body;

    if (!boatId) {
      return NextResponse.json(
        { error: 'Boat ID is required' },
        { status: 400 }
      );
    }

    // Vérifier que l'annonce appartient à l'utilisateur et est active
    const boat = await prisma.boat.findFirst({
      where: {
        id: boatId,
        userId: session.user.id,
        status: 'active'
      }
    });

    if (!boat) {
      return NextResponse.json(
        { error: 'Boat not found or not active' },
        { status: 404 }
      );
    }

    // Ajouter 3 mois à la date de création pour prolonger la durée d'affichage
    const currentCreatedAt = new Date(boat.createdAt);
    const newCreatedAt = new Date(currentCreatedAt);
    newCreatedAt.setMonth(newCreatedAt.getMonth() + 3);

    // Mettre à jour l'annonce
    const updatedBoat = await prisma.boat.update({
      where: { id: boatId },
      data: {
        createdAt: newCreatedAt,
        updatedAt: new Date()
      }
    });

    console.log(
      `✅ Boat ${boatId} renewed: new createdAt is ${newCreatedAt.toISOString()}`
    );

    // Invalider le cache pour forcer le rafraîchissement des données utilisateur
    try {
      revalidateTag('user-data');
      console.log(`🔄 Cache invalidated for user data`);
    } catch (cacheError) {
      console.error(`⚠️ Error invalidating cache: ${cacheError}`);
    }

    return NextResponse.json({
      success: true,
      boat: {
        ...updatedBoat,
        price: parseFloat(updatedBoat.price.toString())
      }
    });
  } catch (error) {
    console.error('❌ Error renewing boat:', error);
    return NextResponse.json(
      { error: 'Failed to renew boat' },
      { status: 500 }
    );
  }
}
