import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';
import { stripe } from '@/utils/stripe/config';
import { revalidateTag } from 'next/cache';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/boats/renew
 * Renouvelle une annonce en ajoutant 3 mois à sa date de création.
 * Requires a valid Stripe PaymentIntent as proof of payment.
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
    const { boatId, paymentIntentId } = body;

    if (!boatId) {
      return NextResponse.json(
        { error: 'Boat ID is required' },
        { status: 400 }
      );
    }

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment verification required' },
        { status: 402 }
      );
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 402 }
      );
    }

    // Verify the payment was for this boat
    if (paymentIntent.metadata?.boat_id && paymentIntent.metadata.boat_id !== boatId) {
      return NextResponse.json(
        { error: 'Payment does not match this boat' },
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

    // Invalider le cache pour forcer le rafraîchissement des données utilisateur
    try {
      revalidateTag('user-data');
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
