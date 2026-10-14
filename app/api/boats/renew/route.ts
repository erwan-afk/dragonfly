import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';
import { stripe } from '@/utils/stripe/config';
import { revalidateTag } from 'next/cache';
import { computeRenewedExpiry } from '@/utils/boats/renewal';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/boats/renew
 * Renews a listing for 3 months (extends expiresAt, reactivates an expired
 * listing) and records the payment.
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

    // Idempotence: the client calls this endpoint after paying, and a retry
    // (double click, reload) must never extend the listing a second time.
    const alreadyProcessed = await prisma.payment.findFirst({
      where: { stripeSessionId: paymentIntentId },
      select: { id: true }
    });
    if (alreadyProcessed) {
      return NextResponse.json({ success: true, alreadyRenewed: true });
    }

    // The listing must belong to the user. Expired listings (status
    // "inactive", or "active" with a past expiry) are the ones that need a
    // renewal, so they are accepted too.
    const boat = await prisma.boat.findFirst({
      where: {
        id: boatId,
        userId: session.user.id,
        status: { in: ['active', 'inactive'] }
      }
    });

    if (!boat) {
      return NextResponse.json(
        { error: 'Boat not found or not eligible for renewal' },
        { status: 404 }
      );
    }

    // Extend the real expiry date (expiresAt is what hides a listing and
    // what the reminder job looks at), and record the payment in the same
    // transaction.
    const now = new Date();
    const newExpiresAt = computeRenewedExpiry(boat.expiresAt, now);

    let updatedBoat;
    try {
      [, updatedBoat] = await prisma.$transaction([
        prisma.payment.create({
          data: {
            userId: session.user.id,
            boatId,
            productId: paymentIntent.metadata?.product_id || null,
            amount: paymentIntent.amount / 100,
            status: 'completed',
            stripeSessionId: paymentIntentId,
            createdAt: now
          }
        }),
        prisma.boat.update({
          where: { id: boatId },
          data: { status: 'active', expiresAt: newExpiresAt, updatedAt: now }
        })
      ]);
    } catch (txError: any) {
      // Unique constraint on stripeSessionId: a concurrent request won the race
      if (txError?.code === 'P2002') {
        return NextResponse.json({ success: true, alreadyRenewed: true });
      }
      throw txError;
    }

    // Invalider le cache pour forcer le rafraîchissement des données utilisateur
    try {
      revalidateTag('user-data');
      revalidateTag('boats');
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
