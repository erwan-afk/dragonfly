import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/config';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';
import { createBoatPaymentRecord } from '@/utils/boats/payments';
import { moveTempImagesToBoat, urlToKey } from '@/utils/cloudflare/r2';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

/**
 * Direct boat activation after payment succeeds client-side.
 * This endpoint verifies the PaymentIntent with Stripe and activates the boat,
 * so we don't rely solely on webhooks (which may be delayed or miss in dev).
 * The webhook handler remains as an idempotent backup.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentIntentId, boatId } = await req.json();

    if (!paymentIntentId || !boatId) {
      return NextResponse.json(
        { error: 'Missing paymentIntentId or boatId' },
        { status: 400 }
      );
    }

    // 1. Verify PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: `Payment not succeeded (status: ${paymentIntent.status})` },
        { status: 400 }
      );
    }

    // 1b. Replay attack protection: verify the PaymentIntent was created for this boat
    if (paymentIntent.metadata?.boat_id && paymentIntent.metadata.boat_id !== boatId) {
      return NextResponse.json(
        { error: 'Payment intent does not match this boat' },
        { status: 400 }
      );
    }

    // 2. Verify boat exists and belongs to the current user
    const boat = await prisma.boat.findUnique({
      where: { id: boatId },
      select: { id: true, status: true, photos: true, userId: true }
    });

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    if (boat.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Idempotent: if already active, return success
    if (boat.status === 'active') {
      return NextResponse.json({ success: true, alreadyActive: true });
    }

    if (boat.status !== 'pending') {
      return NextResponse.json(
        { error: `Boat is ${boat.status}, cannot activate` },
        { status: 400 }
      );
    }

    // 4. Activate the boat
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 3);

    await prisma.boat.update({
      where: { id: boatId },
      data: { status: 'active', expiresAt }
    });

    console.log(`✅ [confirm-boat-payment] Boat ${boatId} activated directly`);

    // 5. Create payment record (idempotent via createBoatPaymentRecord)
    const pseudoSession: any = {
      id: paymentIntentId,
      payment_intent: paymentIntentId,
      customer: paymentIntent.customer,
      amount_total: paymentIntent.amount,
      currency: paymentIntent.currency,
      payment_status: 'paid',
      metadata: paymentIntent.metadata
    };

    await createBoatPaymentRecord(pseudoSession, boatId, user.id);

    // 6. Update productId if present
    const productId = paymentIntent.metadata?.product_id;
    if (productId) {
      await prisma.boat.update({
        where: { id: boatId },
        data: { productId }
      });
    }

    // 7. Move temp images to final location
    if (boat.photos && boat.photos.length > 0) {
      const tempKeys: string[] = [];

      for (const photoUrl of boat.photos) {
        let key = photoUrl;
        if (photoUrl.startsWith('http')) {
          key = urlToKey(photoUrl as string) || '';
        } else if (photoUrl.startsWith('dragonfly-trimarans.org/')) {
          key = photoUrl.replace('dragonfly-trimarans.org/', '');
        }
        if (key && key.includes('temp_session_')) {
          tempKeys.push(key);
        }
      }

      if (tempKeys.length > 0) {
        const moveResult = await moveTempImagesToBoat(tempKeys, boatId);
        if (moveResult.success && moveResult.finalUrls.length > 0) {
          await prisma.boat.update({
            where: { id: boatId },
            data: { photos: moveResult.finalUrls }
          });
        }
      }
    }

    // 8. Invalidate cache
    try {
      revalidateTag('user-data');
    } catch (_) {
      // Cache invalidation is best-effort
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [confirm-boat-payment] error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
